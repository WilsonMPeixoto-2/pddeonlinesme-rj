begin;

select plan(5);

select ok(
  to_regprocedure('public.configure_pdde_financial_sync_v3()') is not null,
  'configurador v3 sem parametros existe'
);

select ok(
  has_function_privilege('service_role', 'public.configure_pdde_financial_sync_v3()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.configure_pdde_financial_sync_v3()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.configure_pdde_financial_sync_v3()', 'EXECUTE'),
  'somente service_role pode rotacionar/configurar o cron'
);

select ok(
  position('Authorization' in pg_get_functiondef('public.configure_pdde_financial_sync_v3()'::regprocedure)) = 0,
  'cron v3 nao depende de Authorization JWT'
);

select ok(
  position('X-PDDE-Financial-Sync-Token' in pg_get_functiondef('public.configure_pdde_financial_sync_v3()'::regprocedure)) > 0,
  'cron v3 usa apenas token interno dedicado'
);

select ok(
  position('vault.' in lower(pg_get_functiondef('public.configure_pdde_financial_sync_v3()'::regprocedure))) = 0,
  'cron v3 nao depende de Vault'
);

select * from finish();
rollback;
