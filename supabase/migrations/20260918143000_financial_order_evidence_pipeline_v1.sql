-- Financial Order Evidence Pipeline V1
--
-- Materializa automaticamente, no PDDE Online, ordens de pagamento que o motor
-- financeiro validou contra o relatório público "Situação de Atendimento".
-- Ordem de pagamento permanece distinta de pagamento informado e de crédito bancário.

CREATE OR REPLACE FUNCTION public.sync_financial_order_evidence_v1(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_exercise integer;
  v_origin text;
  v_workflow_run_id bigint;
  v_artifact_id bigint;
  v_reference text;
  v_candidates integer := 0;
  v_inserted integer := 0;
  v_unmatched integer := 0;
  v_conflicts integer := 0;
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'payload financeiro deve ser um objeto JSON'
      USING ERRCODE = '22023';
  END IF;

  v_exercise := NULLIF(p_payload->>'exercise', '')::integer;
  v_origin := p_payload->'source'->>'origin';
  v_workflow_run_id := NULLIF(p_payload->'source'->>'workflowRunId', '')::bigint;
  v_artifact_id := NULLIF(p_payload->'source'->>'artifactId', '')::bigint;

  IF v_exercise IS DISTINCT FROM 2026
     OR v_origin IS DISTINCT FROM 'pdde-repasse-conciliador'
     OR v_workflow_run_id IS NULL OR v_workflow_run_id <= 0
     OR v_artifact_id IS NULL OR v_artifact_id <= 0 THEN
    RAISE EXCEPTION 'proveniencia da evidencia de ordem invalida'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(coalesce(p_payload->'repasses', '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'repasses deve ser um array JSON'
      USING ERRCODE = '22023';
  END IF;

  v_reference := format(
    'pdde-repasse-conciliador:run:%s:artifact:%s',
    v_workflow_run_id,
    v_artifact_id
  );

  WITH incoming AS (
    SELECT
      r.inep,
      r.exercise,
      r.program,
      r.action,
      r.installment,
      r.programmed,
      r."programmedCusteio",
      r."programmedCapital",
      r."paymentDate",
      r."paymentOrderDate"
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
    WHERE r.exercise = v_exercise
      AND r."paymentOrderDate" IS NOT NULL
      AND r."paymentDate" IS NULL
  )
  SELECT count(*)
    INTO v_candidates
    FROM incoming;

  WITH incoming AS (
    SELECT
      r.inep,
      r.exercise,
      r.action,
      r.installment,
      r.programmed,
      r."programmedCusteio",
      r."programmedCapital",
      r."paymentOrderDate"
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
    WHERE r.exercise = v_exercise
      AND r."paymentOrderDate" IS NOT NULL
      AND r."paymentDate" IS NULL
  )
  SELECT count(*)
    INTO v_unmatched
    FROM incoming i
    LEFT JOIN public.unidades_escolares u
      ON u.inep = i.inep
    LEFT JOIN public.repasses_financeiros rf
      ON rf.unidade_id = u.id
     AND rf.exercicio = i.exercise
     AND rf.acao = i.action
     AND rf.parcela = i.installment
   WHERE rf.id IS NULL;

  IF v_unmatched > 0 THEN
    RAISE EXCEPTION 'evidencia de ordem sem repasse canonico correspondente: %', v_unmatched
      USING ERRCODE = '23503';
  END IF;

  WITH incoming AS (
    SELECT
      rf.id AS repasse_financeiro_id,
      r.programmed AS valor,
      r."programmedCusteio" AS custeio,
      r."programmedCapital" AS capital,
      r."paymentOrderDate" AS ordem
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
    JOIN public.unidades_escolares u
      ON u.inep = r.inep
    JOIN public.repasses_financeiros rf
      ON rf.unidade_id = u.id
     AND rf.exercicio = r.exercise
     AND rf.acao = r.action
     AND rf.parcela = r.installment
    WHERE r.exercise = v_exercise
      AND r."paymentOrderDate" IS NOT NULL
      AND r."paymentDate" IS NULL
  )
  SELECT count(*)
    INTO v_conflicts
    FROM incoming i
    JOIN public.repasse_evidencias_financeiras e
      ON e.repasse_financeiro_id = i.repasse_financeiro_id
     AND e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'
   WHERE (e.valor_pago_informado, e.custeio_pago_informado, e.capital_pago_informado, e.data_ordem_pagamento)
         IS DISTINCT FROM
         (i.valor, i.custeio, i.capital, i.ordem);

  IF v_conflicts > 0 THEN
    RAISE EXCEPTION 'evidencia de ordem diverge de fato anteriormente preservado: %', v_conflicts
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.repasse_evidencias_financeiras (
    repasse_financeiro_id,
    tipo_evidencia,
    fonte,
    referencia,
    valor_pago_informado,
    custeio_pago_informado,
    capital_pago_informado,
    data_pagamento,
    data_ordem_pagamento,
    observacao
  )
  SELECT
    rf.id,
    'SITUACAO_ATENDIMENTO_FNDE',
    'FNDE - Situação de Atendimento da Entidade',
    v_reference,
    r.programmed,
    r."programmedCusteio",
    r."programmedCapital",
    NULL::date,
    r."paymentOrderDate",
    'Ordem de pagamento validada pelo motor contra o relatório público de Atendimento; não implica crédito bancário observado.'
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
  JOIN public.unidades_escolares u
    ON u.inep = r.inep
  JOIN public.repasses_financeiros rf
    ON rf.unidade_id = u.id
   AND rf.exercicio = r.exercise
   AND rf.acao = r.action
   AND rf.parcela = r.installment
  WHERE r.exercise = v_exercise
    AND r."paymentOrderDate" IS NOT NULL
    AND r."paymentDate" IS NULL
  ON CONFLICT (repasse_financeiro_id, tipo_evidencia) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'candidates', v_candidates,
    'inserted', v_inserted,
    'preservedExisting', v_candidates - v_inserted
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_publication jsonb;
  v_order_evidence jsonb;
BEGIN
  v_publication := public.publish_financial_snapshot_v1(p_payload);
  v_order_evidence := public.sync_financial_order_evidence_v1(p_payload);

  RETURN jsonb_build_object(
    'publication', v_publication,
    'orderEvidence', v_order_evidence
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_financial_order_evidence_v1(jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb) TO service_role;

COMMENT ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb) IS
  'Publica o snapshot financeiro e materializa, na mesma transação, ordens de pagamento validadas pelo motor como evidência complementar sem inventar data de pagamento ou crédito bancário.';
