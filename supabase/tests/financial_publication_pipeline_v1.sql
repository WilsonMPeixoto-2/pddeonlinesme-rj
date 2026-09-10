begin;

select plan(14);

select ok(
  to_regclass('public.financial_dimension_contracts') is not null,
  'financial_dimension_contracts existe'
);

select ok(
  to_regclass('public.financial_dimension_status') is not null,
  'financial_dimension_status existe'
);

select ok(
  to_regclass('public.vw_financial_dimension_publication') is not null,
  'vw_financial_dimension_publication existe'
);

select ok(
  to_regprocedure('public.publish_financial_snapshot_v1(jsonb)') is not null,
  'publish_financial_snapshot_v1(jsonb) existe'
);

select is(
  (select count(*)::integer from public.financial_dimension_contracts where exercise = 2026 and enabled),
  5,
  'cinco dimensoes V1 estao habilitadas para 2026'
);

select is(
  (select min(coverage_expected) from public.financial_dimension_contracts where exercise = 2026 and enabled),
  163,
  'cobertura esperada minima e 163'
);

select is(
  (select min(coverage_required_ratio) from public.financial_dimension_contracts where exercise = 2026 and enabled),
  1.000000::numeric,
  'todas as dimensoes V1 exigem cobertura integral'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.financial_dimension_contracts'::regclass),
  'RLS habilitada em financial_dimension_contracts'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.financial_dimension_status'::regclass),
  'RLS habilitada em financial_dimension_status'
);

select ok(
  not has_function_privilege('anon', 'public.publish_financial_snapshot_v1(jsonb)', 'EXECUTE'),
  'anon nao executa a publicacao'
);

select ok(
  not has_function_privilege('authenticated', 'public.publish_financial_snapshot_v1(jsonb)', 'EXECUTE'),
  'authenticated nao executa a publicacao'
);

select ok(
  has_function_privilege('service_role', 'public.publish_financial_snapshot_v1(jsonb)', 'EXECUTE'),
  'service_role executa a publicacao'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'integracoes_financeiras_runs'
      and indexname = 'uq_integracoes_financeiras_runs_source'
  ),
  'run possui chave idempotente por origem/workflow/artifact'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'financial_dimension_status'
      and indexname = 'uq_financial_dimension_status_current_published'
  ),
  'ha no maximo uma versao publicada corrente por dimensao/exercicio'
);

select * from finish();
rollback;
