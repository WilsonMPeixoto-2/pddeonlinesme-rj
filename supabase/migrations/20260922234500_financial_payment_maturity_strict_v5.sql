begin;

update public.financial_dimension_contracts
   set requirements = coalesce(requirements, '{}'::jsonb)
     || '{"requires_paid_amount":true,"requires_payment_date":true,"evidence":"PDDEINFO_PAYMENT_INFORMED","bank_credit_is_separate":true}'::jsonb
 where exercise = 2026
   and dimension_key = 'pdde_basic_second_installment_payment_informed';

create or replace function public.publish_financial_snapshot_with_order_evidence_v2(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_exercise integer;
  v_second_payment_coverage integer;
  v_second_payment_total numeric;
  v_second_date_min date;
  v_second_date_max date;
  v_result jsonb;
  v_run_id uuid;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'payload financeiro deve ser um objeto JSON'
      using errcode = '22023';
  end if;

  v_exercise := nullif(p_payload->>'exercise', '')::integer;
  if v_exercise is distinct from 2026 then
    raise exception 'exercicio financeiro inesperado: %', v_exercise
      using errcode = '22023';
  end if;

  select
    count(distinct r.inep),
    coalesce(sum(r.paid), 0),
    min(r."paymentDate"),
    max(r."paymentDate")
  into
    v_second_payment_coverage,
    v_second_payment_total,
    v_second_date_min,
    v_second_date_max
  from jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) as r(
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
  where r.exercise = v_exercise
    and r.program = 'PDDE BÁSICO'
    and (
      (r.action = 'PDDE Básico' and r.installment = '2ª Parcela')
      or
      (r.action = 'PDDE Básico — Primeira Infância' and r.installment = 'P2')
    )
    and r.paid is not null
    and r.paid >= 0
    and r."paymentDate" is not null;

  if v_second_payment_coverage <> 163 then
    raise exception 'dimensao pdde_basic_second_installment_payment_informed imatura: %/163 pagamentos com data oficial',
      v_second_payment_coverage
      using errcode = '22023';
  end if;

  v_result := public.publish_financial_snapshot_with_order_evidence_v1(p_payload);
  v_run_id := nullif(v_result->'publication'->>'integrationRunId', '')::uuid;

  if v_run_id is null then
    raise exception 'publicacao financeira v1 nao retornou integrationRunId'
      using errcode = '22023';
  end if;

  update public.financial_dimension_status
     set coverage_observed = v_second_payment_coverage,
         coverage_expected = 163,
         coverage_ratio = 1,
         reference_date_min = v_second_date_min,
         reference_date_max = v_second_date_max,
         quality_status = 'MATURE',
         publication_status = 'PUBLISHED',
         validated_at = now(),
         published_at = coalesce(published_at, now()),
         withdrawn_at = null
   where dimension_key = 'pdde_basic_second_installment_payment_informed'
     and exercise = v_exercise
     and integration_run_id = v_run_id;

  v_result := jsonb_set(
    v_result,
    '{secondInstallmentPaymentInformed}',
    jsonb_build_object(
      'coverageObserved', v_second_payment_coverage,
      'coverageExpected', 163,
      'totalInformed', v_second_payment_total,
      'qualityStatus', 'MATURE',
      'referenceDateMin', v_second_date_min,
      'referenceDateMax', v_second_date_max,
      'requiresPaymentDate', true
    ),
    true
  );

  return v_result;
end;
$$;

revoke all on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb)
  to service_role;

comment on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb) is
  'Publica o snapshot financeiro somente quando o 2o ciclo pago possui valor e paymentDate para 163/163; ordem e credito bancario permanecem evidencias distintas.';

commit;
