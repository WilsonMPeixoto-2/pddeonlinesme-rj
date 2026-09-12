-- Financial Dimension Contract V2
-- Thresholds quantitativos passam a ser governados por contrato no banco.
-- Invariantes semanticas continuam validadas pela RPC antes de qualquer promocao.

ALTER TABLE public.financial_dimension_contracts
  ADD COLUMN IF NOT EXISTS required_for_core_publication boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validator_key text NOT NULL DEFAULT 'pending';

ALTER TABLE public.financial_dimension_contracts
  DROP CONSTRAINT IF EXISTS financial_dimension_contracts_validator_key_check;

ALTER TABLE public.financial_dimension_contracts
  ADD CONSTRAINT financial_dimension_contracts_validator_key_check
  CHECK (length(btrim(validator_key)) > 0);

UPDATE public.financial_dimension_contracts
SET contract_version = greatest(contract_version, 2),
    required_for_core_publication = true,
    validator_key = CASE dimension_key
      WHEN 'bank_accounts' THEN 'bank_accounts_v1'
      WHEN 'scheduled_repasses' THEN 'scheduled_repasses_v1'
      WHEN 'pdde_basic_first_installment' THEN 'pdde_basic_first_installment_v1'
      WHEN 'pdde_basic_first_installment_breakdown' THEN 'pdde_basic_first_installment_breakdown_v1'
      WHEN 'pdde_basic_second_installment_programmed' THEN 'pdde_basic_second_installment_programmed_v1'
      ELSE validator_key
    END,
    updated_at = now()
WHERE exercise = 2026
  AND dimension_key IN (
    'bank_accounts',
    'scheduled_repasses',
    'pdde_basic_first_installment',
    'pdde_basic_first_installment_breakdown',
    'pdde_basic_second_installment_programmed'
  );

INSERT INTO public.financial_dimension_contracts (
  dimension_key,
  exercise,
  contract_version,
  coverage_expected,
  coverage_required_ratio,
  requirements,
  enabled,
  required_for_core_publication,
  validator_key
)
VALUES (
  'bank_balance_positions',
  2026,
  2,
  163,
  1.000000,
  '{"requires_reference_date":true}'::jsonb,
  true,
  false,
  'pending'
)
ON CONFLICT (dimension_key, exercise) DO UPDATE
SET contract_version = EXCLUDED.contract_version,
    coverage_expected = EXCLUDED.coverage_expected,
    coverage_required_ratio = EXCLUDED.coverage_required_ratio,
    requirements = EXCLUDED.requirements,
    enabled = EXCLUDED.enabled,
    required_for_core_publication = EXCLUDED.required_for_core_publication,
    validator_key = EXCLUDED.validator_key,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.get_financial_dimension_contracts_v1(p_exercise integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'dimensionKey', c.dimension_key,
        'exercise', c.exercise,
        'contractVersion', c.contract_version,
        'coverageExpected', c.coverage_expected,
        'coverageRequiredRatio', c.coverage_required_ratio,
        'requirements', c.requirements,
        'enabled', c.enabled,
        'requiredForCorePublication', c.required_for_core_publication,
        'validatorKey', c.validator_key
      ) ORDER BY c.dimension_key
    ),
    '[]'::jsonb
  )
  FROM public.financial_dimension_contracts AS c
  WHERE c.exercise = p_exercise
    AND c.enabled;
$$;

REVOKE ALL ON FUNCTION public.get_financial_dimension_contracts_v1(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_dimension_contracts_v1(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.assert_financial_dimension_contract_v2(
  p_dimension_key text,
  p_exercise integer,
  p_coverage_observed integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_expected integer;
  v_required_ratio numeric(8,6);
  v_enabled boolean;
  v_required boolean;
  v_validator_key text;
BEGIN
  SELECT
    c.coverage_expected,
    c.coverage_required_ratio,
    c.enabled,
    c.required_for_core_publication,
    c.validator_key
  INTO
    v_expected,
    v_required_ratio,
    v_enabled,
    v_required,
    v_validator_key
  FROM public.financial_dimension_contracts AS c
  WHERE c.dimension_key = p_dimension_key
    AND c.exercise = p_exercise;

  IF NOT FOUND OR NOT coalesce(v_enabled, false) OR NOT coalesce(v_required, false) THEN
    RAISE EXCEPTION 'contrato financeiro obrigatorio indisponivel: %', p_dimension_key
      USING ERRCODE = '22023';
  END IF;

  IF v_validator_key = 'pending' THEN
    RAISE EXCEPTION 'dimensao obrigatoria sem validador semantico ativo: %', p_dimension_key
      USING ERRCODE = '22023';
  END IF;

  IF p_coverage_observed IS NULL OR p_coverage_observed < 0
     OR p_coverage_observed::numeric / v_expected::numeric < v_required_ratio THEN
    RAISE EXCEPTION 'dimensao % imatura: cobertura %/% abaixo do threshold %',
      p_dimension_key, coalesce(p_coverage_observed, 0), v_expected, v_required_ratio
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_financial_dimension_contract_v2(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_financial_dimension_contract_v2(text, integer, integer)
  TO service_role;

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
      "primary" boolean
    )
   WHERE a.exercise = v_exercise
     AND nullif(btrim(a.bank), '') IS NOT NULL
     AND nullif(btrim(a.agency), '') IS NOT NULL
     AND nullif(btrim(a.account), '') IS NOT NULL;

  PERFORM public.assert_financial_dimension_contract_v2(
    'bank_accounts', v_exercise, v_account_coverage
  );

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
          "primary" boolean
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
          "primary" boolean
        ) ON a.inep = s.inep AND a.exercise = v_exercise AND coalesce(a."primary", false)
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

  PERFORM public.assert_financial_dimension_contract_v2(
    'scheduled_repasses', v_exercise, v_scheduled_coverage
  );

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

  PERFORM public.assert_financial_dimension_contract_v2(
    'pdde_basic_first_installment', v_exercise, v_first_coverage
  );

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

  IF v_invalid_breakdown > 0 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_first_installment_breakdown invalida: somas invalidas %',
      v_invalid_breakdown
      USING ERRCODE = '22023';
  END IF;

  PERFORM public.assert_financial_dimension_contract_v2(
    'pdde_basic_first_installment_breakdown', v_exercise, v_breakdown_coverage
  );

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

  PERFORM public.assert_financial_dimension_contract_v2(
    'pdde_basic_second_installment_programmed', v_exercise, v_second_coverage
  );

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
           "primary" boolean
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
      SELECT count(*) = (
        SELECT count(*)
          FROM public.financial_dimension_contracts AS required_contract
         WHERE required_contract.exercise = v_exercise
           AND required_contract.enabled
           AND required_contract.required_for_core_publication
      )
        FROM public.financial_dimension_status AS s
        JOIN public.financial_dimension_contracts AS c
          ON c.dimension_key = s.dimension_key
         AND c.exercise = s.exercise
         AND c.enabled
         AND c.required_for_core_publication
       WHERE s.integration_run_id = v_existing_run_id
         AND s.publication_status = 'PUBLISHED'
         AND s.quality_status = 'MATURE'
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
        'dimensions', (SELECT count(*) FROM public.financial_dimension_contracts AS c WHERE c.exercise = v_exercise AND c.enabled AND c.required_for_core_publication)
      );
    END IF;
  END IF;

  -- Regressao passa a ser governada pelo contrato vigente.
  -- Reduzir explicitamente o threshold e uma decisao auditavel de configuracao;
  -- sem essa mudanca, assert_financial_dimension_contract_v2 bloqueia a regressao.

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
    coalesce(a."primary", false),
    a.program,
    a.exercise
  FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
    inep text,
    exercise integer,
    program text,
    bank text,
    agency text,
    account text,
    "primary" boolean
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
           "primary" boolean
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
     AND publication_status = 'PUBLISHED'
     AND dimension_key IN (
       SELECT c.dimension_key
         FROM public.financial_dimension_contracts AS c
        WHERE c.exercise = v_exercise
          AND c.enabled
          AND c.required_for_core_publication
     );

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
    c.coverage_expected,
    least(d.coverage_observed::numeric / c.coverage_expected::numeric, 1),
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
  JOIN public.financial_dimension_contracts AS c
    ON c.dimension_key = d.dimension_key
   AND c.exercise = v_exercise
   AND c.enabled
   AND c.required_for_core_publication
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


  IF p_payload ? 'observedDimensions'
     AND jsonb_typeof(p_payload->'observedDimensions') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'observedDimensions deve ser um array JSON'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
        "dimensionKey" text,
        "coverageObserved" integer,
        "referenceDateMin" date,
        "referenceDateMax" date
      )
      LEFT JOIN public.financial_dimension_contracts AS c
        ON c.dimension_key = o."dimensionKey"
       AND c.exercise = v_exercise
     WHERE c.dimension_key IS NULL
        OR NOT c.enabled
        OR c.required_for_core_publication
        OR c.validator_key <> 'pending'
        OR o."coverageObserved" IS NULL
        OR o."coverageObserved" < 0
        OR o."coverageObserved" > c.coverage_expected
        OR (
          o."referenceDateMin" IS NOT NULL
          AND o."referenceDateMax" IS NOT NULL
          AND o."referenceDateMin" > o."referenceDateMax"
        )
  ) THEN
    RAISE EXCEPTION 'observacao de dimensao opcional invalida ou sem contrato pending habilitado'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
        "dimensionKey" text,
        "coverageObserved" integer,
        "referenceDateMin" date,
        "referenceDateMax" date
      )
     GROUP BY o."dimensionKey"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'observedDimensions contem dimensao duplicada'
      USING ERRCODE = '23505';
  END IF;

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
    c.dimension_key,
    v_exercise,
    v_run_id,
    o."coverageObserved",
    c.coverage_expected,
    least(o."coverageObserved"::numeric / c.coverage_expected::numeric, 1),
    o."referenceDateMin",
    o."referenceDateMax",
    'COLLECTING',
    'UNPUBLISHED',
    v_digest,
    now(),
    NULL
  FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
    "dimensionKey" text,
    "coverageObserved" integer,
    "referenceDateMin" date,
    "referenceDateMax" date
  )
  JOIN public.financial_dimension_contracts AS c
    ON c.dimension_key = o."dimensionKey"
   AND c.exercise = v_exercise
   AND c.enabled
   AND NOT c.required_for_core_publication
   AND c.validator_key = 'pending'
  ON CONFLICT (dimension_key, integration_run_id) DO UPDATE
    SET coverage_observed = EXCLUDED.coverage_observed,
        coverage_expected = EXCLUDED.coverage_expected,
        coverage_ratio = EXCLUDED.coverage_ratio,
        reference_date_min = EXCLUDED.reference_date_min,
        reference_date_max = EXCLUDED.reference_date_max,
        quality_status = 'COLLECTING',
        publication_status = 'UNPUBLISHED',
        source_snapshot_digest = EXCLUDED.source_snapshot_digest,
        validated_at = EXCLUDED.validated_at,
        published_at = NULL,
        withdrawn_at = NULL;

  RETURN jsonb_build_object(
    'status', 'published',
    'integrationRunId', v_run_id,
    'schools', 163,
    'accounts', v_account_count,
    'repasses', v_repasse_count,
    'dimensions', (SELECT count(*) FROM public.financial_dimension_contracts AS c WHERE c.exercise = v_exercise AND c.enabled AND c.required_for_core_publication)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_v1(jsonb) TO service_role;

COMMENT ON FUNCTION public.publish_financial_snapshot_v1(jsonb) IS
  'Publica atomicamente o snapshot financeiro 2026 usando thresholds do contrato V2; dimensoes opcionais pending permanecem COLLECTING/UNPUBLISHED. Uso exclusivo do service_role.';
