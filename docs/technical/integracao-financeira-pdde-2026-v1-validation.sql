-- Verificações pós-carga da Integração Financeira PDDE 2026 V1.
-- Este arquivo é somente leitura e pode ser executado após uma nova carga.

-- Universo e totais principais.
SELECT
  (SELECT count(*) FROM public.unidades_escolares) AS unidades,
  (SELECT count(*) FROM public.contas_bancarias
    WHERE exercicio = 2026
      AND programa IN ('PDDE BÁSICO', 'PDDE QUALIDADE', 'PDDE EQUIDADE')) AS contas_2026,
  (SELECT count(*) FROM public.contas_bancarias
    WHERE exercicio = 2026 AND principal) AS contas_principais,
  (SELECT count(*) FROM public.repasses_financeiros
    WHERE exercicio = 2026) AS repasses_2026,
  (SELECT count(DISTINCT unidade_id) FROM public.repasses_financeiros
    WHERE exercicio = 2026) AS unidades_com_repasses,
  (SELECT sum(valor_programado) FROM public.repasses_financeiros
    WHERE exercicio = 2026) AS total_programado,
  (SELECT sum(valor_pago) FROM public.repasses_financeiros
    WHERE exercicio = 2026) AS total_pago;

-- Deve retornar 0 unidades irregulares.
WITH principais AS (
  SELECT unidade_id, count(*) FILTER (WHERE principal) AS quantidade
  FROM public.contas_bancarias
  WHERE exercicio = 2026
  GROUP BY unidade_id
)
SELECT count(*) AS unidades_irregulares
FROM principais
WHERE quantidade <> 1;

-- Deve retornar 0 duplicidades.
SELECT count(*) AS duplicidades_conta
FROM (
  SELECT unidade_id, agencia, conta_corrente, count(*)
  FROM public.contas_bancarias
  WHERE exercicio = 2026
  GROUP BY unidade_id, agencia, conta_corrente
  HAVING count(*) > 1
) d;

SELECT count(*) AS duplicidades_repasses
FROM (
  SELECT unidade_id, exercicio, acao, parcela, count(*)
  FROM public.repasses_financeiros
  GROUP BY unidade_id, exercicio, acao, parcela
  HAVING count(*) > 1
) d;

-- Deve retornar 0 vínculos órfãos.
SELECT count(*) AS contas_orfas
FROM public.repasses_financeiros r
WHERE r.conta_bancaria_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.contas_bancarias c
    WHERE c.id = r.conta_bancaria_id
  );

-- Contrato Financeiro v1: a conta vinculada deve pertencer à mesma unidade.
SELECT count(*) AS vinculos_com_unidade_incorreta
FROM public.repasses_financeiros r
JOIN public.contas_bancarias c ON c.id = r.conta_bancaria_id
WHERE c.unidade_id <> r.unidade_id;

-- Quando a conta possui programa conhecido, ele deve coincidir com o repasse.
SELECT count(*) AS vinculos_com_programa_incorreto
FROM public.repasses_financeiros r
JOIN public.contas_bancarias c ON c.id = r.conta_bancaria_id
WHERE c.programa IS NOT NULL
  AND c.programa IS DISTINCT FROM r.programa;

-- Quando custeio e capital são conhecidos, a soma deve coincidir com o total.
SELECT count(*) AS componentes_programados_inconsistentes
FROM public.repasses_financeiros
WHERE custeio_programado IS NOT NULL
  AND capital_programado IS NOT NULL
  AND custeio_programado + capital_programado <> valor_programado;

SELECT count(*) AS componentes_pagos_inconsistentes
FROM public.repasses_financeiros
WHERE custeio_pago IS NOT NULL
  AND capital_pago IS NOT NULL
  AND (
    valor_pago IS NULL
    OR custeio_pago + capital_pago <> valor_pago
  );

-- Todo repasse publicado deve apontar para a carga que o produziu.
SELECT count(*) AS repasses_sem_integracao
FROM public.repasses_financeiros
WHERE integracao_run_id IS NULL;

SELECT
  r.exercicio,
  count(*) AS repasses,
  count(DISTINCT r.integracao_run_id) AS cargas_referenciadas
FROM public.repasses_financeiros r
GROUP BY r.exercicio
ORDER BY r.exercicio;
