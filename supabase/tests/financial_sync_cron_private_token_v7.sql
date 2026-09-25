begin;

select plan(8);

select ok(
  to_regnamespace('private') is not null
  and to_regclass('private.financial_sync_credentials') is not null,
  'credencial interna do cron fica em schema privado'
);

select ok(
  not has_schema_privilege('anon', 'private', 'USAGE')
  and not has_schema_privilege('authenticated', 'private', 'USAGE'),
  'frontend nao acessa o schema privado'
);

select ok(
  to_regprocedure('public.configure_pdde_financial_sync_v2(text)') is not null,
  'configurador v2 do cron existe'
);

select ok(
  has_function_privilege('service_role', 'public.configure_pdde_financial_sync_v2(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.configure_pdde_financial_sync_v2(text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.configure_pdde_financial_sync_v2(text)', 'EXECUTE'),
  'somente service_role pode configurar o cron'
);

select ok(
  has_function_privilege('service_role', 'public.verify_pdde_financial_sync_token_v1(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.verify_pdde_financial_sync_token_v1(text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.verify_pdde_financial_sync_token_v1(text)', 'EXECUTE'),
  'somente backend privilegiado pode validar o token interno'
);

select public.configure_pdde_financial_sync_v2('anon-test-key');

select ok(
  exists(select 1 from private.financial_sync_credentials where singleton and octet_length(token_hash)=32),
  'configuracao gera e guarda apenas o hash SHA-256 do token'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='pdde-financial-sync-v1'
      and schedule='*/5 * * * *'
      and command like '%/functions/v1/sync_pdde_financial_snapshot%'
      and command like '%X-PDDE-Financial-Sync-Token%'
  ),
  'cron de cinco minutos invoca a Edge Function protegida'
);

select ok(
  not exists(
    select 1 from cron.job
    where jobname='pdde-financial-sync-v1'
      and command like '%service_role%'
  ),
  'cron nao carrega service_role'
);

select * from finish();
rollback;
