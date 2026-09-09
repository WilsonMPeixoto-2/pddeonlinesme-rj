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
