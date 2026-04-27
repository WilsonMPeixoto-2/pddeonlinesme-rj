# Plano de Migração Supabase Próprio v2.2

## Sumário
Correção Semântica da BASE e Adaptação Controlada do Frontend (PDDE Online 2026)

## Decisão-mãe do plano
A migração para o Supabase próprio não replicará a confusão semântica produzida no protótipo Lovable. A BASE oficial define a semântica: DESIGNAÇÃO será preservada como designacao (código), NOME será preservado como nome. O frontend será adaptado de forma controlada para consumir essa semântica correta.

*(Ver detalhes da modelagem e regras nos documentos irmãos na pasta docs/: `DATA_SEMANTIC_CONTRACT.md`, `SCHEMA_MAPPING.md`, `LOVABLE_EXPANDED_BACKEND_AUDIT.md` e `DECISIONS_LOG.md`)*

## Gates Obrigatórios
* **G1 — Governança**: Claude Code formalizado; .env saneado; Lovable auditado; contratos aprovados.
* **G2 — Supabase próprio**: Projeto criado; segredos protegidos; usuário admin criado; Auth/Roles aplicados.
* **G3 — Schema**: Migrations aplicadas; RLS validada; views criadas; types regenerados.
* **G4 — Importação**: BASE importada; designacao e nome preservados; relatório gerado.
* **G5 — Preview**: Vercel Preview validado no Dashboard, Escolas, Base.
* **G6 — Produção**: Deploy da Produção Vercel.
