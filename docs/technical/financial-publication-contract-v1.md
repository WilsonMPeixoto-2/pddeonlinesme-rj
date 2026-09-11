# Contrato de publicação financeira por dimensão — V1

## Objetivo

Transformar o `pdde-repasse-conciliador` de fornecedor ocasional de snapshots em motor de dados do PDDE Online, sem permitir que uma dimensão tecnicamente válida, porém incompleta ou imatura, altere silenciosamente a experiência operacional.

A publicação separa duas decisões:

1. **qualidade técnica** da dimensão;
2. **estado de publicação** da dimensão.

A interface operacional consome apenas dados promovidos. Evidências, hashes, workflow IDs e detalhes de validação permanecem na camada interna de auditoria.

## Princípios

- ausência não vira zero;
- coleta nova não substitui retrato válido se houver regressão de cobertura;
- publicação é transacional e idempotente;
- uma falha em qualquer invariável bloqueia toda a promoção;
- dimensões novas podem ser coletadas e armazenadas no motor sem aparecer no PDDE Online;
- qualidade e publicação são estados diferentes;
- o contrato de maturidade é versionado e auditável;
- o frontend não chama o motor de coleta em tempo real;
- o Supabase permanece a fronteira operacional do PDDE Online;
- o `service_role` do PDDE Online não cruza para o motor externo.

## Estados

### `quality_status`

- `COLLECTING`: dimensão ainda em formação;
- `VALIDATED`: estrutura e invariantes técnicas passaram, mas o critério de maturidade não foi alcançado;
- `MATURE`: critérios técnicos e de cobertura foram alcançados;
- `REJECTED`: falha técnica ou regressão bloqueante.

### `publication_status`

- `UNPUBLISHED`: não promovida para consumo operacional;
- `PUBLISHED`: disponível ao contrato operacional;
- `WITHDRAWN`: removida da publicação por decisão controlada.

Uma dimensão pode estar `MATURE` e ainda `UNPUBLISHED`.

## Dimensões iniciais da V1

O ciclo inicial formaliza somente fatos que o PDDE Online já utiliza em produção:

| Chave | Escopo esperado | Critério mínimo de maturidade |
|---|---:|---|
| `bank_accounts` | 163 escolas | ao menos uma conta com banco, agência e conta válidos por escola |
| `scheduled_repasses` | 163 escolas | ao menos um repasse programado válido por escola |
| `pdde_basic_first_installment` | 163 escolas | pagamento da 1ª parcela/P1 identificado, com data |
| `pdde_basic_first_installment_breakdown` | 163 escolas | 1ª parcela/P1 com custeio e capital conhecidos e soma consistente |
| `pdde_basic_second_installment_programmed` | 163 escolas | 2ª parcela/P2 programada no universo PDDE Básico/Primeira Infância |

Novas dimensões como saldo, movimentos bancários, crédito localizado e conciliação documento × débito não entram neste contrato até terem regra de maturidade própria.

## Persistência

### `financial_dimension_contracts`

Guarda o contrato versionado de cada dimensão:

- `dimension_key`;
- `exercise`;
- `contract_version`;
- `coverage_expected`;
- `coverage_required_ratio`;
- `requirements` em JSONB;
- `enabled`;
- timestamps.

### `financial_dimension_status`

Registra o resultado de cada dimensão por execução:

- `dimension_key`;
- `exercise`;
- `integration_run_id`;
- `coverage_observed`;
- `coverage_expected`;
- `coverage_ratio`;
- `reference_date_min`;
- `reference_date_max`;
- `quality_status`;
- `publication_status`;
- `source_snapshot_digest`;
- `validated_at`;
- `published_at`;
- `withdrawn_at`.

## Publicação transacional

A publicação controlada recebe um payload normalizado do snapshot do motor e executa em uma única transação:

1. valida metadados da fonte;
2. valida 163 INEPs e correspondência com `unidades_escolares`;
3. valida duplicidades, valores e identidade bancária;
4. valida vínculos de conta;
5. calcula a maturidade das cinco dimensões V1;
6. bloqueia regressão em dimensão atualmente `PUBLISHED`;
7. registra `integracoes_financeiras_runs`;
8. substitui a projeção operacional de contas/repasses;
9. grava `financial_dimension_status`;
10. publica somente após todas as invariáveis passarem.

Como a chamada é uma função PostgreSQL única, qualquer exceção desfaz a operação inteira.

## Idempotência e regressão

- mesma combinação `workflow_run_id + artifact_id` retorna a execução já conhecida e não duplica dados;
- execução com `workflow_run_id` menor que a última publicação é rejeitada;
- uma dimensão atualmente `PUBLISHED` não pode cair abaixo do `coverage_required_ratio` sem mecanismo explícito de retirada/override, que fica fora da V1;
- zero é valor somente quando veio explicitamente da fonte; `NULL` continua representando ausência de informação.

## Taxonomia de programas e ações

O transformador aceita os nomes canônicos que o motor publica, inclusive ações que podem chegar sem prefixo do programa:

- `Educação Conectada`, `Escola e Comunidade`, `Escola das Adolescências` e `Cantinho da Leitura` → PDDE Qualidade;
- `PDDE SRM` → PDDE Equidade.

Essa classificação usa allowlist explícita. Rótulo desconhecido não é aceito por fallback genérico.

## Workflow de sincronização

O PDDE Online possui `.github/workflows/sync-financial-snapshot.yml`, que pode:

1. receber um evento de snapshot publicado pelo `pdde-repasse-conciliador`, uma execução manual ou o fallback agendado;
2. ler o manifesto publicado pelo motor;
3. quando houver evento, confrontar `sourceRepository`, `workflowRunId`, `artifactId`, `artifactName` e `publishedAt` com o manifesto;
4. reidratar o snapshot `gzip-base64-parts`;
5. transformar o contrato humano do motor no payload normalizado do PDDE Online;
6. avaliar localmente as dimensões para diagnóstico antecipado;
7. validar que o destino é `https://raluxyojqosfzrfozmpz.supabase.co`;
8. chamar a RPC transacional com credencial de backend;
9. encerrar de forma idempotente quando workflow/artifact já foi publicado.

### Gatilhos V1

- `workflow_dispatch`: homologação/execução humana controlada;
- `repository_dispatch` do tipo `financial-snapshot-published-v1`: caminho automático primário após publicação do motor;
- `schedule` diário às `13:30 UTC` (`10:30 America/Sao_Paulo`): reconciliação/fallback.

O evento não substitui a validação do manifesto. Payload de dispatch divergente é bloqueado antes da chamada ao Supabase.

### Kill-switch operacional

O job automático exige:

```text
vars.PDDE_FINANCIAL_SYNC_ENABLED == 'true'
```

A regra aplica-se tanto a `repository_dispatch` quanto a `schedule`. `workflow_dispatch` permanece disponível para homologação com o kill-switch desligado.

O environment `production` precisa fornecer:

- `PDDE_SUPABASE_URL`;
- `PDDE_SUPABASE_SERVICE_ROLE_KEY`.

Ausência ou destino incorreto bloqueia a execução antes da publicação. Não existe fallback para chave `anon` nem autorização para ampliar permissões a fim de contornar secret ausente.

### Procedimento de ativação

1. configurar os dois secrets no environment `production`;
2. manter `PDDE_FINANCIAL_SYNC_ENABLED` desabilitado/ausente;
3. executar `workflow_dispatch` controlado;
4. validar dry-run, primeira publicação e repetição idempotente;
5. validar invariantes do banco;
6. somente depois definir `PDDE_FINANCIAL_SYNC_ENABLED=true`;
7. habilitar no motor o emissor de `repository_dispatch` com token dedicado de menor privilégio.

## Estado validado da V1

No fechamento do ciclo #129:

- 163 escolas;
- 335 contas;
- 537 repasses;
- cinco dimensões `MATURE/PUBLISHED` com cobertura 163/163;
- RPC provada com primeira execução `published` e segunda `idempotent` em transação de teste com `ROLLBACK`;
- execução da função restrita ao `service_role`;
- replay completo das migrations e testes de contrato incorporados ao CI.

## Fronteira de responsabilidade

### `pdde-repasse-conciliador`

Coleta, evidência, normalização, conciliação e produção do snapshot validado. Pode notificar que um novo snapshot foi publicado, mas não recebe credencial de banco do PDDE Online e não executa sua RPC.

### Pipeline do PDDE Online

Validação de proveniência do evento/manifesto, transformação para o contrato operacional, avaliação de maturidade, publicação transacional, proteção contra regressão e auditoria.

### Frontend PDDE Online

Consumo do contrato já promovido. Não decide maturidade e não exibe metadados técnicos na interface comum.

## Documentos relacionados

- `docs/technical/integracao-financeira-pdde-2026-v1.md`;
- `docs/technical/repasses-operacionais-2026-v1.md`;
- `docs/DECISIONS.md`;
- `docs/README.md`;
- `docs/superpowers/specs/2026-09-11-event-driven-financial-ingestion-v1-design.md`.
