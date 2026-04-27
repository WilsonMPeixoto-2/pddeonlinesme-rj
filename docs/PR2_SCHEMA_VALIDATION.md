# Validações SQL do Schema (PR 2)
Projeto: PDDE Online 2026

Rode estas queries localmente para atestar a sanidade do banco após as migrations ou importações.

## Bootstrap do primeiro Admin
A chave `SUPABASE_SERVICE_KEY`, se usada em tarefas administrativas fora deste script, é de uso estrito local/servidor. **Nunca exponha no frontend (VITE_) nem envie para o repositório.**
O importador oficial deste PR usa `DATABASE_URL` no modo `--apply`, com transação única no Postgres, para evitar carga parcial entre `unidades_escolares` e `execucao_financeira`.
Como o RLS está trancado para inserções no `user_roles`, use o seguinte passo para criar seu primeiro administrador:
1. Crie o seu usuário via painel do Supabase Auth.
2. Copie o `id` (UUID) gerado.
3. No SQL Editor do Supabase, insira os privilégios básicos:
```sql
INSERT INTO public.profiles (id, email) VALUES ('<seu-uuid>', 'admin@teste.com');
INSERT INTO public.user_roles (user_id, role) VALUES ('<seu-uuid>', 'admin');
```
4. Para garantir (validação direta e autenticada):
```sql
-- Validação Direta:
SELECT * FROM public.user_roles WHERE user_id = '<seu-uuid>' AND role = 'admin';

-- Validação autenticada via app/API, com JWT do usuário criado:
SELECT public.has_role('admin');
```

Observação: no SQL Editor comum, `auth.uid()` pode não representar o usuário autenticado do app. Use a validação direta acima como conferência administrativa e valide `has_role('admin')` também por sessão real do app/API.

## Gate do importador
O modo `--apply` do `scripts/import_base_xlsx.py` só deve ser usado após dry-run sem erros de validação. A carga final exige 163 unidades válidas. Se a BASE oficial vier com total diferente, mas ainda dentro da faixa segura de 150 a 200, registre aprovação humana e rode com `--approve-divergent-count`.

Dependências operacionais do script:

```bash
pip install openpyxl "psycopg[binary]"
```

## Validações de Banco

```sql
-- 1. Total de unidades ativas
SELECT COUNT(*) FROM public.unidades_escolares WHERE ativo = true;

-- 2. Total de execuções financeiras por exercício/programa
SELECT exercicio, programa, COUNT(*) 
FROM public.execucao_financeira 
GROUP BY exercicio, programa;

-- 3. Unidades ativas sem execucao_financeira no exercício-base (GATE DE BLOQUEIO PARA CUTOVER - DEVE SER ZERO)
SELECT ue.designacao, ue.nome 
FROM public.unidades_escolares ue
LEFT JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id AND ef.exercicio = 2026
WHERE ue.ativo = true AND ef.id IS NULL;

-- 4. Unidades com designacao contendo '—' (DEVE RETORNAR ZERO)
SELECT COUNT(*) FROM public.unidades_escolares WHERE designacao LIKE '%—%';

-- 5. Unidades com nome nulo ou vazio (DEVE RETORNAR ZERO)
SELECT COUNT(*) FROM public.unidades_escolares WHERE nome IS NULL OR trim(nome) = '';

-- 5.1. Duplicidade de designacao (DEVE RETORNAR ZERO)
SELECT designacao, COUNT(*)
FROM public.unidades_escolares
GROUP BY designacao
HAVING COUNT(*) > 1;

-- 6. CNPJs com tamanho diferente de 14, quando não nulos (DEVE RETORNAR ZERO)
SELECT designacao, cnpj FROM public.unidades_escolares WHERE cnpj IS NOT NULL AND length(cnpj) != 14;

-- 7. INEPs com tamanho diferente de 8, quando não nulos (DEVE RETORNAR ZERO)
SELECT designacao, inep FROM public.unidades_escolares WHERE inep IS NOT NULL AND length(inep) != 8;

-- 8. Contagem de document_types
SELECT COUNT(*) FROM public.document_types;

-- 9. Contagem de documentos_gerados
SELECT exercicio, status, COUNT(*) FROM public.documentos_gerados GROUP BY exercicio, status;

-- 10. Validação de Views Retornando Quantidade Esperada
-- A View deve retornar o mesmo número de linhas da tabela de execucao_financeira para o exercício/programa base.
SELECT 
  (SELECT count(*) FROM public.vw_unidades_escolares_frontend WHERE exercicio = 2026 AND programa = 'basico') AS total_na_view,
  (SELECT count(*) FROM public.execucao_financeira WHERE exercicio = 2026 AND programa = 'basico') AS total_execucao;

-- 10.1. Campos normalizados sem caracteres indevidos
SELECT designacao, cnpj FROM public.unidades_escolares WHERE cnpj IS NOT NULL AND cnpj !~ '^[0-9]{14}$';
SELECT designacao, inep FROM public.unidades_escolares WHERE inep IS NOT NULL AND inep !~ '^[0-9]{8}$';

-- 11. Tentativa de delete físico com histórico (Teste Transacional Controlado)
-- Não execute exclusões sem transação. Este bloco assegura que o ON DELETE RESTRICT barra exclusões indevidas.
BEGIN;
SELECT ue.id INTO TEMP my_target 
FROM public.unidades_escolares ue
JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id
WHERE ue.ativo = true LIMIT 1;
-- O DELETE abaixo DEVE FALHAR com erro de foreign_key_violation:
-- DELETE FROM public.unidades_escolares WHERE id = (SELECT id FROM my_target);
ROLLBACK;
```
