begin;

select plan(6);

select ok(
  exists (
    select 1
    from public.financial_dimension_contracts
    where exercise = 2026
      and dimension_key = 'pdde_basic_second_installment_payment_informed'
      and enabled
      and coverage_expected = 163
      and coverage_required_ratio = 1.000000
  ),
  'contrato do pagamento informado do segundo ciclo exige 163/163'
);

select ok(
  to_regprocedure('public.get_financial_freshness_v1(integer)') is not null,
  'RPC segura de frescor financeiro existe'
);

select ok(
  not has_function_privilege('anon', 'public.get_financial_freshness_v1(integer)', 'EXECUTE'),
  'anon nao le metadados de frescor'
);

select ok(
  has_function_privilege('authenticated', 'public.get_financial_freshness_v1(integer)', 'EXECUTE'),
  'usuario autenticado pode ler frescor'
);

select ok(
  has_function_privilege('service_role', 'public.get_financial_freshness_v1(integer)', 'EXECUTE'),
  'service_role pode ler frescor'
);

select ok(
  to_regprocedure('public.publish_financial_snapshot_with_order_evidence_v1(jsonb)') is not null
  and not has_function_privilege('authenticated', 'public.publish_financial_snapshot_with_order_evidence_v1(jsonb)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.publish_financial_snapshot_with_order_evidence_v1(jsonb)', 'EXECUTE'),
  'publicacao ampliada permanece exclusiva do service_role'
);

select * from finish();
rollback;
