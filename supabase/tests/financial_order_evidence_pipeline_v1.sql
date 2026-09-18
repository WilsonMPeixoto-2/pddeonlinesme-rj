begin;

select plan(10);

select ok(
  to_regprocedure('public.sync_financial_order_evidence_v1(jsonb)') is not null,
  'helper de evidencia de ordem existe'
);

insert into public.unidades_escolares (designacao, nome, inep)
values ('ZY.ORDER.001', 'Escola ordem automatica', '97999991');

create temp table _order_school as
select id
from public.unidades_escolares
where inep = '97999991';

insert into public.integracoes_financeiras_runs (
  exercicio, origem, publicado_em, workflow_run_id, artifact_id,
  total_unidades, total_contas, total_repasses
) values (
  2026, 'pdde-repasse-conciliador', now(), 999999997001, 999999997101,
  163, 1, 1
);

create temp table _order_run as
select id
from public.integracoes_financeiras_runs
where workflow_run_id = 999999997001
  and artifact_id = 999999997101;

insert into public.repasses_financeiros (
  unidade_id, exercicio, programa, acao, parcela, ordem_exibicao,
  valor_programado, valor_pago,
  custeio_programado, capital_programado,
  custeio_pago, capital_pago,
  data_pagamento, data_ordem_pagamento,
  integracao_run_id
)
select
  s.id, 2026, 'PDDE BÁSICO', 'PDDE Básico — Primeira Infância', 'P2', 2,
  2775, null, 1110, 1665, null, null, null, '2026-09-14'::date,
  r.id
from _order_school s cross join _order_run r;

create temp table _order_payload as
select jsonb_build_object(
  'exercise', 2026,
  'source', jsonb_build_object(
    'origin', 'pdde-repasse-conciliador',
    'workflowRunId', 999999997001,
    'artifactId', 999999997101
  ),
  'repasses', jsonb_build_array(jsonb_build_object(
    'inep', '97999991',
    'exercise', 2026,
    'program', 'PDDE BÁSICO',
    'action', 'PDDE Básico — Primeira Infância',
    'installment', 'P2',
    'displayOrder', 2,
    'programmed', 2775,
    'paid', null,
    'programmedCusteio', 1110,
    'programmedCapital', 1665,
    'paidCusteio', null,
    'paidCapital', null,
    'paymentDate', null,
    'paymentOrderDate', '2026-09-14',
    'account', null
  ))
) as payload;

create temp table _order_first as
select public.sync_financial_order_evidence_v1(payload) as result
from _order_payload;

select is(
  (select (result->>'candidates')::integer from _order_first),
  1,
  'uma ordem sem pagamento e candidata a evidencia'
);

select is(
  (select (result->>'inserted')::integer from _order_first),
  1,
  'primeira sincronizacao insere a evidencia'
);

select is(
  (select valor_pago_informado
     from public.repasse_evidencias_financeiras e
     join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
    where r.unidade_id = (select id from _order_school)
      and e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'),
  2775::numeric,
  'valor da ordem e preservado como evidencia complementar'
);

select is(
  (select custeio_pago_informado
     from public.repasse_evidencias_financeiras e
     join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
    where r.unidade_id = (select id from _order_school)
      and e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'),
  1110::numeric,
  'custeio da ordem e preservado'
);

select is(
  (select capital_pago_informado
     from public.repasse_evidencias_financeiras e
     join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
    where r.unidade_id = (select id from _order_school)
      and e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'),
  1665::numeric,
  'capital da ordem e preservado'
);

select is(
  (select data_ordem_pagamento
     from public.repasse_evidencias_financeiras e
     join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
    where r.unidade_id = (select id from _order_school)
      and e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'),
  '2026-09-14'::date,
  'data da ordem e preservada'
);

select is(
  (select data_pagamento
     from public.repasse_evidencias_financeiras e
     join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
    where r.unidade_id = (select id from _order_school)
      and e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'),
  null::date,
  'ordem nao inventa data de pagamento'
);

select is(
  (select valor_pago
     from public.repasses_financeiros
    where unidade_id = (select id from _order_school)
      and acao = 'PDDE Básico — Primeira Infância'
      and parcela = 'P2'),
  null::numeric,
  'snapshot canonico continua sem pagamento inventado'
);

create temp table _order_second as
select public.sync_financial_order_evidence_v1(payload) as result
from _order_payload;

select is(
  (select (result->>'inserted')::integer from _order_second),
  0,
  'repeticao da mesma evidencia e idempotente'
);

select is(
  (select valor_pago
     from public.vw_repasses_financeiros_unidade
    where unidade_id = (select id from _order_school)
      and acao = 'PDDE Básico — Primeira Infância'
      and parcela = 'P2'),
  2775::numeric,
  'view operacional expoe a ordem sem alterar o fato canonico'
);

select * from finish();
rollback;
