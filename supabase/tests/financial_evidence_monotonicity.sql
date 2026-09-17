begin;

select plan(6);

insert into public.unidades_escolares (designacao, nome, inep)
values ('ZY.MONO.001', 'Escola monotonicidade', '97999991');

create temp table _mono_school as
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

create temp table _mono_run_1 as
select id
from public.integracoes_financeiras_runs
where workflow_run_id = 999999997001;

insert into public.integracoes_financeiras_runs (
  exercicio, origem, publicado_em, workflow_run_id, artifact_id,
  total_unidades, total_contas, total_repasses
) values (
  2026, 'pdde-repasse-conciliador', now(), 999999997002, 999999997102,
  163, 1, 1
);

create temp table _mono_run_2 as
select id
from public.integracoes_financeiras_runs
where workflow_run_id = 999999997002;

insert into public.repasses_financeiros (
  unidade_id, exercicio, programa, acao, parcela, ordem_exibicao,
  valor_programado, valor_pago, custeio_programado, capital_programado,
  custeio_pago, capital_pago, data_pagamento, data_ordem_pagamento,
  integracao_run_id
)
select
  s.id, 2026, 'PDDE BÁSICO', 'PDDE Básico — Primeira Infância', 'P2', 2,
  100, 100, 60, 40, 60, 40, null, '2026-09-14', r.id
from _mono_school s cross join _mono_run_1 r;

create temp table _mono_baseline as
select id, ctid::text as tuple_ctid, integracao_run_id
from public.repasses_financeiros
where unidade_id = (select id from _mono_school)
  and exercicio = 2026
  and acao = 'PDDE Básico — Primeira Infância'
  and parcela = 'P2';

update public.repasses_financeiros
set valor_pago = null,
    custeio_pago = null,
    capital_pago = null,
    data_pagamento = null,
    data_ordem_pagamento = null,
    integracao_run_id = (select id from _mono_run_2)
where id = (select id from _mono_baseline);

select is(
  (select valor_pago from public.repasses_financeiros where id = (select id from _mono_baseline)),
  100::numeric,
  'nova run nao apaga pagamento informado ja conhecido'
);

select is(
  (select data_ordem_pagamento from public.repasses_financeiros where id = (select id from _mono_baseline)),
  '2026-09-14'::date,
  'nova run nao apaga ordem de pagamento ja conhecida'
);

select is(
  (select integracao_run_id from public.repasses_financeiros where id = (select id from _mono_baseline)),
  (select integracao_run_id from _mono_baseline),
  'regressao pura nao troca a run que introduziu a evidencia vigente'
);

select is(
  (select ctid::text from public.repasses_financeiros where id = (select id from _mono_baseline)),
  (select tuple_ctid from _mono_baseline),
  'regressao pura nao produz update fisico'
);

update public.repasses_financeiros
set valor_programado = 110,
    custeio_programado = 60,
    capital_programado = 50,
    valor_pago = null,
    custeio_pago = null,
    capital_pago = null,
    data_ordem_pagamento = null,
    integracao_run_id = (select id from _mono_run_2)
where id = (select id from _mono_baseline);

select is(
  (select valor_programado from public.repasses_financeiros where id = (select id from _mono_baseline)),
  110::numeric,
  'mudanca real do snapshot continua sendo aplicada'
);

select results_eq(
  $$select valor_pago, custeio_pago, capital_pago, data_ordem_pagamento, integracao_run_id
      from public.repasses_financeiros
     where id = (select id from _mono_baseline)$$,
  $$select 100::numeric, 60::numeric, 40::numeric, '2026-09-14'::date, id
      from _mono_run_2$$,
  'mudanca real preserva evidencias fortes e associa a nova run'
);

select * from finish();
rollback;
