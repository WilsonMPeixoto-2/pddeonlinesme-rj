# Relatório de Execução — PR 2 (Supabase Schema e Importação) - V4 (Auditoria Codex)
Projeto: PDDE Online 2026
Branch: `feature/pr2-supabase-v2-2-schema-import`

## 1. Resumo do PR 2 (Corrigido após auditoria Codex)
A governança de dados foi consolidada sem tocar no frontend, na Vercel ou no Supabase remoto. Após a terceira rodada, a auditoria Codex ainda encontrou dois ajustes finais: policies administrativas sem leitura geral em `profiles/user_roles` e importador aplicando carga parcial mesmo com erros/divergência não aprovada. Ambos foram corrigidos.

## 2. Correções Executadas (Bloqueadores Sanados)
1. **Migration 0001 Reescrita e Higienizada:**
   - Remoção completa do bug da sintaxe com `$$` cru e crases. A função `set_updated_at` agora usa estritamente a sintaxe válida do Postgres.
   - Refatorada as regras `FOR ALL` em `profiles` e `user_roles` para policies explícitas de `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
   - Restaurada a leitura administrativa geral em `profiles` e `user_roles`, necessária porque `UPDATE` em RLS depende de policy de leitura.
   - Adicionado `WITH CHECK` explícito nas policies administrativas de `UPDATE`.
   - A função `set_updated_at()` não usa `SECURITY DEFINER`, pois não precisa de privilégio elevado.
   - Limpeza de caracteres corrompidos (`mojibake`).
2. **Script de Importação Python (`import_base_xlsx.py`) Refinado:**
   - **Precisão Financeira:** Variáveis monetárias são processadas como `Decimal` em toda a cadeia. Se algum dado vier corrompido, a função `parse_money_ptbr` grita com erro de validação (ao invés de silenciar transformando em "0.00"). No `source_payload`, eles viram `string` com pontuação exata (`str(d.quantize(Decimal("0.01"))`), preservando o JSON e a API Supabase livre de imprecisão ponto-flutuante.
   - **Validação de CNPJ e INEP contra `.0` do Excel:** Caso o Excel envie IDs numéricos que interpretados virem floats (ex: `123456789.0`), o `normalize_digits` converte para `int()` primeiro, evitando dígitos espúrios no DB.
   - **Auditoria Plena:** O campo `source_payload` agora traz literalmente todas as colunas da planilha vinculadas na `unidade_escolar`. O Log de importações em `import_logs` grava o array de erros detalhado no BD.
   - O modo `--apply` aborta se houver erro de validação de linha.
   - O importador rejeita `designacao` duplicada e `designacao` contaminada com separador de rótulo/nome.
   - O modo `--apply` exige 163 unidades válidas; totais divergentes dentro da faixa 150-200 só passam com `--approve-divergent-count`, após aprovação humana documentada.
   - `inserted_rows` e `updated_rows` agora são contados por consulta prévia antes do upsert de `unidades_escolares`.
   - O modo `--apply` usa `DATABASE_URL` e uma transação única no Postgres, evitando unidade ativa salva sem a respectiva `execucao_financeira`.
3. **Validação de Banco e Governança:**
   - `PR2_SCHEMA_VALIDATION.md` contém aviso formal obrigatório contra o uso no frontend da `SUPABASE_SERVICE_KEY`.
   - `PR2_SCHEMA_VALIDATION.md` registra que o importador usa `DATABASE_URL` e exige `openpyxl` + `psycopg[binary]` no ambiente operacional.
   - A validação de Bootstrap de Admin inclui Query explícita (`SELECT * FROM public.user_roles`).
   - O teste transacional de Deleção agora busca ativamente uma Escola com execução financeira atrelada, provando o funcionamento da trava `RESTRICT`.
   - A validação de views foi ajustada para comparar o mesmo `exercicio/programa` da execução financeira.

## 3. Resultados das Validações Locais
* `python -m py_compile scripts/import_base_xlsx.py`: **Sucesso (Exit 0)**.
* Testes diretos de normalização do importador: **Sucesso** (`CNPJ/INEP` com `.0`, moeda PT-BR, milhares, valor inválido e valor negativo).
* Dry-run sintético com XLSX temporário: **Sucesso**.
* `npx tsc --noEmit`: **Sucesso**.
* `npm run build`: **Sucesso**.
* `npm test`: **Sucesso** (1 teste).
* `npm run lint`: **Sucesso com 1 warning preexistente** em `src/hooks/useExercicio.tsx` (`react-refresh/only-export-components`).

* `supabase db reset --local`: **executado com sucesso na retomada PR 3A**, após instalação e inicialização do Docker Desktop no Windows. As migrations `20260427000100` a `20260427000600` foram aplicadas no banco local.
* Verificação direta do schema local: **sucesso**. Confirmadas 7 tabelas públicas (`profiles`, `user_roles`, `unidades_escolares`, `execucao_financeira`, `import_logs`, `document_types`, `documentos_gerados`), 2 views (`vw_unidades_escolares_frontend`, `vw_unidades_status`) e enum `app_role` com `admin`, `operador`, `diretor`.
* `src/integrations/supabase/types.ts`: **regenerado no PR 3A** a partir do banco local validado.

## 4. Confirmações Expressas
* [x] **NÃO houve db push remoto.**
* [x] **NÃO houve alteração na Vercel / Produção.**
* [x] **NÃO houve merge.**
* [x] O `types.ts` foi regenerado somente após validação local do schema.

## 5. Registro de Retomada
Em 27 de abril de 2026, o bloqueio ambiental do PR 2 foi removido com a instalação do Docker Desktop. A validação local foi concluída na branch `feature/pr3a-supabase-types-local-validation`, preservando a regra de não aplicar migrations em Supabase remoto sem revisão humana.
