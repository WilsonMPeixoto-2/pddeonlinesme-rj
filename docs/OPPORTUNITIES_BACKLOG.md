# Backlog Adaptativo de Oportunidades - PDDE Online 2026

Atualizado em: 2026-05-11

Este backlog e um radar. Ele registra oportunidades, riscos e proximas frentes, mas nao autoriza execucao sem PR proprio.

| Prioridade | Item | Tipo | Status | Observacao |
|---:|---|---|---|---|
| - | Demonstrativo Basico Individual via `MEMORIA` | documentos | concluido | Entregue pelo PR #43 (merge `4d97a9c`, 2026-05-11). Validado em producao via Playwright smoke autenticado. Painel `DocumentsPanel` e botao individual em `/escolas/:id` ambos chamam o gerador real. |
| - | PRs #40 e #41 | governanca GitHub | incorporado | Ambos ja foram mergeados na `main`. |
| - | Fechamento de PRs historicos superados | governanca GitHub | concluido | Branches remotas antigas foram deletadas; apenas `main` permanece no remoto. |
| 1 | Reconciliacao documental pos-PR #43 | governanca | em curso | `docs/state-reconcile-after-pr43` (este PR) atualiza `.continuity`, `HANDOFF`, `DECISIONS`, `ROADMAP`, este `BACKLOG` e `UI_CHANGELOG`. |
| 2 | README real | documentacao | pendente | Substituir placeholder Lovable por README institucional/tecnico com stack, setup, envs, deploy URL e links. PR proprio: `docs/readme-real`. |
| 3 | AGENTS.md realign | governanca | pendente | Documento atual descreve modelo Cursor/Codex que nao corresponde a pratica (Claude Code + Codex + Copilot + Antigravity). PR proprio: `docs/agents-md-realign`. |
| 4 | CI minimo no GitHub Actions | qualidade | pendente | Adicionar `.github/workflows/ci.yml` com `tsc + lint + test + build`; marcar como `required_status_check` no Ruleset. PR proprio: `ci/minimal-checks`. |
| 5 | Lockfile unico | dependencias | pendente | `bun.lock` (205 KB) + `bun.lockb` (245 KB) + `package-lock.json` (356 KB) coexistem. Decidir gerenciador unico apos confirmar o usado pela Vercel build. PR proprio: `chore/single-lockfile`. |
| 6 | Remover `lovable-tagger` | dependencias | pendente | Verificar se `lovable-tagger` ainda e usado em `vite.config.ts` (provavelmente apenas em `mode === 'development'`); se nao, remover de devDependencies. PR proprio: `chore/drop-lovable-tagger`. |
| 7 | Ampliar cobertura do `DocumentsPanel.test.tsx` | qualidade | pendente | Teste atual cobre apenas happy path. Adicionar casos: `!unidadeId`, `isLoadingDetalhe`, `detalheError`, `!unidadeDetalhe`, rejection de `generateDemonstrativoBasico`, clique em documento "em-breve". |
| 8 | Marco 9B — Dashboard real (analitico) | produto/dados | concluido (parcial) | Marco 9B basico entregue pelos PRs #37 e #41 (vw_dashboard_basico). Refinamento analitico futuro fica como subprioridade. |
| 9 | Fase 2B edicao cadastral/bancaria | dados/UI | pendente | Exige contrato, permissao, auditoria e validacao. Pertence ao Marco 9C/10. |
| 10 | Importador institucional via interface | dados/documentos | pendente | Marco 10B. Considerar Edge Function para mitigar `xlsx` HIGH severity. |
| 11 | Auth/roles/guards/RLS final | seguranca | pendente | Marco 6B. Revisao humana obrigatoria. Gate antes do Portal do Diretor. |
| 12 | Portal do Diretor | produto/seguranca | pendente | Marco 13. Depende de vinculo diretor-escola e escopo de acesso. |
| 13 | Motor documental v1 (outros 5 documentos) | documentos | pendente | Marco 11+12 cheio. Relacao de Bens, Termo de Doacao, Consolidacao de Precos, Ata, Parecer. |
| 14 | Hardening pre-producao | qualidade/seguranca | continuo | Marco 14. Bundle splitting, smoke automatizado, a11y, logs, observabilidade. |
| 15 | Rotacionar senha do operador DEV | seguranca operacional | pendente | `wilsonmp2@gmail.com` esta documentada e foi usada em smoke. Rotacionar antes de qualquer divulgacao do link de producao. |
| 16 | Deletar dir fisico `pddeonlinesme-rj-demonstrativo` no scratch | local | pendente | Git worktree ja prunada. File lock impediu remocao automatica. Deletar manualmente quando locks soltarem. |

## Como promover um item

Para promover um item a PR:

1. Confirmar o marco do Plano Global v4.1.
2. Definir ferramenta lider.
3. Definir arquivos permitidos e proibidos.
4. Registrar criterio de aceite.
5. Registrar validacoes tecnicas.
6. Atualizar `docs/HANDOFF.md` ao final.

## Lessons learned recentes

- **Documentacao operacional precisa de PR de reconciliacao pos-merge**: o PR #43 mergeou em 2026-05-11 mas deixou `.continuity/current-state.json` e `docs/HANDOFF.md` apontando para o estado pre-merge (PR #43 como "open", `base_commit` antigo). Considerar hook `post-merge` ou GitHub Action que falhe se `base_commit` divergir do HEAD.
- **Codigo passar em `tsc + test + lint + build` nao garante UX correta**: o PR #43 passou em todos os checks tecnicos com `DocumentsPanel` ainda mockado e tabela com regressao visual. Apenas o smoke autenticado em browser revelou ambos os bugs. Validacao final humana ou via Playwright headless e gate informal essencial.
- **Comentarios de review (Copilot/humano) ficam permanentes no PR mesmo apos correcao**: ao auditar um PR aberto, ler o blob atual da branch via `gh api ...?ref=<head>`, nao tratar `gh api .../pulls/N/comments` como pendencias vivas.
