begin;

select plan(12);

insert into public.unidades_escolares (designacao, nome, inep)
values
  ('ZY.VIEW.001', 'Escola view completa', '97999981'),
  ('ZY.VIEW.002', 'Escola view parcial', '97999982');

create temp table _view_schools as
select id, inep
from public.unidades_escolares
where inep in ('97999981', '97999982');

insert into public.execucao_financeira (
  unidade_id, exercicio, programa,
  reprogramado_custeio, reprogramado_capital,
  parcela_1_custeio, parcela_1_capital,
  parcela_2_custeio, parcela_2_capital
)
select id, 2026, 'basico', 10, 20, 999, 999, 999, 999
from _view_schools;

insert into public.integracoes_financeiras_runs (
  exercicio, origem, publicado_em, workflow_run_id, artifact_id,
  total_unidades, total_contas, total_repasses
) values (
  2026, 'pdde-repasse-conciliador', now(), 999999995001, 999999995101,
  2, 0, 3
);

create temp table _view_run as
select id
from public.integracoes_financeiras_runs
where workflow_run_id = 999999995001
  and artifact_id = 999999995101;

insert into public.repasses_financeiros (
  unidade_id, exercicio, programa, acao, parcela, ordem_exibicao,
  valor_programado, valor_pago,
  custeio_programado, capital_programado,
  custeio_pago, capital_pago,
  data_pagamento, integracao_run_id
)
select s.id, 2026, 'PDDE BÁSICO', 'PDDE Básico', '1ª Parcela', 1,
       100, 100, 60, 40, 60, 40, '2026-05-22'::date, r.id
from _view_schools s cross join _view_run r
union all
select s.id, 2026, 'PDDE BÁSICO', 'PDDE Básico', '2ª Parcela', 2,
       100, 100, 70, 30, 70, 30, '2026-09-17'::date, r.id
from _view_schools s cross join _view_run r
where s.inep = '97999981';

select is(
  (select parcela_1_custeio from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  60::numeric,
  'detalhe usa custeio pago autoritativo da primeira parcela'
);

select is(
  (select parcela_1_capital from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  40::numeric,
  'detalhe usa capital pago autoritativo da primeira parcela'
);

select is(
  (select parcela_2_custeio from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  70::numeric,
  'detalhe usa custeio pago autoritativo da segunda parcela'
);

select is(
  (select parcela_2_capital from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  30::numeric,
  'detalhe usa capital pago autoritativo da segunda parcela'
);

select is(
  (select total_parcelas from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  200::numeric,
  'detalhe soma os dois ciclos oficiais'
);

select is(
  (select total_disponivel_inicial from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  230::numeric,
  'disponivel inicial combina reprogramado com parcelas oficiais'
);

select is(
  (select parcela_2_custeio from public.vw_unidade_detalhe where inep = '97999982' and exercicio = 2026),
  null::numeric,
  'segunda parcela ausente permanece NULL e nao reutiliza zero ou valor legado'
);

select is(
  (select total_parcelas from public.vw_unidade_detalhe where inep = '97999982' and exercicio = 2026),
  null::numeric,
  'total anual incompleto permanece NULL'
);

select is(
  (select total_parcela_1_custeio from public.vw_dashboard_basico where exercicio = 2026 and programa = 'basico'),
  120::numeric,
  'dashboard agrega primeira parcela quando a dimensao esta completa'
);

select is(
  (select total_parcela_2_custeio from public.vw_dashboard_basico where exercicio = 2026 and programa = 'basico'),
  null::numeric,
  'dashboard nao publica total parcial da segunda parcela'
);

select is(
  (select total_parcelas from public.vw_dashboard_basico where exercicio = 2026 and programa = 'basico'),
  null::numeric,
  'dashboard nao publica total anual parcial'
);

select isnt(
  (select parcela_2_custeio from public.vw_unidade_detalhe where inep = '97999981' and exercicio = 2026),
  999::numeric,
  'valor legado de execucao_financeira nao prevalece sobre repasse oficial'
);

select * from finish();
rollback;
