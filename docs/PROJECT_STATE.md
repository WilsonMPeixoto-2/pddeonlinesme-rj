# Estado do Projeto (PROJECT_STATE)
Data de atualização: 27 de abril de 2026

**Versão Atual (Congelada):** `v0.1.1-lovable-expanded-prototype`
**Versão Alvo:** `v2.2` (PDDE Online Migração Supabase)

## Fases do Plano v2.2
- [x] **PR 1**: Governança, auditoria Lovable, contrato semântico e schema mapping (Concluído agora).
- [x] **PR 2**: Supabase próprio, migrations, RLS e importação controlada. Validado localmente via Docker Desktop + Supabase CLI em `feature/pr3a-supabase-types-local-validation`, sem `db push` remoto.
- [ ] **PR 3**: Frontend adaptado, Preview e cutover controlado.
  - [x] **PR 3A**: Banco local recriado, migrations aplicadas, `types.ts` regenerado e gates `npx tsc --noEmit` + `npm run build` aprovados.
  - [x] **PR 3B**: Adaptação das telas para o schema Supabase semântico.
- [ ] **PR 4**: Configuração do Supabase remoto, db push remoto, carga oficial e cutover para Preview Vercel. Supabase remoto e Produção permanecem intactos até G6.

O projeto encontra-se em trânsito de uma base gerada automaticamente por ferramentas de prototipação para uma arquitetura governamental baseada em engenharia de dados real e segura.
