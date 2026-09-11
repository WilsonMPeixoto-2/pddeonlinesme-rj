# Event-driven Financial Ingestion V1 — Design

## Objetivo

Transformar a ingestão financeira do PDDE Online em uma cadeia orientada a evento, sem entregar credenciais do Supabase ao `pdde-repasse-conciliador` e preservando o agendamento diário do PDDE Online apenas como fallback.

## Princípio de confiança

A fronteira permanece:

```text
pdde-repasse-conciliador
  coleta -> valida -> publica snapshot
                |
                | evento autenticado de snapshot publicado
                v
PDDE Online
  valida proveniência -> avalia maturidade -> publica no Supabase
```

O conciliador nunca recebe `PDDE_SUPABASE_SERVICE_ROLE_KEY` e nunca chama a RPC de publicação do PDDE Online.

## Gatilhos do PDDE Online

`.github/workflows/sync-financial-snapshot.yml` terá três entradas:

1. `workflow_dispatch`: execução humana controlada;
2. `repository_dispatch` do tipo `financial-snapshot-published-v1`: caminho primário orientado a evento;
3. `schedule`: reconciliação/fallback.

Execuções automáticas (`repository_dispatch` e `schedule`) só podem publicar quando `vars.PDDE_FINANCIAL_SYNC_ENABLED == 'true'`. O disparo manual permanece disponível para homologação mesmo com o kill-switch desligado.

## Proveniência do evento

O evento deve informar:

- `sourceRepository = WilsonMPeixoto-2/pdde-repasse-conciliador`;
- `workflowRunId`;
- `artifactId`;
- `artifactName = sigef-full-163-2026`;
- `publishedAt`.

O PDDE Online não confia nesses valores isoladamente. Após obter o manifesto público, compara os valores esperados do evento com o manifesto antes de avaliar/publicar o payload.

## Idempotência

A mesma proveniência pode chegar por evento e depois novamente pelo fallback. A RPC V1 já trata a repetição de `workflow_run_id + artifact_id` como idempotente. Portanto o fallback pode permanecer ativo sem criar duplicação.

## Kill-switch

Uma única variável operacional controla toda ingestão automática:

`PDDE_FINANCIAL_SYNC_ENABLED=true`

Sem ela:

- `repository_dispatch` é recebido, mas o job não executa publicação;
- `schedule` é recebido, mas o job não executa publicação;
- `workflow_dispatch` continua disponível para homologação manual.

## Agenda de fallback

O Full 163 mais recente observado levou aproximadamente 44 minutos. O fallback do PDDE Online deve ocorrer com várias horas de margem em relação ao agendamento futuro do motor para evitar sobreposição desnecessária.

V1 adotará fallback diário às `13:30 UTC` (`10:30 America/Sao_Paulo`).

## Credenciais

PDDE Online, environment `production`:

- `PDDE_SUPABASE_URL`;
- `PDDE_SUPABASE_SERVICE_ROLE_KEY`.

Motor/conciliador, futuramente:

- token dedicado de dispatch para o repositório PDDE Online, com menor privilégio possível.

Nenhuma dessas credenciais é versionada.

## Critérios de aceite

- receiver aceita `repository_dispatch` apenas do contrato esperado;
- proveniência do evento divergir do manifesto bloqueia publicação;
- evento/schedule respeitam o mesmo kill-switch;
- manual continua disponível;
- fallback permanece idempotente;
- nenhum segredo do Supabase cruza para o conciliador;
- testes unitários e CI completo permanecem verdes.
