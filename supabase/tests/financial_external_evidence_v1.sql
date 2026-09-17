begin;

select plan(8);

insert into public.unidades_escolares (designacao, nome, inep)
values ('ZY.EVID.001', 'Escola evidencia externa', '97999992');

create temp table _evidence_school as
select id
from public.unidades_escolares
where inep = '97999992';

insert into public.repasses_financeiros (
  unidade_id, exercicio, programa, acao, parcela, ordem_exibicao,
  valor_programado, valor_pago,
  custeio_programado, capital_programado,
  custeio_pago, capital_pago,
  data_pagamento, data_ordem_pagamento
)
select
  id, 2026, 'PDDE BÁSICO', 'PDDE Básico — Primeira Infância', 'P2', 2,
  100, null, 60, 40, null, null, null, null
from _evidence_school;

create temp table _evidence_repasse as
select id
from public.repasses_financeiros
where unidade_id = (select id from _evidence_school)
  and exercicio = 2026
  and acao = 'PDDE Básico — Primeira Infância'
  and parcela = 'P2';

insert into public.repasse_evidencias_financeiras (
  repasse_financeiro_id,
  tipo_evidencia,
  fonte,
  referencia,
  valor_pago_informado,
  custeio_pago_informado,
  capital_pago_informado,
  data_ordem_pagamento
)
select
  id,
  'SITUACAO_ATENDIMENTO_FNDE',
  'FNDE - Situação de Atendimento',
  'relatorio-teste.xlsx',
  100,
  60,
  40,
  '2026-09-14'::date
from _evidence_repasse;

select is(
  (select valor_pago from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  100::numeric,
  'view operacional usa pagamento informado como fallback'
);

select is(
  (select custeio_pago from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  60::numeric,
  'view operacional usa custeio informado como fallback'
);

select is(
  (select capital_pago from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  40::numeric,
  'view operacional usa capital informado como fallback'
);

select is(
  (select data_ordem_pagamento from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  '2026-09-14'::date,
  'view operacional expoe ordem sem inventar data de pagamento'
);

select is(
  (select data_pagamento from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  null::date,
  'ordem de pagamento nao vira data de pagamento'
);

select is(
  (select valor_pago from public.repasses_financeiros where id = (select id from _evidence_repasse)),
  null::numeric,
  'snapshot canonico permanece sem pagamento inventado'
);

select throws_ok(
  format('delete from public.repasses_financeiros where id = %L', (select id::text from _evidence_repasse)),
  '23503',
  null,
  'evidencia externa impede exclusao silenciosa do repasse base'
);

update public.repasses_financeiros
set valor_pago = 100,
    custeio_pago = 60,
    capital_pago = 40,
    data_ordem_pagamento = '2026-09-15'::date
where id = (select id from _evidence_repasse);

select is(
  (select data_ordem_pagamento from public.vw_repasses_financeiros_unidade where id = (select id from _evidence_repasse)),
  '2026-09-15'::date,
  'fato canonico posterior tem precedencia sobre o complemento externo'
);

select * from finish();
rollback;
