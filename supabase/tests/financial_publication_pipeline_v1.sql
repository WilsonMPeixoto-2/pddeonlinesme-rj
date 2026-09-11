begin;

select plan(21);

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

-- Prova funcional: o RPC precisa publicar 163 escolas de forma atômica e a
-- segunda chamada da mesma run/artifact precisa ser estritamente idempotente.
insert into public.unidades_escolares (designacao, nome, inep)
select
  'ZZ.TEST.' || lpad(i::text, 3, '0'),
  'Escola de contrato ' || i,
  (99000000 + i)::text
from generate_series(1, 163) as g(i);

create temp table _financial_payload as
with schools as (
  select
    i,
    (99000000 + i)::text as inep
  from generate_series(1, 163) as g(i)
),
payload_parts as (
  select
    jsonb_agg(
      jsonb_build_object(
        'inep', inep,
        'sme', 'ZZ.TEST.' || lpad(i::text, 3, '0'),
        'name', 'Escola de contrato ' || i
      ) order by i
    ) as schools,
    jsonb_agg(
      jsonb_build_object(
        'inep', inep,
        'exercise', 2026,
        'program', 'PDDE BÁSICO',
        'bank', '001',
        'agency', '0001',
        'account', 'T' || lpad(i::text, 7, '0'),
        'primary', true
      ) order by i
    ) as accounts
  from schools
),
repasses as (
  select jsonb_agg(item order by i, ord) as repasses
  from (
    select
      i,
      1 as ord,
      jsonb_build_object(
        'inep', inep,
        'exercise', 2026,
        'program', 'PDDE BÁSICO',
        'action', 'PDDE Básico',
        'installment', '1ª Parcela',
        'displayOrder', 1,
        'programmed', 100,
        'paid', 100,
        'programmedCusteio', 40,
        'programmedCapital', 60,
        'paidCusteio', 40,
        'paidCapital', 60,
        'paymentDate', '2026-08-05',
        'paymentOrderDate', null,
        'account', null
      ) as item
    from schools
    union all
    select
      i,
      2 as ord,
      jsonb_build_object(
        'inep', inep,
        'exercise', 2026,
        'program', 'PDDE BÁSICO',
        'action', 'PDDE Básico',
        'installment', '2ª Parcela',
        'displayOrder', 2,
        'programmed', 100,
        'paid', null,
        'programmedCusteio', null,
        'programmedCapital', null,
        'paidCusteio', null,
        'paidCapital', null,
        'paymentDate', null,
        'paymentOrderDate', null,
        'account', null
      ) as item
    from schools
  ) as rows
)
select jsonb_build_object(
  'exercise', 2026,
  'source', jsonb_build_object(
    'origin', 'pdde-repasse-conciliador',
    'publishedAt', '2026-09-10T12:00:00Z',
    'workflowRunId', 999999999001,
    'artifactId', 999999999002,
    'artifactName', 'sigef-full-163-2026',
    'snapshotDigest', repeat('a', 64)
  ),
  'schools', payload_parts.schools,
  'accounts', payload_parts.accounts,
  'repasses', repasses.repasses
) as payload
from payload_parts cross join repasses;

create temp table _first_publication as
select public.publish_financial_snapshot_v1(payload) as result
from _financial_payload;

select is(
  (select result->>'status' from _first_publication),
  'published',
  'primeira chamada publica o snapshot maduro'
);

select is(
  (select count(*)::integer from public.contas_bancarias cb join public.unidades_escolares u on u.id = cb.unidade_id where u.inep like '99%'),
  163,
  'publicacao materializa 163 contas sinteticas'
);

select is(
  (select count(*)::integer from public.repasses_financeiros r join public.unidades_escolares u on u.id = r.unidade_id where u.inep like '99%'),
  326,
  'publicacao materializa duas parcelas por escola'
);

select is(
  (select count(*)::integer from public.financial_dimension_status where exercise = 2026 and publication_status = 'PUBLISHED' and quality_status = 'MATURE'),
  5,
  'as cinco dimensoes ficam maduras e publicadas'
);

create temp table _second_publication as
select public.publish_financial_snapshot_v1(payload) as result
from _financial_payload;

select is(
  (select result->>'status' from _second_publication),
  'idempotent',
  'segunda chamada da mesma proveniencia e idempotente'
);

select is(
  (select count(*)::integer from public.contas_bancarias cb join public.unidades_escolares u on u.id = cb.unidade_id where u.inep like '99%'),
  163,
  'idempotencia nao duplica contas'
);

select is(
  (select count(*)::integer from public.repasses_financeiros r join public.unidades_escolares u on u.id = r.unidade_id where u.inep like '99%'),
  326,
  'idempotencia nao duplica repasses'
);

select * from finish();
rollback;
