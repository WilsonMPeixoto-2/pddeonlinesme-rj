-- Financial Publication Pipeline V1
-- Gate explícito por dimensão + publicação transacional da projeção financeira.
-- Metadados desta migration são internos e não pertencem à superfície operacional.

-- ---------------------------------------------------------------------------
-- Proveniência idempotente da integração
-- ---------------------------------------------------------------------------
ALTER TABLE public.integracoes_financeiras_runs
  ADD COLUMN IF NOT EXISTS artifact_name text,
  ADD COLUMN IF NOT EXISTS snapshot_digest text;

ALTER TABLE public.integracoes_financeiras_runs
  DROP CONSTRAINT IF EXISTS integracoes_financeiras_runs_snapshot_digest_check;

ALTER TABLE public.integracoes_financeiras_runs
  ADD CONSTRAINT integracoes_financeiras_runs_snapshot_digest_check
  CHECK (snapshot_digest IS NULL OR snapshot_digest ~ '^[0-9a-f]{64}$');

CREATE UNIQUE INDEX IF NOT EXISTS uq_integracoes_financeiras_runs_source
  ON public.integracoes_financeiras_runs (origem, workflow_run_id, artifact_id)
  WHERE workflow_run_id IS NOT NULL AND artifact_id IS NOT NULL;

-- Auditoria de integração deixa de ser legível pelo usuário comum.
DROP POLICY IF EXISTS "Authenticated can read integracoes_financeiras_runs"
  ON public.integracoes_financeiras_runs;
REVOKE ALL ON public.integracoes_financeiras_runs FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Contrato versionado das dimensões publicáveis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_dimension_contracts (
  dimension_key text NOT NULL,
  exercise integer NOT NULL,
  contract_version integer NOT NULL DEFAULT 1 CHECK (contract_version > 0),
  coverage_expected integer NOT NULL CHECK (coverage_expected > 0),
  coverage_required_ratio numeric(8,6) NOT NULL CHECK (
    coverage_required_ratio > 0 AND coverage_required_ratio <= 1
  ),
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dimension_key, exercise)
);

ALTER TABLE public.financial_dimension_contracts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.financial_dimension_contracts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_dimension_contracts TO service_role;

CREATE TABLE IF NOT EXISTS public.financial_dimension_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_key text NOT NULL,
  exercise integer NOT NULL,
  integration_run_id uuid NOT NULL REFERENCES public.integracoes_financeiras_runs(id) ON DELETE RESTRICT,
  coverage_observed integer NOT NULL CHECK (coverage_observed >= 0),
  coverage_expected integer NOT NULL CHECK (coverage_expected > 0),
  coverage_ratio numeric(8,6) NOT NULL CHECK (coverage_ratio >= 0 AND coverage_ratio <= 1),
  reference_date_min date,
  reference_date_max date,
  quality_status text NOT NULL CHECK (quality_status IN ('COLLECTING', 'VALIDATED', 'MATURE', 'REJECTED')),
  publication_status text NOT NULL CHECK (publication_status IN ('UNPUBLISHED', 'PUBLISHED', 'WITHDRAWN')),
  source_snapshot_digest text,
  validated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_dimension_status_contract_fkey
    FOREIGN KEY (dimension_key, exercise)
    REFERENCES public.financial_dimension_contracts(dimension_key, exercise)
    ON DELETE RESTRICT,
  CONSTRAINT financial_dimension_status_reference_dates_check
    CHECK (reference_date_min IS NULL OR reference_date_max IS NULL OR reference_date_min <= reference_date_max),
  CONSTRAINT financial_dimension_status_digest_check
    CHECK (source_snapshot_digest IS NULL OR source_snapshot_digest ~ '^[0-9a-f]{64}$'),
  CONSTRAINT financial_dimension_status_publication_dates_check
    CHECK (
      (publication_status = 'PUBLISHED' AND published_at IS NOT NULL AND withdrawn_at IS NULL)
      OR (publication_status = 'WITHDRAWN' AND published_at IS NOT NULL AND withdrawn_at IS NOT NULL)
      OR (publication_status = 'UNPUBLISHED' AND published_at IS NULL)
    ),
  UNIQUE (dimension_key, integration_run_id)
);

ALTER TABLE public.financial_dimension_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.financial_dimension_status FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_dimension_status TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_dimension_status_current_published
  ON public.financial_dimension_status (dimension_key, exercise)
  WHERE publication_status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_financial_dimension_status_run
  ON public.financial_dimension_status (integration_run_id);

INSERT INTO public.financial_dimension_contracts (
  dimension_key,
  exercise,
  contract_version,
  coverage_expected,
  coverage_required_ratio,
  requirements,
  enabled
)
VALUES
  ('bank_accounts', 2026, 1, 163, 1.000000, '{"requires_account_identity":true}'::jsonb, true),
  ('scheduled_repasses', 2026, 1, 163, 1.000000, '{"requires_programmed_amount":true}'::jsonb, true),
  ('pdde_basic_first_installment', 2026, 1, 163, 1.000000, '{"requires_paid_amount":true,"requires_payment_date":true}'::jsonb, true),
  ('pdde_basic_first_installment_breakdown', 2026, 1, 163, 1.000000, '{"requires_paid_amount":true,"requires_payment_date":true,"requires_breakdown":true}'::jsonb, true),
  ('pdde_basic_second_installment_programmed', 2026, 1, 163, 1.000000, '{"requires_programmed_amount":true}'::jsonb, true)
ON CONFLICT (dimension_key, exercise) DO UPDATE
SET contract_version = EXCLUDED.contract_version,
    coverage_expected = EXCLUDED.coverage_expected,
    coverage_required_ratio = EXCLUDED.coverage_required_ratio,
    requirements = EXCLUDED.requirements,
    enabled = EXCLUDED.enabled,
    updated_at = now();

CREATE OR REPLACE VIEW public.vw_financial_dimension_publication
WITH (security_invoker = true)
AS
SELECT
  s.dimension_key,
  s.exercise,
  s.coverage_observed,
  s.coverage_expected,
  s.coverage_ratio,
  s.reference_date_min,
  s.reference_date_max,
  s.quality_status,
  s.publication_status,
  s.validated_at,
  s.published_at
FROM public.financial_dimension_status AS s
WHERE s.publication_status = 'PUBLISHED';

REVOKE ALL ON public.vw_financial_dimension_publication FROM anon, authenticated;
GRANT SELECT ON public.vw_financial_dimension_publication TO service_role;

-- ---------------------------------------------------------------------------
-- Publicação atômica
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_financial_snapshot_v1(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_exercise integer;
  v_origin text;
  v_published_at timestamptz;
  v_workflow_run_id bigint;
  v_artifact_id bigint;
  v_artifact_name text;
  v_digest text;
  v_school_count integer;
  v_school_distinct integer;
  v_known_schools integer;
  v_account_count integer;
  v_account_coverage integer;
  v_scheduled_coverage integer;
  v_first_coverage integer;
  v_breakdown_coverage integer;
  v_second_coverage integer;
  v_first_date_min date;
  v_first_date_max date;
  v_invalid_breakdown integer;
  v_invalid_repasses integer;
  v_duplicate_accounts integer;
  v_duplicate_repasses integer;
  v_invalid_explicit_accounts integer;
  v_invalid_primary integer;
  v_repasse_count integer;
  v_existing_run_id uuid;
  v_existing_digest text;
  v_latest_run_id bigint;
  v_run_id uuid;
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'payload financeiro deve ser um objeto JSON'
      USING ERRCODE = '22023';
  END IF;

  v_exercise := NULLIF(p_payload->>'exercise', '')::integer;
  v_origin := p_payload->'source'->>'origin';
  v_published_at := NULLIF(p_payload->'source'->>'publishedAt', '')::timestamptz;
  v_workflow_run_id := NULLIF(p_payload->'source'->>'workflowRunId', '')::bigint;
  v_artifact_id := NULLIF(p_payload->'source'->>'artifactId', '')::bigint;
  v_artifact_name := p_payload->'source'->>'artifactName';
  v_digest := lower(p_payload->'source'->>'snapshotDigest');

  IF v_exercise IS DISTINCT FROM 2026 THEN
    RAISE EXCEPTION 'exercicio financeiro nao autorizado: %', v_exercise
      USING ERRCODE = '22023';
  END IF;
  IF v_origin IS DISTINCT FROM 'pdde-repasse-conciliador' THEN
    RAISE EXCEPTION 'origem financeira nao autorizada: %', coalesce(v_origin, '(nula)')
      USING ERRCODE = '22023';
  END IF;
  IF v_published_at IS NULL OR v_workflow_run_id IS NULL OR v_workflow_run_id <= 0
     OR v_artifact_id IS NULL OR v_artifact_id <= 0
     OR v_digest IS NULL OR v_digest !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'proveniencia financeira incompleta ou invalida'
      USING ERRCODE = '22023';
  END IF;

  -- Serializa a troca do retrato financeiro de um mesmo exercício.
  PERFORM pg_advisory_xact_lock(hashtextextended('pdde-financial-publication:' || v_exercise::text, 0));

  SELECT max(workflow_run_id)
    INTO v_latest_run_id
    FROM public.integracoes_financeiras_runs
   WHERE exercicio = v_exercise
     AND origem = v_origin
     AND workflow_run_id IS NOT NULL
     AND publicado_em IS NOT NULL;

  IF v_latest_run_id IS NOT NULL AND v_workflow_run_id < v_latest_run_id THEN
    RAISE EXCEPTION 'run regressiva bloqueada: recebida %, vigente %', v_workflow_run_id, v_latest_run_id
      USING ERRCODE = '22023';
  END IF;

  -- Cobertura e identidade escolar.
  SELECT count(*), count(DISTINCT s.inep)
    INTO v_school_count, v_school_distinct
    FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(
      inep text,
      sme text,
      name text
    );

  IF v_school_count <> 163 OR v_school_distinct <> 163 THEN
    RAISE EXCEPTION 'snapshot deve conter exatamente 163 INEPs unicos: linhas %, unicos %', v_school_count, v_school_distinct
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT s.inep)
    INTO v_known_schools
    FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(
      inep text,
      sme text,
      name text
    )
    JOIN public.unidades_escolares AS u ON u.inep = s.inep;

  IF v_known_schools <> 163 THEN
    RAISE EXCEPTION 'nem todos os INEPs do snapshot existem no PDDE Online: %/163', v_known_schools
      USING ERRCODE = '23503';
  END IF;

  -- Contas: identidade completa, sem duplicidade e exatamente uma principal por escola.
  SELECT count(*), count(DISTINCT a.inep)
    INTO v_account_count, v_account_coverage
    FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
      inep text,
      exercise integer,
      program text,
      bank text,
      agency text,
      account text,
      primary boolean
    )
   WHERE a.exercise = v_exercise
     AND nullif(btrim(a.bank), '') IS NOT NULL
     AND nullif(btrim(a.agency), '') IS NOT NULL
     AND nullif(btrim(a.account), '') IS NOT NULL;

  IF v_account_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao bank_accounts imatura: %/163', v_account_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*)
    INTO v_duplicate_accounts
    FROM (
      SELECT a.inep, a.program, a.bank, a.agency, a.account
        FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
          inep text,
          exercise integer,
          program text,
          bank text,
          agency text,
          account text,
          primary boolean
        )
       GROUP BY a.inep, a.program, a.bank, a.agency, a.account
      HAVING count(*) > 1
    ) AS duplicated;

  IF v_duplicate_accounts > 0 THEN
    RAISE EXCEPTION 'contas duplicadas no snapshot: %', v_duplicate_accounts
      USING ERRCODE = '23505';
  END IF;

  SELECT count(*)
    INTO v_invalid_primary
    FROM (
      SELECT s.inep
        FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
        LEFT JOIN jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
          inep text,
          exercise integer,
          program text,
          bank text,
          agency text,
          account text,
          primary boolean
        ) ON a.inep = s.inep AND a.exercise = v_exercise AND coalesce(a.primary, false)
       GROUP BY s.inep
      HAVING count(a.account) <> 1
    ) AS invalid_primary;

  IF v_invalid_primary > 0 THEN
    RAISE EXCEPTION 'cada escola deve possuir exatamente uma conta principal: % divergencias', v_invalid_primary
      USING ERRCODE = '22023';
  END IF;

  -- Repasses: valores programados são obrigatórios; ausência de pagamento permanece NULL.
  SELECT count(*)
    INTO v_repasse_count
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    );

  SELECT count(*)
    INTO v_invalid_repasses
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.exercise IS DISTINCT FROM v_exercise
      OR r.programmed IS NULL OR r.programmed < 0
      OR r.paid < 0
      OR r."programmedCusteio" < 0 OR r."programmedCapital" < 0
      OR r."paidCusteio" < 0 OR r."paidCapital" < 0
      OR (r."programmedCusteio" IS NOT NULL AND r."programmedCapital" IS NOT NULL
          AND r."programmedCusteio" + r."programmedCapital" <> r.programmed)
      OR (r."paidCusteio" IS NOT NULL AND r."paidCapital" IS NOT NULL
          AND (r.paid IS NULL OR r."paidCusteio" + r."paidCapital" <> r.paid));

  IF v_invalid_repasses > 0 THEN
    RAISE EXCEPTION 'repasses invalidos no snapshot: %', v_invalid_repasses
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)
    INTO v_duplicate_repasses
    FROM (
      SELECT r.inep, r.action, r.installment
        FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
          inep text,
          exercise integer,
          program text,
          action text,
          installment text,
          "displayOrder" integer,
          programmed numeric,
          paid numeric,
          "programmedCusteio" numeric,
          "programmedCapital" numeric,
          "paidCusteio" numeric,
          "paidCapital" numeric,
          "paymentDate" date,
          "paymentOrderDate" date,
          account jsonb
        )
       GROUP BY r.inep, r.action, r.installment
      HAVING count(*) > 1
    ) AS duplicated;

  IF v_duplicate_repasses > 0 THEN
    RAISE EXCEPTION 'repasses duplicados no snapshot: %', v_duplicate_repasses
      USING ERRCODE = '23505';
  END IF;

  SELECT count(DISTINCT r.inep)
    INTO v_scheduled_coverage
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.exercise = v_exercise AND r.programmed >= 0;

  IF v_scheduled_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao scheduled_repasses imatura: %/163', v_scheduled_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT r.inep), min(r."paymentDate"), max(r."paymentDate")
    INTO v_first_coverage, v_first_date_min, v_first_date_max
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '1ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P1'))
     AND r.paid IS NOT NULL AND r.paid >= 0 AND r."paymentDate" IS NOT NULL;

  IF v_first_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_first_installment imatura: %/163', v_first_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT r.inep),
         count(*) FILTER (
           WHERE r."paidCusteio" IS NOT NULL
             AND r."paidCapital" IS NOT NULL
             AND r.paid IS NOT NULL
             AND r."paidCusteio" + r."paidCapital" <> r.paid
         )
    INTO v_breakdown_coverage, v_invalid_breakdown
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '1ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P1'))
     AND r.paid IS NOT NULL AND r."paymentDate" IS NOT NULL
     AND r."paidCusteio" IS NOT NULL AND r."paidCapital" IS NOT NULL;

  IF v_invalid_breakdown > 0 OR v_breakdown_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_first_installment_breakdown imatura/invalida: cobertura %, somas invalidas %',
      v_breakdown_coverage, v_invalid_breakdown
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT r.inep)
    INTO v_second_coverage
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '2ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P2'))
     AND r.programmed >= 0;

  IF v_second_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_second_installment_programmed imatura: %/163', v_second_coverage
      USING ERRCODE = '22023';
  END IF;

  -- Conta explicitamente indicada no repasse precisa existir no mesmo snapshot/programa/escola.
  SELECT count(*)
    INTO v_invalid_explicit_accounts
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text,
      exercise integer,
      program text,
      action text,
      installment text,
      "displayOrder" integer,
      programmed numeric,
      paid numeric,
      "programmedCusteio" numeric,
      "programmedCapital" numeric,
      "paidCusteio" numeric,
      "paidCapital" numeric,
      "paymentDate" date,
      "paymentOrderDate" date,
      account jsonb
    )
   WHERE r.account IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
           inep text,
           exercise integer,
           program text,
           bank text,
           agency text,
           account text,
           primary boolean
         )
        WHERE a.inep = r.inep
          AND a.exercise = r.exercise
          AND a.program = r.program
          AND a.bank IS NOT DISTINCT FROM r.account->>'bank'
          AND a.agency IS NOT DISTINCT FROM r.account->>'agency'
          AND a.account IS NOT DISTINCT FROM r.account->>'account'
     );

  IF v_invalid_explicit_accounts > 0 THEN
    RAISE EXCEPTION 'repasses referenciam contas ausentes ou de outro contexto: %', v_invalid_explicit_accounts
      USING ERRCODE = '23514';
  END IF;

  -- Idempotência só após validar integralmente a carga recebida.
  SELECT id, snapshot_digest
    INTO v_existing_run_id, v_existing_digest
    FROM public.integracoes_financeiras_runs
   WHERE exercicio = v_exercise
     AND origem = v_origin
     AND workflow_run_id = v_workflow_run_id
     AND artifact_id = v_artifact_id
   LIMIT 1;

  IF v_existing_run_id IS NOT NULL THEN
    IF v_existing_digest IS NOT NULL AND v_existing_digest IS DISTINCT FROM v_digest THEN
      RAISE EXCEPTION 'colisao de proveniencia: mesma run/artifact com digest diferente'
        USING ERRCODE = '23514';
    END IF;

    IF (
      SELECT count(*) = 5
        FROM public.financial_dimension_status
       WHERE integration_run_id = v_existing_run_id
         AND publication_status = 'PUBLISHED'
         AND quality_status = 'MATURE'
    ) THEN
      UPDATE public.integracoes_financeiras_runs
         SET snapshot_digest = coalesce(snapshot_digest, v_digest),
             artifact_name = coalesce(artifact_name, v_artifact_name)
       WHERE id = v_existing_run_id;

      RETURN jsonb_build_object(
        'status', 'idempotent',
        'integrationRunId', v_existing_run_id,
        'schools', 163,
        'accounts', v_account_count,
        'repasses', v_repasse_count,
        'dimensions', 5
      );
    END IF;
  END IF;

  -- Proteção adicional: uma dimensão publicada não pode regredir cobertura.
  IF EXISTS (
    SELECT 1
      FROM public.financial_dimension_status AS current_status
      JOIN (VALUES
        ('bank_accounts'::text, v_account_coverage),
        ('scheduled_repasses'::text, v_scheduled_coverage),
        ('pdde_basic_first_installment'::text, v_first_coverage),
        ('pdde_basic_first_installment_breakdown'::text, v_breakdown_coverage),
        ('pdde_basic_second_installment_programmed'::text, v_second_coverage)
      ) AS incoming(dimension_key, coverage_observed)
        ON incoming.dimension_key = current_status.dimension_key
     WHERE current_status.exercise = v_exercise
       AND current_status.publication_status = 'PUBLISHED'
       AND incoming.coverage_observed < current_status.coverage_observed
  ) THEN
    RAISE EXCEPTION 'regressao de cobertura bloqueada'
      USING ERRCODE = '22023';
  END IF;

  IF v_existing_run_id IS NULL THEN
    INSERT INTO public.integracoes_financeiras_runs (
      exercicio,
      origem,
      publicado_em,
      workflow_run_id,
      artifact_id,
      artifact_name,
      snapshot_digest,
      total_unidades,
      total_contas,
      total_repasses
    ) VALUES (
      v_exercise,
      v_origin,
      v_published_at,
      v_workflow_run_id,
      v_artifact_id,
      v_artifact_name,
      v_digest,
      163,
      v_account_count,
      v_repasse_count
    )
    RETURNING id INTO v_run_id;
  ELSE
    v_run_id := v_existing_run_id;
    UPDATE public.integracoes_financeiras_runs
       SET publicado_em = v_published_at,
           artifact_name = v_artifact_name,
           snapshot_digest = v_digest,
           total_unidades = 163,
           total_contas = v_account_count,
           total_repasses = v_repasse_count
     WHERE id = v_run_id;
  END IF;

  -- A projeção operacional é substituída integralmente dentro desta transação.
  DELETE FROM public.repasses_financeiros
   WHERE exercicio = v_exercise;

  UPDATE public.contas_bancarias AS cb
     SET principal = false
   WHERE cb.exercicio = v_exercise
     AND EXISTS (
       SELECT 1
         FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
         JOIN public.unidades_escolares AS u ON u.inep = s.inep
        WHERE u.id = cb.unidade_id
     );

  INSERT INTO public.contas_bancarias (
    unidade_id,
    banco,
    agencia,
    conta_corrente,
    principal,
    programa,
    exercicio
  )
  SELECT
    u.id,
    a.bank,
    a.agency,
    a.account,
    coalesce(a.primary, false),
    a.program,
    a.exercise
  FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
    inep text,
    exercise integer,
    program text,
    bank text,
    agency text,
    account text,
    primary boolean
  )
  JOIN public.unidades_escolares AS u ON u.inep = a.inep
  ON CONFLICT (unidade_id, agencia, conta_corrente) DO UPDATE
    SET banco = EXCLUDED.banco,
        principal = EXCLUDED.principal,
        programa = EXCLUDED.programa,
        exercicio = EXCLUDED.exercicio,
        updated_at = now();

  DELETE FROM public.contas_bancarias AS cb
   WHERE cb.exercicio = v_exercise
     AND EXISTS (
       SELECT 1
         FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
         JOIN public.unidades_escolares AS u ON u.inep = s.inep
        WHERE u.id = cb.unidade_id
     )
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
           inep text,
           exercise integer,
           program text,
           bank text,
           agency text,
           account text,
           primary boolean
         )
         JOIN public.unidades_escolares AS u ON u.inep = a.inep
        WHERE u.id = cb.unidade_id
          AND a.exercise = cb.exercicio
          AND a.agency IS NOT DISTINCT FROM cb.agencia
          AND a.account IS NOT DISTINCT FROM cb.conta_corrente
     );

  INSERT INTO public.repasses_financeiros (
    unidade_id,
    exercicio,
    programa,
    acao,
    parcela,
    ordem_exibicao,
    valor_programado,
    valor_pago,
    custeio_programado,
    capital_programado,
    custeio_pago,
    capital_pago,
    data_pagamento,
    data_ordem_pagamento,
    conta_bancaria_id,
    integracao_run_id
  )
  SELECT
    u.id,
    r.exercise,
    r.program,
    r.action,
    r.installment,
    coalesce(r."displayOrder", 1),
    r.programmed,
    r.paid,
    r."programmedCusteio",
    r."programmedCapital",
    r."paidCusteio",
    r."paidCapital",
    r."paymentDate",
    r."paymentOrderDate",
    cb.id,
    v_run_id
  FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
    inep text,
    exercise integer,
    program text,
    action text,
    installment text,
    "displayOrder" integer,
    programmed numeric,
    paid numeric,
    "programmedCusteio" numeric,
    "programmedCapital" numeric,
    "paidCusteio" numeric,
    "paidCapital" numeric,
    "paymentDate" date,
    "paymentOrderDate" date,
    account jsonb
  )
  JOIN public.unidades_escolares AS u ON u.inep = r.inep
  LEFT JOIN public.contas_bancarias AS cb
    ON r.account IS NOT NULL
   AND cb.unidade_id = u.id
   AND cb.exercicio = r.exercise
   AND cb.programa = r.program
   AND cb.banco IS NOT DISTINCT FROM r.account->>'bank'
   AND cb.agencia IS NOT DISTINCT FROM r.account->>'agency'
   AND cb.conta_corrente IS NOT DISTINCT FROM r.account->>'account';

  UPDATE public.financial_dimension_status
     SET publication_status = 'WITHDRAWN',
         withdrawn_at = now()
   WHERE exercise = v_exercise
     AND publication_status = 'PUBLISHED';

  INSERT INTO public.financial_dimension_status (
    dimension_key,
    exercise,
    integration_run_id,
    coverage_observed,
    coverage_expected,
    coverage_ratio,
    reference_date_min,
    reference_date_max,
    quality_status,
    publication_status,
    source_snapshot_digest,
    validated_at,
    published_at
  )
  SELECT
    d.dimension_key,
    v_exercise,
    v_run_id,
    d.coverage_observed,
    163,
    least(d.coverage_observed::numeric / 163::numeric, 1),
    d.reference_date_min,
    d.reference_date_max,
    'MATURE',
    'PUBLISHED',
    v_digest,
    now(),
    now()
  FROM (VALUES
    ('bank_accounts'::text, v_account_coverage, NULL::date, NULL::date),
    ('scheduled_repasses'::text, v_scheduled_coverage, NULL::date, NULL::date),
    ('pdde_basic_first_installment'::text, v_first_coverage, v_first_date_min, v_first_date_max),
    ('pdde_basic_first_installment_breakdown'::text, v_breakdown_coverage, v_first_date_min, v_first_date_max),
    ('pdde_basic_second_installment_programmed'::text, v_second_coverage, NULL::date, NULL::date)
  ) AS d(dimension_key, coverage_observed, reference_date_min, reference_date_max)
  ON CONFLICT (dimension_key, integration_run_id) DO UPDATE
    SET coverage_observed = EXCLUDED.coverage_observed,
        coverage_expected = EXCLUDED.coverage_expected,
        coverage_ratio = EXCLUDED.coverage_ratio,
        reference_date_min = EXCLUDED.reference_date_min,
        reference_date_max = EXCLUDED.reference_date_max,
        quality_status = EXCLUDED.quality_status,
        publication_status = EXCLUDED.publication_status,
        source_snapshot_digest = EXCLUDED.source_snapshot_digest,
        validated_at = EXCLUDED.validated_at,
        published_at = EXCLUDED.published_at,
        withdrawn_at = NULL;

  RETURN jsonb_build_object(
    'status', 'published',
    'integrationRunId', v_run_id,
    'schools', 163,
    'accounts', v_account_count,
    'repasses', v_repasse_count,
    'dimensions', 5
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_v1(jsonb) TO service_role;

COMMENT ON FUNCTION public.publish_financial_snapshot_v1(jsonb) IS
  'Publica atomicamente o snapshot financeiro 2026 somente após validar identidade, integridade e maturidade das cinco dimensões V1. Uso exclusivo do service_role.';

-- ---------------------------------------------------------------------------
-- Backfill não destrutivo do retrato já vigente
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_run_id uuid;
  v_accounts integer;
  v_scheduled integer;
  v_first integer;
  v_breakdown integer;
  v_second integer;
  v_first_min date;
  v_first_max date;
  v_all_mature boolean;
BEGIN
  SELECT id
    INTO v_run_id
    FROM public.integracoes_financeiras_runs
   WHERE exercicio = 2026
   ORDER BY publicado_em DESC NULLS LAST, workflow_run_id DESC NULLS LAST, criado_em DESC
   LIMIT 1;

  IF v_run_id IS NULL THEN
    RETURN;
  END IF;

  SELECT count(DISTINCT unidade_id)
    INTO v_accounts
    FROM public.contas_bancarias
   WHERE exercicio = 2026
     AND nullif(btrim(coalesce(banco, '')), '') IS NOT NULL
     AND nullif(btrim(coalesce(agencia, '')), '') IS NOT NULL
     AND nullif(btrim(coalesce(conta_corrente, '')), '') IS NOT NULL;

  SELECT count(DISTINCT unidade_id)
    INTO v_scheduled
    FROM public.repasses_financeiros
   WHERE exercicio = 2026 AND valor_programado >= 0;

  SELECT count(DISTINCT unidade_id), min(data_pagamento), max(data_pagamento)
    INTO v_first, v_first_min, v_first_max
    FROM public.repasses_financeiros
   WHERE exercicio = 2026
     AND programa = 'PDDE BÁSICO'
     AND ((acao = 'PDDE Básico' AND parcela = '1ª Parcela')
       OR (acao = 'PDDE Básico — Primeira Infância' AND parcela = 'P1'))
     AND valor_pago IS NOT NULL
     AND data_pagamento IS NOT NULL;

  SELECT count(DISTINCT unidade_id)
    INTO v_breakdown
    FROM public.repasses_financeiros
   WHERE exercicio = 2026
     AND programa = 'PDDE BÁSICO'
     AND ((acao = 'PDDE Básico' AND parcela = '1ª Parcela')
       OR (acao = 'PDDE Básico — Primeira Infância' AND parcela = 'P1'))
     AND valor_pago IS NOT NULL
     AND data_pagamento IS NOT NULL
     AND custeio_pago IS NOT NULL
     AND capital_pago IS NOT NULL
     AND custeio_pago + capital_pago = valor_pago;

  SELECT count(DISTINCT unidade_id)
    INTO v_second
    FROM public.repasses_financeiros
   WHERE exercicio = 2026
     AND programa = 'PDDE BÁSICO'
     AND ((acao = 'PDDE Básico' AND parcela = '2ª Parcela')
       OR (acao = 'PDDE Básico — Primeira Infância' AND parcela = 'P2'))
     AND valor_programado >= 0;

  v_all_mature := v_accounts >= 163
    AND v_scheduled >= 163
    AND v_first >= 163
    AND v_breakdown >= 163
    AND v_second >= 163;

  INSERT INTO public.financial_dimension_status (
    dimension_key,
    exercise,
    integration_run_id,
    coverage_observed,
    coverage_expected,
    coverage_ratio,
    reference_date_min,
    reference_date_max,
    quality_status,
    publication_status,
    validated_at,
    published_at
  )
  SELECT
    d.dimension_key,
    2026,
    v_run_id,
    d.coverage_observed,
    163,
    least(d.coverage_observed::numeric / 163::numeric, 1),
    d.reference_date_min,
    d.reference_date_max,
    CASE WHEN d.coverage_observed >= 163 THEN 'MATURE' ELSE 'VALIDATED' END,
    CASE WHEN v_all_mature THEN 'PUBLISHED' ELSE 'UNPUBLISHED' END,
    now(),
    CASE WHEN v_all_mature THEN coalesce((SELECT publicado_em FROM public.integracoes_financeiras_runs WHERE id = v_run_id), now()) ELSE NULL END
  FROM (VALUES
    ('bank_accounts'::text, v_accounts, NULL::date, NULL::date),
    ('scheduled_repasses'::text, v_scheduled, NULL::date, NULL::date),
    ('pdde_basic_first_installment'::text, v_first, v_first_min, v_first_max),
    ('pdde_basic_first_installment_breakdown'::text, v_breakdown, v_first_min, v_first_max),
    ('pdde_basic_second_installment_programmed'::text, v_second, NULL::date, NULL::date)
  ) AS d(dimension_key, coverage_observed, reference_date_min, reference_date_max)
  ON CONFLICT (dimension_key, integration_run_id) DO NOTHING;
END;
$$;
