begin;

select plan(7);

select ok(
  to_regprocedure('public.get_financial_dimension_publication_v1(integer)') is not null,
  'RPC de maturidade financeira publicada existe'
);

select ok(
  not has_function_privilege('anon', 'public.get_financial_dimension_publication_v1(integer)', 'EXECUTE'),
  'anon nao executa a RPC de maturidade'
);

select ok(
  has_function_privilege('authenticated', 'public.get_financial_dimension_publication_v1(integer)', 'EXECUTE'),
  'usuario autenticado pode consultar a maturidade publicada'
);

select ok(
  has_function_privilege('service_role', 'public.get_financial_dimension_publication_v1(integer)', 'EXECUTE'),
  'service_role pode consultar a maturidade publicada'
);

select ok(
  not has_table_privilege('authenticated', 'public.financial_dimension_status', 'SELECT'),
  'usuario autenticado nao recebe SELECT direto no status interno'
);

select ok(
  not has_table_privilege('authenticated', 'public.financial_dimension_contracts', 'SELECT'),
  'usuario autenticado nao recebe SELECT direto nos contratos internos'
);

select ok(
  (
    select count(*)
    from public.get_financial_dimension_publication_v1(2026)
    where publication_status <> 'PUBLISHED'
  ) = 0,
  'RPC expoe apenas dimensoes publicadas'
);

select * from finish();
rollback;
