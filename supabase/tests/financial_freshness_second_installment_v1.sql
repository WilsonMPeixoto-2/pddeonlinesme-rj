begin;

select plan(6);

select ok(
  to_regprocedure('public.get_financial_freshness_v1(integer)') is not null,
  'get_financial_freshness_v1 existe'
);

select is(
  (
    select count(*)::integer
    from public.financial_dimension_contracts
    where exercise = 2026
      and dimension_key = 'pdde_basic_second_installment_payment_informed'
  ),
  1,
  'contrato da dimensão de pagamento informado da segunda parcela existe'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_financial_freshness_v1(integer)',
    'EXECUTE'
  ),
  'authenticated pode consultar apenas o frescor sanitizado'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_financial_freshness_v1(integer)',
    'EXECUTE'
  ),
  'anon não consulta metadados de frescor'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.publish_financial_snapshot_with_order_evidence_v1(jsonb)',
    'EXECUTE'
  ),
  'service_role publica snapshot com a nova dimensão'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_financial_snapshot_with_order_evidence_v1(jsonb)',
    'EXECUTE'
  ),
  'authenticated não pode publicar snapshot financeiro'
);

select * from finish();

rollback;
