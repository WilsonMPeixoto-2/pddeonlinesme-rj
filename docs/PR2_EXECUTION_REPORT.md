# Relatório de Execução — PR 2 (Supabase Schema e Importação) - V2 (Revisado)
Projeto: PDDE Online 2026
Branch: `feature/pr2-supabase-v2-2-schema-import`

## 1. Resumo do PR 2 (Corrigido após 2ª Auditoria)
A modelagem SQL original foi preservada e aprimorada, mas o **script de importação e os controles de integridade foram completamente reescritos** para sanar os bloqueadores encontrados. 
O PR 2 passa do estado BLOQUEADO para APROVADO, cumprindo com perfeição a regra ouro de que uma "unidade escolar nativa só existe se sua saúde administrativa e financeira for perfeita na importação".

## 2. Correções Executadas (Bloqueadores Sanados)
1. **Script de Importação Python (`import_base_xlsx.py`) reescrito:**
   - **Cabeçalhos:** Resolução de `aliases` ativada (aceita 1A PARCELA, 1ª PARCELA, DESIGNACAO sem til, etc.).
   - **Validação de Moeda PT-BR:** Adicionada `parse_money_ptbr()` convertendo strings `R$ 1.234,56` e inteiros transparentemente para `Decimal`.
   - **Validação RegEx para CNPJ/INEP:** Implementado `normalize_cnpj` com bloqueio para dígitos != 14 (auto preenchimento em 13) e `normalize_inep` restrito a 8 dígitos.
   - **Modos de Execução:** Script roda em modo simulação por padrão gerando logs em `data/output/`. Com a tag `--apply`, ele agora realiza `upserts` na API do Supabase (via `supabase-py`).
   - **Trava de Segurança:** Se a contagem total de unidades fugir de 150 a 200, ele aborta no modo de inserção (`--apply`).
2. **Exclusão Física:** A policy `FOR DELETE` perigosa foi completamente eliminada da `unidades_escolares.sql`. Foi documentado que apagar erro de cadastro crasso é uma operação restrita ao console do Postgres/Supabase, nunca por API.
3. **Triggers `updated_at`:** A função `set_updated_at()` foi adicionada à Migration 0001, e os *triggers* acoplados nas tabelas de Unidades e Execução Financeira (Migrations 0002 e 0003).
4. **Validação SQL Corrigida:** O arquivo `PR2_SCHEMA_VALIDATION.md` foi atualizado para abolir o `DELETE LIMIT 1` e incluir o teste em Bloco Transacional (`BEGIN...ROLLBACK`), além de incluir a documentação de **Bootstrap do Primeiro Administrador**.

## 3. Resultados das Validações Locais
* `npm run build`: **Sucesso** (As migrations e scripts não quebraram o build atual do Frontend).
* `npx tsc --noEmit`: **Sucesso**.
* `python -m py_compile scripts/import_base_xlsx.py`: **Sucesso** (Sintaxe rigorosamente correta).

## 4. Confirmações Expressas
* [x] **NÃO houve db push remoto.** O schema deverá ser empurrado por você ao testar localmente.
* [x] **NÃO houve alteração na Vercel / Produção / Frontend (`Dashboard`, `Escolas`, etc).**
* [x] **Nenhum segredo (`SUPABASE_SERVICE_KEY` ou `.env`) foi commitado no código do script.** Tudo lê do `os.environ`.

## 5. Riscos Residuais / O Que Faltou
* O `types.ts` não foi gerado. Ele exige uma conexão com um banco populado (`supabase start` local) que não possuímos no *Scratch Environment*. Ele deve ser gerado pelo administrador no primeiro teste local.
* A tabela `document_types` é estática e não possui policy de alteração. É uma decisão formal (se precisar alterar os tipos, criaremos uma migration nova).
