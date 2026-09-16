begin;

select plan(7);

insert into public.unidades_escolares (designacao, nome, inep)
values ('ZY.EVID.001', 'Escola evidência', '97000001');

insert into public.integracoes_financeiras_runs (
  id, exercicio, origem, total_unidades, total_contas, total_repasses
) values
  ('97000000-0000-0000-0000-000000000001', 2026, 'pddeinfo-attendance-export', 1, 0, 1),
  ('97000000-0000-0000-0000-000000000002', 2026, 'pdde-repasse-conciliador', 1, 0, 1);

insert into public.repasses_financeiros (
  id,
  unidade_id,
  exercicio,
  programa,
  acao,
  parcela,
  ordem_exibicao,
  valor_programado,
  valor_pago,
  custeio_programado,
  capital_programado,
  custeio_pago,
  capital_pago,
  data_pagamento,
  data_ordem_pagamento,
  integracao_run_id
)
select
  '97000000-0000-0000-0000-000000000010'::uuid,
  u.id,
  2026,
  'PDDE BÁSICO',
  'PDDE Básico — Primeira Infância',
  'P2',
  2,
  125,
  125,
  75,
  50,
  75,
  50,
  null,
  '2026-09-14'::date,
  '97000000-0000-0000-0000-000000000001'::uuid
from public.unidades_escolares u
where u.inep = '97000001';

insert into public.financial_payment_evidence (
  repasse_id,
  integration_run_id,
  evidence_kind,
  valor_pago,
  custeio_pago,
  capital_pago,
  data_pagamento,
  data_ordem_pagamento
) values (
  '97000000-0000-0000-0000-000000000010'::uuid,
  '97000000-0000-0000-0000-000000000001'::uuid,
  'PDDEINFO_ATTENDANCE_EXPORT',
  125,
  75,
  50,
  null,
  '2026-09-14'::date
);

update public.repasses_financeiros
set
  valor_pago = null,
  custeio_pago = null,
  capital_pago = null,
  data_pagamento = null,
  data_ordem_pagamento = null,
  integracao_run_id = '97000000-0000-0000-0000-000000000002'::uuid
where id = '97000000-0000-0000-0000-000000000010'::uuid;

select is(
  (select valor_pago from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  125::numeric,
  'snapshot sem pagamento nao apaga valor pago vindo de evidencia suplementar'
);

select is(
  (select custeio_pago from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  75::numeric,
  'snapshot sem pagamento nao apaga custeio pago vindo de evidencia suplementar'
);

select is(
  (select capital_pago from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  50::numeric,
  'snapshot sem pagamento nao apaga capital pago vindo de evidencia suplementar'
);

select is(
  (select data_ordem_pagamento from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  '2026-09-14'::date,
  'snapshot sem ordem nao apaga a data da ordem conhecida'
);

select is(
  (select count(*)::integer from public.financial_payment_evidence where repasse_id = '97000000-0000-0000-0000-000000000010'::uuid),
  1,
  'evidencia suplementar permanece registrada de forma auditavel'
);

update public.repasses_financeiros
set
  valor_pago = 126,
  custeio_pago = 80,
  capital_pago = 46,
  data_pagamento = '2026-09-16'::date,
  data_ordem_pagamento = '2026-09-15'::date,
  integracao_run_id = '97000000-0000-0000-0000-000000000002'::uuid
where id = '97000000-0000-0000-0000-000000000010'::uuid;

select is(
  (select valor_pago from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  126::numeric,
  'snapshot canonico com pagamento mais novo pode atualizar o valor pago'
);

select is(
  (select data_pagamento from public.repasses_financeiros where id = '97000000-0000-0000-0000-000000000010'::uuid),
  '2026-09-16'::date,
  'snapshot canonico com data de pagamento pode substituir a ausencia anterior'
);

select * from finish();
rollback;