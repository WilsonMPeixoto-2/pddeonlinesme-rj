-- Financial Freshness + Second Installment Payment Dimension V1
--
-- Objetivos:
-- 1. expor ao frontend apenas metadados sanitizados de frescor da última integração;
-- 2. registrar a maturidade do pagamento informado da 2ª parcela/P2 como dimensão própria;
-- 3. manter "pagamento informado" separado de "crédito bancário confirmado";
-- 4. permitir publicação de progresso parcial da nova dimensão sem transformar ausência em zero.

INSERT INTO public.financial_dimension_contracts (
  dimension_key,
  exercise,
  contract_version,
  coverage_expected,
  coverage_required_ratio,
  requirements,
  enabled
)
VALUES (
  'pdde_basic_second_installment_payment_informed',
  2026,
  1,
  163,
  1.000000,
  '{"requires_paid_amount":true,"payment_informed_is_not_bank_credit":true}'::jsonb,
  true
)
ON CONFLICT (dimension_key, exercise) DO UPDATE
SET contract_version = EXCLUDED.contract_version,
    coverage_expected = EXCLUDED.coverage_expected,
    coverage_required_ratio = EXCLUDED.coverage_required_ratio,
    requirements = EXCLUDED.requirements,
    enabled = EXCLUDED.enabled,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.get_financial_freshness_v1(p_exercise integer DEFAULT 2026)
RETURNS TABLE (
  exercise integer,
  workflow_run_id bigint,
  artifact_id bigint,
  source_published_at timestamptz,
  storage_recorded_at timestamptz,
  publication_result text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    r.exercicio,
    r.workflow_run_id,
    r.artifact_id,
    r.publicado_em,
    r.criado_em,
    r.publication_result
  FROM public.integracoes_financeiras_runs AS r
  WHERE r.exercicio = p_exercise
    AND r.origem = 'pdde-repasse-conciliador'
    AND r.workflow_run_id IS NOT NULL
    AND r.artifact_id IS NOT NULL
  ORDER BY r.workflow_run_id DESC, r.criado_em DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_financial_freshness_v1(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_freshness_v1(integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_financial_freshness_v1(integer) IS
  'Retorna somente a proveniência temporal sanitizada da integração financeira mais recente para comparação com o snapshot do motor.';

CREATE OR REPLACE FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_publication jsonb;
  v_order_evidence jsonb;
  v_run_id uuid;
  v_exercise integer;
  v_second_payment_coverage integer := 0;
  v_second_payment_date_min date;
  v_second_payment_date_max date;
  v_quality_status text;
  v_digest text;
BEGIN
  v_publication := public.publish_financial_snapshot_v1(p_payload);
  v_order_evidence := public.sync_financial_order_evidence_v1(p_payload);

  v_run_id := NULLIF(v_publication->>'integrationRunId', '')::uuid;
  v_exercise := NULLIF(p_payload->>'exercise', '')::integer;
  v_digest := lower(p_payload->'source'->>'snapshotDigest');

  IF v_run_id IS NULL OR v_exercise IS DISTINCT FROM 2026 THEN
    RAISE EXCEPTION 'publicacao financeira sem contexto valido para registrar a dimensao da segunda parcela'
      USING ERRCODE = '22023';
  END IF;

  SELECT
    count(DISTINCT r.inep),
    min(coalesce(r."paymentDate", r."paymentOrderDate")),
    max(coalesce(r."paymentDate", r."paymentOrderDate"))
  INTO
    v_second_payment_coverage,
    v_second_payment_date_min,
    v_second_payment_date_max
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
    AND r.program = 'PDDE BÁSICO'
    AND (
      (r.action = 'PDDE Básico' AND r.installment = '2ª Parcela')
      OR
      (r.action = 'PDDE Básico — Primeira Infância' AND r.installment = 'P2')
    )
    AND r.paid IS NOT NULL
    AND r.paid >= 0;

  v_quality_status := CASE
    WHEN v_second_payment_coverage >= 163 THEN 'MATURE'
    ELSE 'VALIDATED'
  END;

  UPDATE public.financial_dimension_status
     SET publication_status = 'WITHDRAWN',
         withdrawn_at = now()
   WHERE dimension_key = 'pdde_basic_second_installment_payment_informed'
     AND exercise = v_exercise
     AND publication_status = 'PUBLISHED'
     AND integration_run_id <> v_run_id;

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
    published_at,
    withdrawn_at
  )
  VALUES (
    'pdde_basic_second_installment_payment_informed',
    v_exercise,
    v_run_id,
    v_second_payment_coverage,
    163,
    least(v_second_payment_coverage::numeric / 163::numeric, 1),
    v_second_payment_date_min,
    v_second_payment_date_max,
    v_quality_status,
    'PUBLISHED',
    v_digest,
    now(),
    now(),
    NULL
  )
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
    'publication', v_publication,
    'orderEvidence', v_order_evidence,
    'secondInstallmentPaymentInformed', jsonb_build_object(
      'coverageObserved', v_second_payment_coverage,
      'coverageExpected', 163,
      'qualityStatus', v_quality_status,
      'referenceDateMin', v_second_payment_date_min,
      'referenceDateMax', v_second_payment_date_max
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb)
  TO service_role;

COMMENT ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb) IS
  'Publica snapshot e evidências de ordem e registra a dimensão de pagamento informado da 2ª parcela/P2 sem equipará-la a crédito bancário confirmado.';
