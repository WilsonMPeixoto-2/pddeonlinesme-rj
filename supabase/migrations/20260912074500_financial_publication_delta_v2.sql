-- Financial Publication Delta V2
--
-- Substitui a troca integral do retrato financeiro por reconciliação incremental.
-- A nova regra operacional é simples: snapshot semanticamente igual não toca nas
-- tabelas operacionais; snapshot alterado grava somente o delta real.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.integracoes_financeiras_runs
  ADD COLUMN IF NOT EXISTS business_digest text,
  ADD COLUMN IF NOT EXISTS publication_result text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.integracoes_financeiras_runs'::regclass
      AND conname = 'integracoes_financeiras_runs_business_digest_check'
  ) THEN
    ALTER TABLE public.integracoes_financeiras_runs
      ADD CONSTRAINT integracoes_financeiras_runs_business_digest_check
      CHECK (business_digest IS NULL OR business_digest ~ '^[0-9a-f]{64}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.integracoes_financeiras_runs'::regclass
      AND conname = 'integracoes_financeiras_runs_publication_result_check'
  ) THEN
    ALTER TABLE public.integracoes_financeiras_runs
      ADD CONSTRAINT integracoes_financeiras_runs_publication_result_check
      CHECK (publication_result IS NULL OR publication_result IN ('PUBLISHED', 'UNCHANGED'));
  END IF;
END
$$;

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
  v_business_digest text;

  v_school_count integer;
  v_school_distinct integer;
  v_known_schools integer;
  v_foreign_rows integer;

  v_account_count integer;
  v_account_coverage integer;
  v_invalid_accounts integer;
  v_duplicate_accounts integer;
  v_invalid_primary integer;

  v_repasse_count integer;
  v_invalid_repasses integer;
  v_duplicate_repasses integer;
  v_invalid_explicit_accounts integer;
  v_scheduled_coverage integer;
  v_first_coverage integer;
  v_breakdown_coverage integer;
  v_second_coverage integer;
  v_first_date_min date;
  v_first_date_max date;
  v_invalid_breakdown integer;

  v_existing_run_id uuid;
  v_existing_digest text;
  v_existing_business_digest text;
  v_latest_run_id bigint;
  v_latest_business_digest text;
  v_run_id uuid;

  v_accounts_written integer := 0;
  v_accounts_deleted integer := 0;
  v_repasses_written integer := 0;
  v_repasses_deleted integer := 0;
  v_operational_changes integer := 0;
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

  IF jsonb_typeof(coalesce(p_payload->'schools', '[]'::jsonb)) IS DISTINCT FROM 'array'
     OR jsonb_typeof(coalesce(p_payload->'accounts', '[]'::jsonb)) IS DISTINCT FROM 'array'
     OR jsonb_typeof(coalesce(p_payload->'repasses', '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'schools, accounts e repasses devem ser arrays JSON'
      USING ERRCODE = '22023';
  END IF;

  -- Uma única publicação por exercício por vez. O lock é transacional e não
  -- mantém conexão ou recurso depois do COMMIT/ROLLBACK.
  PERFORM pg_advisory_xact_lock(hashtextextended('pdde-financial-publication:' || v_exercise::text, 0));

  SELECT workflow_run_id, business_digest
    INTO v_latest_run_id, v_latest_business_digest
    FROM public.integracoes_financeiras_runs
   WHERE exercicio = v_exercise
     AND origem = v_origin
     AND workflow_run_id IS NOT NULL
     AND publicado_em IS NOT NULL
   ORDER BY workflow_run_id DESC, criado_em DESC
   LIMIT 1;

  IF v_latest_run_id IS NOT NULL AND v_workflow_run_id < v_latest_run_id THEN
    RAISE EXCEPTION 'run regressiva bloqueada: recebida %, vigente %', v_workflow_run_id, v_latest_run_id
      USING ERRCODE = '22023';
  END IF;

  -- -------------------------------------------------------------------------
  -- Validação integral antes de qualquer mutação.
  -- -------------------------------------------------------------------------
  SELECT count(*), count(DISTINCT s.inep)
    INTO v_school_count, v_school_distinct
    FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(
      inep text,
      sme text,
      name text
    );

  IF v_school_count <> 163 OR v_school_distinct <> 163 THEN
    RAISE EXCEPTION 'snapshot deve conter exatamente 163 INEPs unicos: linhas %, unicos %',
      v_school_count, v_school_distinct
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

  SELECT count(*)
    INTO v_foreign_rows
    FROM (
      SELECT a.inep
      FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
        inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
      )
      WHERE NOT EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
        WHERE s.inep = a.inep
      )
      UNION ALL
      SELECT r.inep
      FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
        inep text, exercise integer, program text, action text, installment text,
        "displayOrder" integer, programmed numeric, paid numeric,
        "programmedCusteio" numeric, "programmedCapital" numeric,
        "paidCusteio" numeric, "paidCapital" numeric,
        "paymentDate" date, "paymentOrderDate" date, account jsonb
      )
      WHERE NOT EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
        WHERE s.inep = r.inep
      )
    ) AS foreign_rows;

  IF v_foreign_rows > 0 THEN
    RAISE EXCEPTION 'snapshot contem linhas financeiras fora da carteira de 163 escolas: %', v_foreign_rows
      USING ERRCODE = '23503';
  END IF;

  SELECT
    count(*),
    count(DISTINCT a.inep),
    count(*) FILTER (
      WHERE a.exercise IS DISTINCT FROM v_exercise
         OR nullif(btrim(a.program), '') IS NULL
         OR nullif(btrim(a.bank), '') IS NULL
         OR nullif(btrim(a.agency), '') IS NULL
         OR nullif(btrim(a.account), '') IS NULL
    )
    INTO v_account_count, v_account_coverage, v_invalid_accounts
    FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
      inep text,
      exercise integer,
      program text,
      bank text,
      agency text,
      account text,
      "primary" boolean
    );

  IF v_invalid_accounts > 0 OR v_account_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao bank_accounts invalida/imatura: cobertura %/163, linhas invalidas %',
      v_account_coverage, v_invalid_accounts
      USING ERRCODE = '22023';
  END IF;

  -- A chave precisa refletir a constraint física da tabela de destino.
  SELECT count(*)
    INTO v_duplicate_accounts
    FROM (
      SELECT a.inep, a.agency, a.account
      FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
        inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
      )
      GROUP BY a.inep, a.agency, a.account
      HAVING count(*) > 1
    ) AS duplicated;

  IF v_duplicate_accounts > 0 THEN
    RAISE EXCEPTION 'contas duplicadas pela chave operacional no snapshot: %', v_duplicate_accounts
      USING ERRCODE = '23505';
  END IF;

  SELECT count(*)
    INTO v_invalid_primary
    FROM (
      SELECT s.inep
      FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
      LEFT JOIN jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
        inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
      ) ON a.inep = s.inep
         AND a.exercise = v_exercise
         AND coalesce(a."primary", false)
      GROUP BY s.inep
      HAVING count(a.account) <> 1
    ) AS invalid_primary;

  IF v_invalid_primary > 0 THEN
    RAISE EXCEPTION 'cada escola deve possuir exatamente uma conta principal: % divergencias', v_invalid_primary
      USING ERRCODE = '22023';
  END IF;

  SELECT
    count(*),
    count(*) FILTER (
      WHERE r.exercise IS DISTINCT FROM v_exercise
         OR nullif(btrim(r.program), '') IS NULL
         OR nullif(btrim(r.action), '') IS NULL
         OR nullif(btrim(r.installment), '') IS NULL
         OR r.programmed IS NULL OR r.programmed < 0
         OR r.paid < 0
         OR r."programmedCusteio" < 0 OR r."programmedCapital" < 0
         OR r."paidCusteio" < 0 OR r."paidCapital" < 0
         OR (r."programmedCusteio" IS NOT NULL AND r."programmedCapital" IS NOT NULL
             AND r."programmedCusteio" + r."programmedCapital" <> r.programmed)
         OR (r."paidCusteio" IS NOT NULL AND r."paidCapital" IS NOT NULL
             AND (r.paid IS NULL OR r."paidCusteio" + r."paidCapital" <> r.paid))
    )
    INTO v_repasse_count, v_invalid_repasses
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

  IF v_invalid_repasses > 0 THEN
    RAISE EXCEPTION 'repasses invalidos no snapshot: %', v_invalid_repasses
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)
    INTO v_duplicate_repasses
    FROM (
      SELECT r.inep, r.action, r.installment
      FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
        inep text, exercise integer, program text, action text, installment text,
        "displayOrder" integer, programmed numeric, paid numeric,
        "programmedCusteio" numeric, "programmedCapital" numeric,
        "paidCusteio" numeric, "paidCapital" numeric,
        "paymentDate" date, "paymentOrderDate" date, account jsonb
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
      inep text, exercise integer, program text, action text, installment text,
      "displayOrder" integer, programmed numeric, paid numeric,
      "programmedCusteio" numeric, "programmedCapital" numeric,
      "paidCusteio" numeric, "paidCapital" numeric,
      "paymentDate" date, "paymentOrderDate" date, account jsonb
    )
   WHERE r.exercise = v_exercise AND r.programmed >= 0;

  IF v_scheduled_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao scheduled_repasses imatura: %/163', v_scheduled_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT r.inep), min(r."paymentDate"), max(r."paymentDate")
    INTO v_first_coverage, v_first_date_min, v_first_date_max
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text, exercise integer, program text, action text, installment text,
      "displayOrder" integer, programmed numeric, paid numeric,
      "programmedCusteio" numeric, "programmedCapital" numeric,
      "paidCusteio" numeric, "paidCapital" numeric,
      "paymentDate" date, "paymentOrderDate" date, account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '1ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P1'))
     AND r.paid IS NOT NULL
     AND r.paid >= 0
     AND r."paymentDate" IS NOT NULL;

  IF v_first_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_first_installment imatura: %/163', v_first_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT
    count(DISTINCT r.inep),
    count(*) FILTER (
      WHERE r."paidCusteio" IS NOT NULL
        AND r."paidCapital" IS NOT NULL
        AND r.paid IS NOT NULL
        AND r."paidCusteio" + r."paidCapital" <> r.paid
    )
    INTO v_breakdown_coverage, v_invalid_breakdown
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text, exercise integer, program text, action text, installment text,
      "displayOrder" integer, programmed numeric, paid numeric,
      "programmedCusteio" numeric, "programmedCapital" numeric,
      "paidCusteio" numeric, "paidCapital" numeric,
      "paymentDate" date, "paymentOrderDate" date, account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '1ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P1'))
     AND r.paid IS NOT NULL
     AND r."paymentDate" IS NOT NULL
     AND r."paidCusteio" IS NOT NULL
     AND r."paidCapital" IS NOT NULL;

  IF v_invalid_breakdown > 0 OR v_breakdown_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_first_installment_breakdown imatura/invalida: cobertura %, somas invalidas %',
      v_breakdown_coverage, v_invalid_breakdown
      USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT r.inep)
    INTO v_second_coverage
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text, exercise integer, program text, action text, installment text,
      "displayOrder" integer, programmed numeric, paid numeric,
      "programmedCusteio" numeric, "programmedCapital" numeric,
      "paidCusteio" numeric, "paidCapital" numeric,
      "paymentDate" date, "paymentOrderDate" date, account jsonb
    )
   WHERE r.program = 'PDDE BÁSICO'
     AND ((r.action = 'PDDE Básico' AND r.installment = '2ª Parcela')
       OR (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P2'))
     AND r.programmed >= 0;

  IF v_second_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_second_installment_programmed imatura: %/163', v_second_coverage
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*)
    INTO v_invalid_explicit_accounts
    FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
      inep text, exercise integer, program text, action text, installment text,
      "displayOrder" integer, programmed numeric, paid numeric,
      "programmedCusteio" numeric, "programmedCapital" numeric,
      "paidCusteio" numeric, "paidCapital" numeric,
      "paymentDate" date, "paymentOrderDate" date, account jsonb
    )
   WHERE r.account IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
         inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
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

  -- Digest semântico: deliberadamente exclui proveniência e o espelho das
  -- dimensões. O conteúdo normalizado de negócio é o que determina mudança.
  v_business_digest := encode(
    extensions.digest(
      convert_to((p_payload - 'source' - 'dimensions')::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  -- Mesma run/artifact é idempotência técnica. Nenhuma tabela operacional é tocada.
  SELECT id, snapshot_digest, business_digest
    INTO v_existing_run_id, v_existing_digest, v_existing_business_digest
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
    IF v_existing_business_digest IS NOT NULL
       AND v_existing_business_digest IS DISTINCT FROM v_business_digest THEN
      RAISE EXCEPTION 'colisao semantica: mesma run/artifact com conteudo financeiro diferente'
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.integracoes_financeiras_runs
       SET snapshot_digest = coalesce(snapshot_digest, v_digest),
           business_digest = coalesce(business_digest, v_business_digest),
           artifact_name = coalesce(artifact_name, v_artifact_name)
     WHERE id = v_existing_run_id
       AND (snapshot_digest IS NULL OR business_digest IS NULL OR artifact_name IS NULL);

    RETURN jsonb_build_object(
      'status', 'idempotent',
      'integrationRunId', v_existing_run_id,
      'schools', 163,
      'accounts', v_account_count,
      'repasses', v_repasse_count,
      'dimensions', 5,
      'changes', jsonb_build_object(
        'accountsWritten', 0,
        'accountsDeleted', 0,
        'repassesWritten', 0,
        'repassesDeleted', 0
      )
    );
  END IF;

  -- Proteção contra regressão de cobertura já publicada.
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

  -- Nova execução, mas conteúdo idêntico ao último estado aceito: preserva o
  -- evento de proveniência e encerra sem qualquer DML nas tabelas operacionais.
  IF v_latest_business_digest IS NOT NULL
     AND v_latest_business_digest = v_business_digest THEN
    INSERT INTO public.integracoes_financeiras_runs (
      exercicio, origem, publicado_em, workflow_run_id, artifact_id,
      artifact_name, snapshot_digest, business_digest, publication_result,
      total_unidades, total_contas, total_repasses
    ) VALUES (
      v_exercise, v_origin, v_published_at, v_workflow_run_id, v_artifact_id,
      v_artifact_name, v_digest, v_business_digest, 'UNCHANGED',
      163, v_account_count, v_repasse_count
    )
    RETURNING id INTO v_run_id;

    RETURN jsonb_build_object(
      'status', 'unchanged',
      'integrationRunId', v_run_id,
      'schools', 163,
      'accounts', v_account_count,
      'repasses', v_repasse_count,
      'dimensions', 5,
      'changes', jsonb_build_object(
        'accountsWritten', 0,
        'accountsDeleted', 0,
        'repassesWritten', 0,
        'repassesDeleted', 0
      )
    );
  END IF;

  INSERT INTO public.integracoes_financeiras_runs (
    exercicio, origem, publicado_em, workflow_run_id, artifact_id,
    artifact_name, snapshot_digest, business_digest, publication_result,
    total_unidades, total_contas, total_repasses
  ) VALUES (
    v_exercise, v_origin, v_published_at, v_workflow_run_id, v_artifact_id,
    v_artifact_name, v_digest, v_business_digest, NULL,
    163, v_account_count, v_repasse_count
  )
  RETURNING id INTO v_run_id;

  -- -------------------------------------------------------------------------
  -- Reconciliação incremental de contas.
  -- O WHERE do ON CONFLICT impede UPDATE físico quando os valores são iguais.
  -- -------------------------------------------------------------------------
  INSERT INTO public.contas_bancarias AS target (
    unidade_id, banco, agencia, conta_corrente, principal, programa, exercicio
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
    inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
  )
  JOIN public.unidades_escolares AS u ON u.inep = a.inep
  ON CONFLICT (unidade_id, agencia, conta_corrente) DO UPDATE
    SET banco = EXCLUDED.banco,
        principal = EXCLUDED.principal,
        programa = EXCLUDED.programa,
        exercicio = EXCLUDED.exercicio,
        updated_at = now()
  WHERE (target.banco, target.principal, target.programa, target.exercicio)
        IS DISTINCT FROM
        (EXCLUDED.banco, EXCLUDED.principal, EXCLUDED.programa, EXCLUDED.exercicio);
  GET DIAGNOSTICS v_accounts_written = ROW_COUNT;

  -- Repasses são UPSERT por sua chave natural. integracao_run_id representa a
  -- última execução que de fato alterou a linha, não a última coleta observada.
  INSERT INTO public.repasses_financeiros AS target (
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
   AND cb.conta_corrente IS NOT DISTINCT FROM r.account->>'account'
  ON CONFLICT (unidade_id, exercicio, acao, parcela) DO UPDATE
    SET programa = EXCLUDED.programa,
        ordem_exibicao = EXCLUDED.ordem_exibicao,
        valor_programado = EXCLUDED.valor_programado,
        valor_pago = EXCLUDED.valor_pago,
        custeio_programado = EXCLUDED.custeio_programado,
        capital_programado = EXCLUDED.capital_programado,
        custeio_pago = EXCLUDED.custeio_pago,
        capital_pago = EXCLUDED.capital_pago,
        data_pagamento = EXCLUDED.data_pagamento,
        data_ordem_pagamento = EXCLUDED.data_ordem_pagamento,
        conta_bancaria_id = EXCLUDED.conta_bancaria_id,
        integracao_run_id = EXCLUDED.integracao_run_id,
        updated_at = now()
  WHERE (
    target.programa,
    target.ordem_exibicao,
    target.valor_programado,
    target.valor_pago,
    target.custeio_programado,
    target.capital_programado,
    target.custeio_pago,
    target.capital_pago,
    target.data_pagamento,
    target.data_ordem_pagamento,
    target.conta_bancaria_id
  ) IS DISTINCT FROM (
    EXCLUDED.programa,
    EXCLUDED.ordem_exibicao,
    EXCLUDED.valor_programado,
    EXCLUDED.valor_pago,
    EXCLUDED.custeio_programado,
    EXCLUDED.capital_programado,
    EXCLUDED.custeio_pago,
    EXCLUDED.capital_pago,
    EXCLUDED.data_pagamento,
    EXCLUDED.data_ordem_pagamento,
    EXCLUDED.conta_bancaria_id
  );
  GET DIAGNOSTICS v_repasses_written = ROW_COUNT;

  -- Exclusão também é delta: só saem chaves que realmente desapareceram do
  -- novo retrato da carteira publicada.
  DELETE FROM public.repasses_financeiros AS target
   WHERE target.exercicio = v_exercise
     AND EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
       JOIN public.unidades_escolares AS u ON u.inep = s.inep
       WHERE u.id = target.unidade_id
     )
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) AS r(
         inep text, exercise integer, program text, action text, installment text,
         "displayOrder" integer, programmed numeric, paid numeric,
         "programmedCusteio" numeric, "programmedCapital" numeric,
         "paidCusteio" numeric, "paidCapital" numeric,
         "paymentDate" date, "paymentOrderDate" date, account jsonb
       )
       JOIN public.unidades_escolares AS u ON u.inep = r.inep
       WHERE u.id = target.unidade_id
         AND r.exercise = target.exercicio
         AND r.action = target.acao
         AND r.installment = target.parcela
     );
  GET DIAGNOSTICS v_repasses_deleted = ROW_COUNT;

  -- Contas desaparecidas são removidas por último, depois que repasses já foram
  -- atualizados/removidos, evitando ON DELETE SET NULL em massa sem necessidade.
  DELETE FROM public.contas_bancarias AS target
   WHERE target.exercicio = v_exercise
     AND EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(coalesce(p_payload->'schools', '[]'::jsonb)) AS s(inep text, sme text, name text)
       JOIN public.unidades_escolares AS u ON u.inep = s.inep
       WHERE u.id = target.unidade_id
     )
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(coalesce(p_payload->'accounts', '[]'::jsonb)) AS a(
         inep text, exercise integer, program text, bank text, agency text, account text, "primary" boolean
       )
       JOIN public.unidades_escolares AS u ON u.inep = a.inep
       WHERE u.id = target.unidade_id
         AND a.exercise = target.exercicio
         AND a.agency IS NOT DISTINCT FROM target.agencia
         AND a.account IS NOT DISTINCT FROM target.conta_corrente
     );
  GET DIAGNOSTICS v_accounts_deleted = ROW_COUNT;

  v_operational_changes := v_accounts_written + v_accounts_deleted + v_repasses_written + v_repasses_deleted;

  -- Mesmo quando o digest bruto difere por alguma representação não persistida,
  -- zero DML operacional significa que o estado de negócio não mudou.
  IF v_operational_changes = 0 THEN
    UPDATE public.integracoes_financeiras_runs
       SET publication_result = 'UNCHANGED'
     WHERE id = v_run_id;

    RETURN jsonb_build_object(
      'status', 'unchanged',
      'integrationRunId', v_run_id,
      'schools', 163,
      'accounts', v_account_count,
      'repasses', v_repasse_count,
      'dimensions', 5,
      'changes', jsonb_build_object(
        'accountsWritten', 0,
        'accountsDeleted', 0,
        'repassesWritten', 0,
        'repassesDeleted', 0
      )
    );
  END IF;

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

  UPDATE public.integracoes_financeiras_runs
     SET publication_result = 'PUBLISHED'
   WHERE id = v_run_id;

  RETURN jsonb_build_object(
    'status', 'published',
    'integrationRunId', v_run_id,
    'schools', 163,
    'accounts', v_account_count,
    'repasses', v_repasse_count,
    'dimensions', 5,
    'changes', jsonb_build_object(
      'accountsWritten', v_accounts_written,
      'accountsDeleted', v_accounts_deleted,
      'repassesWritten', v_repasses_written,
      'repassesDeleted', v_repasses_deleted
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_v1(jsonb) TO service_role;
