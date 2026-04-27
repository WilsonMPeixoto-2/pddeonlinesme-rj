# Validações SQL do Schema (PR 2)
Projeto: PDDE Online 2026

Rode estas queries localmente para atestar a sanidade do banco após as migrations ou importações:

```sql
-- 1. Total de unidades ativas
SELECT COUNT(*) FROM public.unidades_escolares WHERE ativo = true;

-- 2. Total de execuções financeiras por exercício/programa
SELECT exercicio, programa, COUNT(*) 
FROM public.execucao_financeira 
GROUP BY exercicio, programa;

-- 3. Unidades ativas sem execucao_financeira no exercício-base (DEVE RETORNAR ZERO)
SELECT ue.designacao, ue.nome 
FROM public.unidades_escolares ue
LEFT JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id AND ef.exercicio = 2026
WHERE ue.ativo = true AND ef.id IS NULL;

-- 4. Unidades com designacao contendo '—' (DEVE RETORNAR ZERO)
SELECT COUNT(*) FROM public.unidades_escolares WHERE designacao LIKE '%—%';

-- 5. Unidades com nome nulo ou vazio (DEVE RETORNAR ZERO)
SELECT COUNT(*) FROM public.unidades_escolares WHERE nome IS NULL OR trim(nome) = '';

-- 6. CNPJs com tamanho diferente de 14, quando não nulos (DEVE RETORNAR ZERO)
SELECT designacao, cnpj FROM public.unidades_escolares WHERE cnpj IS NOT NULL AND length(cnpj) != 14;

-- 7. INEPs com tamanho diferente de 8, quando não nulos (DEVE RETORNAR ZERO)
SELECT designacao, inep FROM public.unidades_escolares WHERE inep IS NOT NULL AND length(inep) != 8;

-- 8. Contagem de document_types
SELECT COUNT(*) FROM public.document_types;

-- 9. Contagem de documentos_gerados
SELECT exercicio, status, COUNT(*) FROM public.documentos_gerados GROUP BY exercicio, status;

-- 10. Tentativa de delete físico com histórico (Deve falhar com foreign_key_violation se for RESTRICT)
-- DELETE FROM public.unidades_escolares LIMIT 1;
```
