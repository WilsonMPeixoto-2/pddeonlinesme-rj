# Relatório de Execução — PR 2 (Supabase Schema e Importação) - V3 (Final)
Projeto: PDDE Online 2026
Branch: `feature/pr2-supabase-v2-2-schema-import`

## 1. Resumo do PR 2 (Corrigido após 3ª Auditoria)
A governança de dados foi consolidada. O PR 2 resolve os "bloqueadores fatais" de sintaxe SQL, falhas de encoding (`mojibake`), e garante precisão monetária irretocável (`Decimal` real) para o ETL. O PR 2 agora atende rigorosamente a todos os critérios da arquitetura sem tocar no frontend ou no ambiente remoto.

## 2. Correções Executadas (Bloqueadores Sanados)
1. **Migration 0001 Reescrita e Higienizada:**
   - Remoção completa do bug da sintaxe com `$$` cru e crases. A função `set_updated_at` agora usa estritamente a sintaxe válida do Postgres.
   - Refatorada as regras `FOR ALL` em `profiles` e `user_roles` para explícitas `FOR INSERT`, `FOR UPDATE` e `FOR DELETE`.
   - Limpeza de caracteres corrompidos (`mojibake`).
2. **Script de Importação Python (`import_base_xlsx.py`) Refinado:**
   - **Precisão Financeira:** Variáveis monetárias são processadas como `Decimal` em toda a cadeia. Se algum dado vier corrompido, a função `parse_money_ptbr` grita com erro de validação (ao invés de silenciar transformando em "0.00"). No `source_payload`, eles viram `string` com pontuação exata (`str(d.quantize(Decimal("0.01"))`), preservando o JSON e a API Supabase livre de imprecisão ponto-flutuante.
   - **Validação de CNPJ e INEP contra `.0` do Excel:** Caso o Excel envie IDs numéricos que interpretados virem floats (ex: `123456789.0`), o `normalize_digits` converte para `int()` primeiro, evitando dígitos espúrios no DB.
   - **Auditoria Plena:** O campo `source_payload` agora traz literalmente todas as colunas da planilha vinculadas na `unidade_escolar`. O Log de importações em `import_logs` grava o array de erros detalhado no BD.
3. **Validação de Banco e Governança:**
   - `PR2_SCHEMA_VALIDATION.md` contém aviso formal obrigatório contra o uso no frontend da `SUPABASE_SERVICE_KEY`.
   - A validação de Bootstrap de Admin inclui Query explícita (`SELECT * FROM public.user_roles`).
   - O teste transacional de Deleção agora busca ativamente uma Escola com execução financeira atrelada, provando o funcionamento da trava `RESTRICT`.

## 3. Resultados das Validações Locais
* `npm run build`: **Sucesso**.
* `npx tsc --noEmit`: **Sucesso**.
* `python -m py_compile scripts/import_base_xlsx.py`: **Sucesso**.

## 4. Confirmações Expressas
* [x] **NÃO houve db push remoto.**
* [x] **NÃO houve alteração na Vercel / Produção.**
* [x] **NÃO houve merge.**
* [x] O `types.ts` aguarda o PR 3 para ser regenerado de um db local válido.
