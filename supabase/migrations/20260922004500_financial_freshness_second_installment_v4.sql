-- Financial freshness and second-installment maturity V4
--
-- 1. Expõe somente metadados mínimos de frescor aos usuários autenticados.
-- 2. Torna "pagamento informado do 2º ciclo" uma dimensão financeira própria.
-- 3. Mantém ordem/pagamento informado separados de crédito bancário confirmado.

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
  '{"requires_paid_amount":true,"evidence":"PDDEINFO_PAYMENT_INFORMED","bank_credit_is_separate":true}'::jsonb,
  true
)
ON CONFLICT (dimension_key, exercise) DO UPDATE
SET contract_version = EXCLUDED.contract_version,
    coverage_expected = EXCLUDED.coverage_expected,
    coverage_required_ratio = EXCLUDED.coverage_required_ratio,
    requirements = EXCLUDED.requirements,
    enabled = EXCLUDED.enabled,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.get_financial_freshness_v1(p_exercise integer)
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
  'Expõe somente a proveniência mínima da última integração financeira para comparação de frescor pela interface; não expõe auditoria detalhada.';

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
  v_digest text;
  v_second_payment_coverage integer;
  v_second_payment_total numeric;
  v_second_date_min date;
  v_second_date_max date;
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'payload financeiro deve ser um objeto JSON'
      USING ERRCODE = '22023';
  END IF;

  v_exercise := NULLIF(p_payload->>'exercise', '')::integer;
  v_digest := lower(p_payload->'source'->>'snapshotDigest');

  SELECT
    count(DISTINCT r.inep),
    coalesce(sum(r.paid), 0),
    min(coalesce(r."paymentOrderDate", r."paymentDate")),
    max(coalesce(r."paymentOrderDate", r."paymentDate"))
  INTO
    v_second_payment_coverage,
    v_second_payment_total,
    v_second_date_min,
    v_second_date_max
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

  IF v_exercise = 2026 AND v_second_payment_coverage <> 163 THEN
    RAISE EXCEPTION 'dimensao pdde_basic_second_installment_payment_informed imatura: %/163',
      v_second_payment_coverage
      USING ERRCODE = '22023';
  END IF;

  v_publication := public.publish_financial_snapshot_v1(p_payload);
  v_run_id := NULLIF(v_publication->>'integrationRunId', '')::uuid;

  IF v_run_id IS NULL THEN
    RAISE EXCEPTION 'publicacao financeira nao retornou integrationRunId'
      USING ERRCODE = '22023';
  END IF;

  v_order_evidence := public.sync_financial_order_evidence_v1(p_payload);

  UPDATE public.financial_dimension_status
     SET publication_status = 'WITHDRAWN',
         withdrawn_at = now()
   WHERE exercise = v_exercise
     AND dimension_key = 'pdde_basic_second_installment_payment_informed'
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
    v_second_date_min,
    v_second_date_max,
    'MATURE',
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
      'totalInformed', v_second_payment_total,
      'referenceDateMin', v_second_date_min,
      'referenceDateMax', v_second_date_max
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb)
  TO service_role;

COMMENT ON FUNCTION public.publish_financial_snapshot_with_order_evidence_v1(jsonb) IS
  'Publica snapshot financeiro, preserva ordens e registra maturidade do pagamento informado do 2º ciclo; crédito bancário permanece evidência independente.';
