# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-11

## Contexto atual

Fonte de verdade: GitHub `main`, atualmente em `a1d04a971f265b9c9e525628b85e16dcd2c092f2`.

PRs #40 até #51 foram incorporados a `main`. Nao ha PRs abertos no momento.

## PR #43 — Demonstrativo Basico Individual (mergeado)

```txt
#43 - https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/pull/43
Merge commit: 4d97a9cba09fcfe155402f4c6b6679087fc3d19e
Merged at: 2026-05-11T01:37:40Z
Merged by: WilsonMPeixoto-2 (admin bypass)
```

### Fixes de UI integration entregues no commit final

1. **Tabela /escolas (Escolas.tsx):** `motion.tr` com `row-accent` causava desalinhamento de colunas apos interacao com Framer Motion. Fix: substituido por `TableRow` nativo + `table-fixed` + `colgroup` com larguras percentuais.

2. **DocumentsPanel (EscolaEditar.tsx):** painel exibia cards mock hardcoded em vez de conectar ao gerador real. Fix: integrado com `useUnidadeDetalhe` + `generateDemonstrativoBasico` + `file-saver saveAs`.

### Validacoes em producao

Smoke autenticado executado localmente por agente, com validacao operacional de rotas autenticadas em producao apos o merge. Este smoke nao possui artefato versionado no repositorio (script/log/screenshot); trata-se de validacao operacional reportada na sessao.

## PRs recentes

| PR | Titulo | Branch | Estado |
|---:|---|---|---|
| #51 | test(documents): cover DocumentsPanel error and placeholder flows | `test/documents-panel-coverage` | mergeado em `a1d04a9` |
| #50 | chore(cleanup): remove unused lovable-tagger residue | `chore/remove-lovable-tagger` | mergeado em `41e7cc4` |
| #49 | chore(deps): standardize on npm lockfile | `chore/single-lockfile` | mergeado em `308fade` |
| #48 | ci: add minimal pull request validation workflow | `ci/minimal-pr-validation` | mergeado em `8ec8b39` |
| #47 | docs(readme): replace Lovable placeholder with project overview | `docs/readme-real` | mergeado em `6739dd6` |
| #46 | docs(governance): realign AGENTS with source-of-truth protocol | `docs/agents-source-of-truth` | mergeado em `a34c3d0` |
| #45 | docs(state): reconcile continuity after PR 43 merge | `docs/state-reconcile-after-pr43` | mergeado em `88238ce` |
| #43 | feat(documentos): generate Demonstrativo Basico from school detail | `feat/demonstrativo-basico-individual` | mergeado em `4d97a9c` |
| #44 | Feat/dashboard real vw dashboard basico | `feat/dashboard-real-vw-dashboard-basico` | mergeado em `9c47ed9` |
| #42 | ops(agentic): add Codex continuity and workflow infrastructure | `ops/agentic-continuity-workflows` | mergeado em `d7061ed` |
| #41 | feat: dashboard B/C paths | `feat/dashboard-export-polish` | mergeado em `89d2306` |
| #40 | feat: integrate tech stack updates (preview) | `feat/tech-stack-integration` | mergeado em `502dbeb` |

## Norte operacional

O norte atual e o Plano Global v4.1 registrado em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`.

O backlog adaptativo em `docs/OPPORTUNITIES_BACKLOG.md` funciona como radar de oportunidades. Itens ali registrados nao autorizam execucao funcional sem PR proprio.

## Sub-marco entregue: Demonstrativo Basico Individual

Decisao tecnica vigente:

```txt
Opcao B: preencher a aba MEMORIA diretamente com dados do Supabase.
```

Status: **concluido e implantado em producao**.

URL de producao: https://pddeonlinesme-rj.vercel.app

Restricoes da decisao (permanecem vigentes para futuras alteracoes):

- nao depender da aba `BASE` para o arquivo individual;
- nao depender de `XLOOKUP` para o arquivo individual;
- nao publicar template com dados reais consolidados de unidades em `public/`;
- remover a aba `BASE` do workbook em memoria antes de salvar o arquivo final, se ela existir;
- preservar layout, formulas, bordas e mesclagens do template;
- manter revisao humana para regras documentais oficiais.

## Proximas frentes recomendadas

1. **Fase 2B - Edição cadastral mínima** — implementar fluxo auditável e restrito para edição de dados bancários e cadastrais, substituindo inputs diretos por requisição de alteração ou roles específicas.

*(A fila de higiene técnica/infraestrutura inicial foi concluída nos PRs #46 ao #51)*

## Riscos operacionais conhecidos

- **Rotacao de senha Supabase:** a senha do Supabase `pdde-online-2026-dev` deve ser rotacionada periodicamente. Atualmente nao ha automacao para isso.
- **Continuity drift:** documentos em `.continuity/` e `docs/` podem divergir de `main` se nao forem reconciliados apos cada merge. A fonte de verdade e sempre o codigo no GitHub.

## Implementacao entregue

Arquivos criados/alterados pelo PR #43:

- `public/templates/demonstrativo-basico-4cre-template.xlsx`
- `src/lib/demonstrativo/templateCells.ts`
- `src/lib/demonstrativo/mapUnidadeToMemoria.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.test.ts`
- `src/pages/EscolaEditar.tsx`
- `src/pages/Escolas.tsx`
- `src/components/escola/DocumentsPanel.tsx`
- `package.json`
- `package-lock.json`

Decisao tecnica de dependencia:

- `exceljs` foi adicionado porque a dependencia `xlsx` existente nao preserva com confianca estilos, bordas e mesclagens do template.
- `exceljs` e carregado por `dynamic import()` apenas durante a geracao do arquivo.

## Regras antes de qualquer tarefa

Ler:

1. `AGENTS.md`
2. `.continuity/current-state.json`
3. `docs/HANDOFF.md`
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`
7. `docs/PROJECT_STATE.md`
8. `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`

## Regras depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`
2. `.continuity/session-log.jsonl`
3. `docs/HANDOFF.md`

Se houver nova decisao ou mudanca de prioridade, atualizar tambem `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
