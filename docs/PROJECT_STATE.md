# Estado do Projeto (PROJECT_STATE)
Data de atualização: 27 de abril de 2026

**Versão Atual (Congelada):** `v0.1.1-lovable-expanded-prototype`
**Versão Alvo:** `v2.2` (PDDE Online Migração Supabase)

## Fases do Plano v2.2
- [x] **PR 1**: Governança, auditoria Lovable, contrato semântico e schema mapping (Concluído agora).
- [x] **PR 2**: Supabase próprio, migrations, RLS e importação controlada. Validado localmente via Docker Desktop + Supabase CLI em `feature/pr3a-supabase-types-local-validation`, sem `db push` remoto.
- [ ] **PR 3**: Frontend adaptado, Preview e cutover controlado.
  - [x] **PR 3A**: Banco local recriado, migrations aplicadas, `types.ts` regenerado e gates `npx tsc --noEmit` + `npm run build` aprovados.
  - [ ] **PR 3B**: Adaptação das telas para o schema Supabase semântico.

O projeto encontra-se em trânsito de uma base gerada automaticamente por ferramentas de prototipação para uma arquitetura governamental baseada em engenharia de dados real e segura.

### Nota de escopo — validação local x ambiente remoto

O PR 2 e o PR 3A validaram o schema em ambiente local com Docker Desktop e Supabase CLI. As migrations foram aplicadas localmente com sucesso por `supabase db reset --local`, e o `types.ts` foi regenerado a partir do schema local.

Até este ponto, não houve `supabase db push` para o Supabase próprio remoto, nem cutover de variáveis da Vercel para o novo backend. Portanto, qualquer Preview da Vercel deve ser interpretado apenas como validação de frontend/build, não como validação plena do sistema conectado ao Supabase próprio.
