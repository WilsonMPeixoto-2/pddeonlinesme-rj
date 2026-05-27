# Roadmap Adaptativo - PDDE Online 2026

Atualizado em: 2026-05-11

## Norte

O Plano Global v4.1, em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`, e o norte operacional atual.

Este roadmap adaptativo nao substitui o plano. Ele organiza a fila curta e registra ajustes pragmaticos entre PRs pequenos.

## Estado atual

- Supabase Foundation v1 encerrada como migracao fundacional.
- `main` em `4d97a9c` e a fonte oficial de continuidade.
- Telas principais de escolas usam views reais do Supabase proprio (`vw_unidades_localizador`, `vw_unidade_detalhe`).
- Dashboard real consome `vw_dashboard_basico`.
- Demonstrativo Basico Individual entregue em producao via PR #43.
- Producao em `https://pddeonlinesme-rj.vercel.app` operacional; bundle pos-deploy do PR #43 e `/assets/index-DKPVI_j8.js`.
- Smoke autenticado via Playwright contra producao passou 6/6 em 2026-05-11.
- Branches remotas: apenas `main` (PR #43 source e branch orfa anterior foram deletadas).

## Fila curta recomendada

1. `docs/state-reconcile-after-pr43` — reconcilia `.continuity`, `HANDOFF`, `DECISIONS`, `ROADMAP` (este arquivo), `OPPORTUNITIES_BACKLOG` e `UI_CHANGELOG` com o estado pos-merge. Escopo estrito: apenas documentacao operacional. Este e o PR atual.

2. `docs/readme-real` — substitui o README placeholder do Lovable por um README institucional/tecnico real:
   - stack (Vite + React 18 + shadcn/ui + Tailwind + TanStack Query 5 + Supabase JS 2 + Zod 4);
   - como rodar (`npm i`, `npm run dev`, `.env.example`);
   - referencias ao Supabase proprio (`raluxyojqosfzrfozmpz`);
   - URL de producao;
   - links para `AGENTS.md` e docs operacionais.

3. `docs/agents-md-realign` — atualiza `AGENTS.md` para refletir o modelo de ferramentas atual: Claude Code + Codex + Copilot + Antigravity + revisao humana, sem Cursor como ferramenta obrigatoria.

4. `ci/minimal-checks` — cria `.github/workflows/ci.yml` com `npm ci && npx tsc --noEmit && npm run lint && npm test && npm run build`; adiciona como `required_status_check` no Ruleset "Protect main".

5. `chore/single-lockfile` — decide gerenciador unico (`bun.lock` + `bun.lockb` + `package-lock.json` coexistem; confirmar o usado pela Vercel build e remover os duplicados).

6. `chore/drop-lovable-tagger` — remove `lovable-tagger` de devDependencies apos confirmar que nao e usado em `vite.config.ts`.

## Frentes funcionais maiores (apos higiene)

Pelo Plano Global v4.1:

- **Marco 6B** — Auth/roles/RLS final (gate antes do Portal do Diretor).
- **Marco 10B** — Importador institucional via UI + Edge Function (mitiga `xlsx` HIGH severity ao mover parsing para servidor).
- **Marco 11+12 (cheio)** — outros 5 documentos oficiais: Relacao de Bens Adquiridos, Termo de Doacao, Consolidacao de Pesquisas de Precos, Ata do Conselho Escolar, Parecer do Conselho Fiscal.
- **Marco 13** — Portal do Diretor (depende do Marco 6B).
- **Marco 14** — Hardening pre-producao (a11y, perf bundle, logs, observabilidade).

## Melhorias acessorias identificadas mas nao bloqueadoras

- Ampliar cobertura de teste do `DocumentsPanel.test.tsx` para casos de erro (`!unidadeId`, `isLoading`, `error`, `!unidade`, `rejection` do gerador, clique em "em-breve").
- Responsividade mobile da tabela `/escolas` em telas muito estreitas (diferente do bug de alinhamento, ja resolvido).
- Rotacionar senha do operador `wilsonmp2@gmail.com` antes de divulgacao do link de producao.
- Deletar manualmente a pasta fisica `pddeonlinesme-rj-demonstrativo` no `scratch` quando os file locks soltarem (git worktree ja prunada).

## Regra de uso

Cada item funcional deve virar PR pequeno e proprio. Mudancas de codigo, Supabase, migrations, UI, regras financeiras ou documentos oficiais nao devem ser acopladas a PRs de governanca.

PRs de governanca (como o atual `docs/state-reconcile-after-pr43`) nao podem alterar `src/**`, `supabase/**`, `public/**`, `package.json`, `package-lock.json`, lockfiles, `README.md`, `AGENTS.md` ou CI; cada um desses fica em PR proprio.
