# Codex Skills Locais

Este diretorio guarda skills locais pequenas e versionadas para o PDDE Online 2026.

Use estas skills junto com `AGENTS.md`, `.continuity/` e os workflows em `.codex/workflows/`.

Regras:

- Skills registram processo, nao autorizam mudanca funcional por si so.
- Mudancas em codigo, Supabase, migrations, UI, templates oficiais ou regras financeiras exigem PR proprio.
- Depois de usar uma skill em tarefa operacionalmente relevante, atualizar `.continuity/current-state.json`, `.continuity/session-log.jsonl` e `docs/HANDOFF.md` apenas quando houver mudanca real de estado, escopo, prioridade, decisao, risco ou informacao necessaria para a proxima tarefa.
- Nao abrir PR exclusivamente documental por drift pequeno de SHA ou metadado historico sem impacto operacional.

