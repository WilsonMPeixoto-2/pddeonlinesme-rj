begin;

select plan(12);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integracoes_financeiras_runs'
      and column_name = 'business_digest'
  ),
  'runs registram digest semantico do conteudo financeiro'
);

insert into public.unidades_escolares (designacao, nome, inep)
select
  'ZY.DELTA.' || lpad(i::text, 3, '0'),
  'Escola delta ' || i,
  (98000000 + i)::text
from generate_series(1, 163) as g(i);

create temp table _delta_payload as
with schools as (
  select i, (98000000 + i)::text as inep
  from generate_series(1, 163) as g(i)
),
payload_parts as (
  select
    jsonb_agg(
      jsonb_build_object(
        'inep', inep,
        'sme', 'ZY.DELTA.' || lpad(i::text, 3, '0'),
        'name', 'Escola delta ' || i
      ) order by i
    ) as schools,
    jsonb_agg(
      jsonb_build_object(
        'inep', inep,
        'exercise', 2026,
        'program', 'PDDE BÁSICO',
        'bank', '001',
        'agency', '0001',
        'account', 'D' || lpad(i::text, 7, '0'),
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
    union all
    select
      1 as i,
      3 as ord,
      jsonb_build_object(
        'inep', (98000000 + 1)::text,
        'exercise', 2026,
        'program', 'PDDE QUALIDADE',
        'action', 'Educação Conectada',
        'installment', 'Parcela única',
        'displayOrder', 3,
        'programmed', 50,
        'paid', null,
        'programmedCusteio', null,
        'programmedCapital', null,
        'paidCusteio', null,
        'paidCapital', null,
        'paymentDate', null,
        'paymentOrderDate', null,
        'account', null
      ) as item
  ) as rows
)
select jsonb_build_object(
  'exercise', 2026,
  'source', jsonb_build_object(
    'origin', 'pdde-repasse-conciliador',
    'publishedAt', '2026-09-12T07:00:00Z',
    'workflowRunId', 999999998001,
    'artifactId', 999999998101,
    'artifactName', 'sigef-full-163-2026',
    'snapshotDigest', repeat('b', 64)
  ),
  'schools', payload_parts.schools,
  'accounts', payload_parts.accounts,
  'repasses', repasses.repasses
) as payload
from payload_parts cross join repasses;

create temp table _delta_first as
select public.publish_financial_snapshot_v1(payload) as result
from _delta_payload;

select is(
  (select result->>'status' from _delta_first),
  'published',
  'primeiro snapshot e publicado'
);

select is(
  (select count(*)::integer
     from public.repasses_financeiros r
     join public.unidades_escolares u on u.id = r.unidade_id
    where u.inep like '98%'),
  327,
  'primeira publicacao materializa 327 repasses sinteticos'
);

create temp table _delta_baseline as
select r.unidade_id, r.exercicio, r.acao, r.parcela, r.id, r.ctid::text as ctid
from public.repasses_financeiros r
join public.unidades_escolares u on u.id = r.unidade_id
where u.inep like '98%';

create temp table _account_baseline as
select cb.id, cb.ctid::text as ctid
from public.contas_bancarias cb
join public.unidades_escolares u on u.id = cb.unidade_id
where u.inep like '98%';

update _delta_payload
set payload = jsonb_set(
  jsonb_set(
    jsonb_set(payload, '{source,publishedAt}', to_jsonb('2026-09-12T08:00:00Z'::text)),
    '{source,workflowRunId}', to_jsonb(999999998002::bigint)
  ),
  '{source,artifactId}', to_jsonb(999999998102::bigint)
);

create temp table _delta_second as
select public.publish_financial_snapshot_v1(payload) as result
from _delta_payload;

select is(
  (select result->>'status' from _delta_second),
  'unchanged',
  'nova proveniencia com mesmo conteudo nao republica dados operacionais'
);

select is(
  (select count(*)::integer
     from _delta_baseline b
     join public.repasses_financeiros r
       on r.unidade_id = b.unidade_id
      and r.exercicio = b.exercicio
      and r.acao = b.acao
      and r.parcela = b.parcela
    where r.id = b.id and r.ctid::text = b.ctid),
  327,
  'snapshot semanticamente igual preserva identidade e tuplas dos repasses'
);

select is(
  (select count(*)::integer
     from _account_baseline b
     join public.contas_bancarias cb on cb.id = b.id
    where cb.ctid::text = b.ctid),
  163,
  'snapshot semanticamente igual nao atualiza contas bancarias'
);

select is(
  (select count(*)::integer
     from public.financial_dimension_status
    where exercise = 2026
      and publication_status = 'PUBLISHED'
      and quality_status = 'MATURE'),
  5,
  'snapshot sem mudanca nao cria nova versao operacional das dimensoes'
);

-- Terceira proveniencia: altera somente a primeira parcela da primeira escola
-- e remove apenas o repasse opcional de Educacao Conectada.
update _delta_payload
set payload = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        payload,
        '{source,publishedAt}', to_jsonb('2026-09-12T09:00:00Z'::text)
      ),
      '{source,workflowRunId}', to_jsonb(999999998003::bigint)
    ),
    '{source,artifactId}', to_jsonb(999999998103::bigint)
  ),
  '{repasses}',
  (
    select jsonb_agg(
      case
        when elem->>'inep' = (98000000 + 1)::text
         and elem->>'action' = 'PDDE Básico'
         and elem->>'installment' = '1ª Parcela'
          then jsonb_set(
                 jsonb_set(elem, '{programmed}', to_jsonb(101::numeric)),
                 '{programmedCapital}', to_jsonb(61::numeric)
               )
        else elem
      end
      order by ord
    )
    from jsonb_array_elements(payload->'repasses') with ordinality as x(elem, ord)
    where not (
      elem->>'inep' = (98000000 + 1)::text
      and elem->>'program' = 'PDDE QUALIDADE'
      and elem->>'action' = 'Educação Conectada'
    )
  )
);

create temp table _delta_third as
select public.publish_financial_snapshot_v1(payload) as result
from _delta_payload;

select is(
  (select result->>'status' from _delta_third),
  'published',
  'snapshot com delta real e publicado'
);

select is(
  (select count(*)::integer
     from public.repasses_financeiros r
     join public.unidades_escolares u on u.id = r.unidade_id
    where u.inep like '98%'),
  326,
  'delta remove somente o repasse ausente do novo snapshot'
);

select is(
  (select count(*)::integer
     from _delta_baseline b
     join public.repasses_financeiros r
       on r.unidade_id = b.unidade_id
      and r.exercicio = b.exercicio
      and r.acao = b.acao
      and r.parcela = b.parcela
    where r.id = b.id),
  326,
  'delta preserva identidade de todos os repasses remanescentes'
);

select is(
  (select count(*)::integer
     from _delta_baseline b
     join public.repasses_financeiros r
       on r.unidade_id = b.unidade_id
      and r.exercicio = b.exercicio
      and r.acao = b.acao
      and r.parcela = b.parcela
    where r.id = b.id
      and r.ctid::text is distinct from b.ctid),
  1,
  'delta altera fisicamente apenas o repasse cujo conteudo mudou'
);

select is(
  (select valor_programado
     from public.repasses_financeiros r
     join public.unidades_escolares u on u.id = r.unidade_id
    where u.inep = (98000000 + 1)::text
      and r.acao = 'PDDE Básico'
      and r.parcela = '1ª Parcela'),
  101::numeric,
  'valor alterado no delta foi persistido corretamente'
);

select * from finish();
rollback;
