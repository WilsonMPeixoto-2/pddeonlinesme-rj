---
name: pdde-continuity
description: Use para iniciar ou encerrar tarefas no PDDE Online 2026 com leitura e atualizacao de continuidade operacional.
---

# PDDE Continuity

## Antes de agir

1. Leia `AGENTS.md`.
2. Leia `.continuity/current-state.json`.
3. Leia `docs/HANDOFF.md`.
4. Leia `docs/DECISIONS.md`.
5. Leia `docs/ROADMAP_ADAPTIVE.md`.
6. Leia `docs/OPPORTUNITIES_BACKLOG.md`.
7. Confirme arquivos permitidos e proibidos.

## Depois de agir

Depois de agir, avalie se houve mudanca operacional relevante.

Atualize `.continuity/current-state.json`, `.continuity/session-log.jsonl` e `docs/HANDOFF.md` apenas quando a tarefa alterar estado, escopo, prioridade, decisao, risco, marco atual ou informacao necessaria para a proxima retomada.

Atualize `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` ou `docs/OPPORTUNITIES_BACKLOG.md` somente quando houver mudanca real de rumo, prioridade, criterio de aceite ou alocacao no Plano Global.

Nao abrir PR exclusivamente documental por drift pequeno de SHA ou metadado historico sem impacto operacional.

