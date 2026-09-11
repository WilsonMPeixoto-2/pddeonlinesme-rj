# Event-driven Financial Ingestion V1 Implementation Plan

**Goal:** Receber snapshots financeiros publicados pelo motor por evento autenticado, mantendo o cron do PDDE Online como fallback e o Supabase service-role confinado ao repositório do PDDE Online.

**Architecture:** O motor publica um snapshot validado e emite um `repository_dispatch`. O PDDE Online recebe o evento, compara a proveniência informada com o manifesto público, executa dry-run/maturidade e chama a RPC somente com credenciais do environment `production`. Schedule e evento compartilham um kill-switch; execução manual permanece disponível para homologação.

**Spec:** `docs/superpowers/specs/2026-09-11-event-driven-financial-ingestion-v1-design.md`

## Restrições globais

- Não enviar `PDDE_SUPABASE_SERVICE_ROLE_KEY` ao conciliador.
- Não aceitar evento como prova suficiente: confrontar manifesto público.
- Manter idempotência e proteção contra regressão da RPC V1.
- Ausência de secrets bloqueia antes da publicação.
- `workflow_dispatch` continua disponível mesmo com kill-switch desligado.

## Task 1 — Contrato por testes

- [x] Exigir `repository_dispatch` no workflow.
- [x] Exigir kill-switch nas entradas automáticas.
- [x] Exigir propagação de proveniência do evento.
- [x] Exigir fallback às 13:30 UTC.
- [x] Exigir rejeição de proveniência divergente no script.

## Task 2 — Receiver

- [x] Adicionar evento `financial-snapshot-published-v1`.
- [x] Transportar sourceRepository/workflowRunId/artifactId/artifactName/publishedAt.
- [x] Aplicar `PDDE_FINANCIAL_SYNC_ENABLED` a evento e schedule.
- [x] Manter execução manual fora do kill-switch automático.
- [x] Reposicionar cron como fallback posterior à coleta.

## Task 3 — Validação do manifesto

- [x] Validar repositório de origem esperado.
- [x] Validar workflow run, artifact id, artifact name e publishedAt quando informados.
- [x] Executar validação antes da construção/publicação do payload.

## Task 4 — Governança e verificação

- [ ] Atualizar decisões, handoff e estado operacional.
- [ ] Executar CI completo da PR.
- [ ] Confirmar diff restrito ao receiver, testes e documentação.
- [ ] Integrar somente após HEAD final verde.
