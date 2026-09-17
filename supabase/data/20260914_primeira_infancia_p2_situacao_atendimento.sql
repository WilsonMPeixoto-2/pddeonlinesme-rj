-- Evidência externa: PDDE Básico — Primeira Infância — P2
-- Fonte recebida: cre04.pdf.xlsx
-- SHA-256: eb310b02b4bfa9f074f795eb28c0b022887ec0ff56f432a9ec9afd18f86dd4df
-- Ordem de pagamento informada pela fonte: 2026-09-14
-- Este arquivo é DML operacional auditável, NÃO uma migration estrutural.
-- Pré-requisito: migration 20260917103000_financial_external_evidence_v1.sql aplicada.
-- Política conservadora: evidência já existente nunca é sobrescrita; divergência aborta a transação.

begin;

create temp table _src_primeira_infancia_p2_20260914 (
  inep text primary key,
  custeio numeric(14,2) not null,
  capital numeric(14,2) not null,
  total numeric(14,2) not null
) on commit drop;

insert into _src_primeira_infancia_p2_20260914 (inep, custeio, capital, total) values
  ('33069298', 794, 1191, 1985),
  ('33069387', 1501.5, 643.5, 2145),
  ('33070407', 1668, 417, 2085),
  ('33070504', 2264.5, 970.5, 3235),
  ('33070547', 1386, 2079, 3465),
  ('33070750', 1644, 411, 2055),
  ('33070806', 3140, 785, 3925),
  ('33095752', 1836, 459, 2295),
  ('33095825', 1124, 281, 1405),
  ('33095892', 589.5, 1375.5, 1965),
  ('33096368', 1908, 477, 2385),
  ('33096465', 1988, 497, 2485),
  ('33096503', 1291.5, 553.5, 1845),
  ('33096511', 1410.5, 604.5, 2015),
  ('33096520', 1101, 734, 1835),
  ('33096538', 1362.5, 1362.5, 2725),
  ('33096546', 867.5, 867.5, 1735),
  ('33096554', 285, 1140, 1425),
  ('33122539', 727.5, 727.5, 1455),
  ('33122768', 947.5, 947.5, 1895),
  ('33122776', 2259, 1506, 3765),
  ('33122822', 1662.5, 712.5, 2375),
  ('33123063', 610.5, 1424.5, 2035),
  ('33136947', 1110, 1665, 2775),
  ('33137331', 1102, 1653, 2755),
  ('33144672', 1543.5, 661.5, 2205),
  ('33144699', 1113, 742, 1855),
  ('33144702', 233.5, 2101.5, 2335),
  ('33144710', 1410.5, 604.5, 2015),
  ('33147248', 1676, 419, 2095),
  ('33147264', 0, 2365, 2365),
  ('33147337', 1326.5, 568.5, 1895),
  ('33160902', 1671, 1114, 2785),
  ('33160910', 1254, 1881, 3135),
  ('33160929', 1740, 435, 2175),
  ('33163979', 0, 1905, 1905),
  ('33163987', 1868, 467, 2335),
  ('33164070', 1791, 1194, 2985),
  ('33164096', 1620.5, 694.5, 2315),
  ('33164118', 2620, 655, 3275),
  ('33167362', 1596, 399, 1995),
  ('33167885', 563, 2252, 2815),
  ('33167893', 1828, 457, 2285),
  ('33170991', 3988, 997, 4985),
  ('33171092', 1472.5, 1472.5, 2945),
  ('33171106', 1832.5, 1832.5, 3665),
  ('33175942', 2372, 593, 2965),
  ('33179514', 1892.5, 1892.5, 3785),
  ('33179549', 3020, 755, 3775),
  ('33179565', 2905, 0, 2905),
  ('33179573', 3020, 755, 3775),
  ('33523258', 2096.5, 898.5, 2995);

do $$
declare
  v_count integer;
  v_custeio numeric(14,2);
  v_capital numeric(14,2);
  v_total numeric(14,2);
  v_matches integer;
  v_divergences integer;
begin
  select count(*), sum(custeio), sum(capital), sum(total)
    into v_count, v_custeio, v_capital, v_total
  from _src_primeira_infancia_p2_20260914;

  if v_count <> 52
     or v_custeio <> 81034.00
     or v_capital <> 51596.00
     or v_total <> 132630.00 then
    raise exception
      'Fonte P2 inválida: count=%, custeio=%, capital=%, total=%',
      v_count, v_custeio, v_capital, v_total;
  end if;

  select count(*)
    into v_matches
  from _src_primeira_infancia_p2_20260914 s
  join public.unidades_escolares u on u.inep = s.inep
  join public.repasses_financeiros r
    on r.unidade_id = u.id
   and r.exercicio = 2026
   and r.programa = 'PDDE BÁSICO'
   and r.acao = 'PDDE Básico — Primeira Infância'
   and r.parcela = 'P2';

  if v_matches <> 52 then
    raise exception 'Esperados 52 repasses P2; localizados %', v_matches;
  end if;

  select count(*)
    into v_divergences
  from _src_primeira_infancia_p2_20260914 s
  join public.unidades_escolares u on u.inep = s.inep
  join public.repasses_financeiros r
    on r.unidade_id = u.id
   and r.exercicio = 2026
   and r.programa = 'PDDE BÁSICO'
   and r.acao = 'PDDE Básico — Primeira Infância'
   and r.parcela = 'P2'
  where r.valor_programado is distinct from s.total
     or r.custeio_programado is distinct from s.custeio
     or r.capital_programado is distinct from s.capital;

  if v_divergences <> 0 then
    raise exception 'Carga abortada: % divergências entre fonte e repasses canônicos', v_divergences;
  end if;
end
$$;

insert into public.repasse_evidencias_financeiras (
  repasse_financeiro_id,
  tipo_evidencia,
  fonte,
  referencia,
  valor_pago_informado,
  custeio_pago_informado,
  capital_pago_informado,
  data_pagamento,
  data_ordem_pagamento,
  observacao
)
select
  r.id,
  'SITUACAO_ATENDIMENTO_FNDE',
  'FNDE - Situação de Atendimento da Entidade',
  'cre04.pdf.xlsx',
  s.total,
  s.custeio,
  s.capital,
  null::date,
  '2026-09-14'::date,
  'Relatório recebido em 16/09/2026; SHA-256 eb310b02b4bfa9f074f795eb28c0b022887ec0ff56f432a9ec9afd18f86dd4df. Conferência 52/52 contra os P2 já existentes; zero divergências. Ordem de pagamento não equivale a crédito bancário.'
from _src_primeira_infancia_p2_20260914 s
join public.unidades_escolares u on u.inep = s.inep
join public.repasses_financeiros r
  on r.unidade_id = u.id
 and r.exercicio = 2026
 and r.programa = 'PDDE BÁSICO'
 and r.acao = 'PDDE Básico — Primeira Infância'
 and r.parcela = 'P2'
on conflict (repasse_financeiro_id, tipo_evidencia) do nothing;

do $$
declare
  v_count integer;
  v_custeio numeric(14,2);
  v_capital numeric(14,2);
  v_total numeric(14,2);
  v_bad_dates integer;
  v_invented_payment_dates integer;
  v_value_divergences integer;
begin
  select
    count(*),
    sum(e.custeio_pago_informado),
    sum(e.capital_pago_informado),
    sum(e.valor_pago_informado),
    count(*) filter (where e.data_ordem_pagamento <> '2026-09-14'::date),
    count(*) filter (where e.data_pagamento is not null),
    count(*) filter (
      where e.valor_pago_informado is distinct from s.total
         or e.custeio_pago_informado is distinct from s.custeio
         or e.capital_pago_informado is distinct from s.capital
    )
  into
    v_count, v_custeio, v_capital, v_total, v_bad_dates, v_invented_payment_dates, v_value_divergences
  from public.repasse_evidencias_financeiras e
  join public.repasses_financeiros r on r.id = e.repasse_financeiro_id
  join public.unidades_escolares u on u.id = r.unidade_id
  join _src_primeira_infancia_p2_20260914 s on s.inep = u.inep
  where e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE';

  if v_count <> 52
     or v_custeio <> 81034.00
     or v_capital <> 51596.00
     or v_total <> 132630.00
     or v_bad_dates <> 0
     or v_invented_payment_dates <> 0
     or v_value_divergences <> 0 then
    raise exception
      'Pós-condição inválida: count=%, custeio=%, capital=%, total=%, ordens_incorretas=%, datas_pagamento_inventadas=%, divergencias_valor=%',
      v_count, v_custeio, v_capital, v_total, v_bad_dates, v_invented_payment_dates, v_value_divergences;
  end if;
end
$$;

commit;

select
  count(*) as evidencias,
  sum(valor_pago_informado) as valor_pago_informado,
  sum(custeio_pago_informado) as custeio_pago_informado,
  sum(capital_pago_informado) as capital_pago_informado,
  min(data_ordem_pagamento) as primeira_ordem,
  max(data_ordem_pagamento) as ultima_ordem,
  count(*) filter (where data_pagamento is not null) as datas_pagamento_distintas
from public.repasse_evidencias_financeiras
where tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE'
  and referencia = 'cre04.pdf.xlsx';
