# Plano de Migração Supabase Próprio v2.2.1

## Sumário
Correção Semântica da BASE e Adaptação Controlada do Frontend (PDDE Online 2026).
**Versão Atualizada (v2.2.1):** Incorpora as Emendas E1 a E10 da Auditoria G0.

## Decisão-mãe do plano
A migração para o Supabase próprio não replicará a confusão semântica produzida no protótipo Lovable. A BASE oficial define a semântica: DESIGNAÇÃO será preservada como designacao (código), NOME será preservado como nome. 

## Emendas Obrigatórias de Integridade (v2.2.1)
*   **E1 — Inicialização:** Inicializar `execucao_financeira` para cada unidade/ano.
*   **E2 — View Segura:** Prevenir ocultação de escolas por LEFT JOINs falhos.
*   **E3 — No Cascade:** `ON DELETE RESTRICT` e `ativo=false`.
*   **E4 — React Query Cache:** Inclusão de `exercicio` nas Query Keys.
*   **E5 — Frontend Semântico:** Telas refatoradas para exibir `nome`.
*   **E6 — Novo Importador:** Script backend substituirá a tela `/base` do frontend para carga oficial.
*   **E7 — RLS Granular:** Privilégio mínimo no banco e no React Router.
*   **E8 — Logs Protegidos:** RLS restrito em `import_logs`.
*   **E9 — Schema Documental Mínimo:** Remoção dos mocks front-end.
*   **E10 — Testes PR 2:** Validações de integridade cruzada.

## Gates Obrigatórios
* **G1 — Governança**: Audit consolidado v2.2.1 (Concluído).
* **G2 — Supabase próprio**: Projeto criado; segredos protegidos; usuário admin criado.
* **G3 — Schema**: Migrations aplicadas respeitando E3 e E7-E9.
* **G4 — Importação**: Carga oficial via script respeitando E1 e E6.
* **G5 — Preview**: Vercel Preview validado no Dashboard, Escolas, Base.
* **G6 — Produção**: Deploy da Produção Vercel.

## Histórico de Execução
*   **PR 3B Concluído**: Frontend totalmente adaptado ao schema semântico v2.2.1.
*   **Importação Oficial**: O fluxo de importação pelo browser foi desativado operacionalmente; a importação oficial da BASE ocorre via `scripts/import_base_xlsx.py`.
*   **Limpeza de Resíduos**: Arquivos `baseImporter.ts` e `mockEscolas.ts` foram removidos em prol da arquitetura oficial.
*   **Próximo Macro Passo (PR 4)**: Configuração do Supabase remoto, db push, carga oficial, validação final e setup do Vercel Preview.
