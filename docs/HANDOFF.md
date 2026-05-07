# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-07

## Contexto atual

Este PR e documental/operacional. Ele cria a infraestrutura minima de continuidade agentic antes do proximo PR funcional de documentos.

Fonte de verdade: GitHub `main`, baseado em `89d2306`.

Branch deste PR: `ops/agentic-continuity-workflows`.

PR deste handoff: #42 - https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/pull/42

## PRs abertos no GitHub

| PR | Titulo | Branch | Estado |
|---:|---|---|---|
| #42 | ops(agentic): add Codex continuity and workflow infrastructure | `ops/agentic-continuity-workflows` | aberto, rebaseado apos #40/#41 |
| #41 | feat: dashboard B/C paths | `feat/dashboard-export-polish` | mergeado em `89d2306` |
| #40 | feat: integrate tech stack updates (preview) | `feat/tech-stack-integration` | mergeado em `502dbeb` |

## Norte operacional

O norte atual e o Plano Global v4.1 registrado em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`.

O backlog adaptativo em `docs/OPPORTUNITIES_BACKLOG.md` funciona como radar de oportunidades. Itens ali registrados nao autorizam execucao funcional sem PR proprio.

## Proximo sub-marco prioritario

Demonstrativo Basico Individual.

Proximo PR funcional recomendado:

```txt
feat(documentos): gerar Demonstrativo Basico individual via MEMORIA
```

Decisao tecnica vigente:

```txt
Opcao B: preencher a aba MEMORIA diretamente com dados do Supabase.
```

Restricoes da decisao:

- nao depender da aba BASE para o arquivo individual;
- nao depender de XLOOKUP para o arquivo individual;
- preservar layout, formulas, bordas e mesclagens do template oficial;
- manter revisao humana para regras documentais oficiais.

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

## Escopo negativo deste PR

Este PR nao deve alterar:

- `src/**`
- Supabase
- migrations
- `package.json`
- UI
- motor documental funcional
- templates oficiais
