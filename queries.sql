-- Query 1
select count(*) as total
from public.vw_unidade_detalhe
where exercicio = 2026
and programa = 'basico';

-- Query 2
select
  unidade_id,
  designacao,
  nome,
  inep,
  cnpj,
  diretor,
  endereco,
  banco,
  agencia,
  conta_corrente,
  exercicio,
  programa,
  reprogramado_custeio,
  reprogramado_capital,
  parcela_1_custeio,
  parcela_1_capital,
  parcela_2_custeio,
  parcela_2_capital,
  total_reprogramado,
  total_parcelas,
  total_disponivel_inicial
from public.vw_unidade_detalhe
where exercicio = 2026
and programa = 'basico'
order by designacao
limit 5;

-- Query 3
select count(*) as sem_execucao
from public.vw_unidades_localizador l
left join public.vw_unidade_detalhe d
  on d.unidade_id = l.id
  and d.exercicio = 2026
  and d.programa = 'basico'
where d.unidade_id is null;

-- Query 4.1
select
  count(*) as unidades,
  sum(total_reprogramado) as soma_total_reprogramado,
  sum(total_parcelas) as soma_total_parcelas,
  sum(total_disponivel_inicial) as soma_total_disponivel_inicial
from public.vw_unidade_detalhe
where exercicio = 2026
and programa = 'basico';

-- Query 4.2
select
  total_unidades,
  total_reprogramado,
  total_parcelas,
  total_disponivel_inicial
from public.vw_dashboard_basico
where exercicio = 2026
and programa = 'basico';

-- Query 5
select
  unidade_id,
  designacao,
  nome,
  total_reprogramado,
  total_parcelas,
  total_disponivel_inicial
from public.vw_unidade_detalhe
where exercicio = 2026
and programa = 'basico'
order by designacao
limit 1;
