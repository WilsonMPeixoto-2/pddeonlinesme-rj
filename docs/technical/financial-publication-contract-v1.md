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
- dimensões novas só entram na superfície operacional depois de contrato explícito de maturidade;
- qualidade e publicação são estados diferentes;
- o contrato de maturidade é versionado e auditável;
- o frontend não dispara a coleta do motor, mas pode ler o **snapshot validado e publicado** como referência corrente;
- o Supabase permanece a camada relacional, histórica e auditável, sem funcionar como gargalo capaz de congelar silenciosamente a informação corrente;
- atraso de persistência não vira zero e deve ser sinalizado na interface;
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

## Matriz de fontes oficiais — setembro/2026

A consolidação financeira não trata uma única plataforma como fonte universal. Cada fato deve conservar a proveniência adequada:

| Fato | Fonte primária | Fonte complementar | Regra |
|---|---|---|---|
| programação, destinação, custeio/capital e ordem de pagamento | PDDE Info — Situação de Atendimento / exportação oficial | Consulta por Escola | o arquivo estruturado oficial é preferido ao HTML |
| identidade da escola e UEx, cadastro e situação institucional | PDDE Info | cadastro mestre SME | divergência de identidade bloqueia promoção |
| pagamento informado pelo FNDE | PDDE Info + evidência temporal de Liberações quando disponível | SIGEF Liberações | pagamento oficial não depende de extrato bancário atualizado |
| OB, data de liberação e conta de destino | SIGEF Liberações | PDDE Info | é evidência independente de liberação, não de crédito bancário |
| conta, posição de saldo e situação de abertura | PDDE Info — Saldo/Abertura de Conta + SIGEF | snapshot anterior validado | ausência de posição atual não vira saldo zero |
| crédito efetivamente localizado e movimentos | extrato/movimentação SIGEF | outras fontes bancárias oficiais permitidas | somente movimento compatível confirma crédito bancário |

Desde a versão pública **PDDE Info 18.09.2026#83f77b**, o motor deve preferir a exportação oficial estruturada de Situação de Atendimento, aceitar o layout GOV.BR em cards como fallback e manter compatibilidade controlada com o HTML legado. Mudança de versão ou de contrato de fonte deve ser tratada como evento de integração e revalidada contra a carteira real de 163 unidades.

## Dimensões iniciais da V1

O ciclo inicial formaliza somente fatos que o PDDE Online já utiliza em produção:

| Chave | Escopo esperado | Critério mínimo de maturidade |
|---|---:|---|
| `bank_accounts` | 163 escolas | ao menos uma conta com banco, agência e conta válidos por escola |
| `scheduled_repasses` | 163 escolas | ao menos um repasse programado válido por escola |
| `pdde_basic_first_installment` | 163 escolas | pagamento da 1ª parcela/P1 identificado, com data |
| `pdde_basic_first_installment_breakdown` | 163 escolas | 1ª parcela/P1 com custeio e capital conhecidos e soma consistente |
| `pdde_basic_second_installment_programmed` | 163 escolas | 2ª parcela/P2 programada no universo PDDE Básico/Primeira Infância |
| `pdde_basic_second_installment_payment_informed` | 163 escolas | valor de pagamento informado no 2º ciclo para as 163 unidades, preservando ordem e crédito bancário como evidências distintas |

Crédito bancário independentemente localizado, saldo, movimentos e conciliação documento × débito permanecem dimensões distintas e só podem ser promovidos quando tiverem regra própria de maturidade.

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
5. calcula a maturidade das dimensões financeiras, inclusive o pagamento informado do 2º ciclo;
6. bloqueia regressão em dimensão atualmente `PUBLISHED`;
7. registra `integracoes_financeiras_runs`;
8. substitui a projeção operacional de contas/repasses;
9. grava `financial_dimension_status`;
10. executa **read-after-write** na mesma view consumida pelo frontend;
11. considera a sincronização concluída somente se proveniência, escolas, valores e datas coincidirem semanticamente com o snapshot.

Como a chamada é uma função PostgreSQL única, qualquer exceção desfaz a operação inteira.

### Evidência automática de ordem de pagamento

A PR #174 adicionou a RPC `publish_financial_snapshot_with_order_evidence_v1(jsonb)`, que executa na mesma transação:

1. a publicação do snapshot financeiro V1;
2. a materialização de ordens de pagamento validadas pelo motor em `repasse_evidencias_financeiras`.

São candidatas somente linhas com `paymentOrderDate` conhecida e `paymentDate` ausente. A evidência preserva valor, custeio, capital e data da ordem, mas mantém `data_pagamento = NULL` e não transforma `valor_pago` canônico em pagamento observado.

A sincronização é idempotente; divergência contra evidência já preservada bloqueia a transação em vez de sobrescrever o fato silenciosamente.

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
9. reler `vw_repasses_financeiros_unidade` e a última execução persistida;
10. falhar explicitamente se o estado operacional não reproduzir o snapshot;
11. encerrar de forma idempotente quando workflow/artifact já foi publicado e comprovado.

### Gatilhos V1

- `workflow_dispatch`: homologação/execução humana controlada;
- `repository_dispatch` do tipo `financial-snapshot-published-v1`: caminho automático primário após publicação do motor;
- `schedule` diário às `13:30 UTC` (`10:30 America/Sao_Paulo`): reconciliação/fallback.

O evento não substitui a validação do manifesto. Payload de dispatch divergente é bloqueado antes da chamada ao Supabase.

### Kill-switch operacional

Desde a PR #174, execuções automáticas são elegíveis por padrão:

```text
vars.PDDE_FINANCIAL_SYNC_ENABLED != 'false'
```

A regra aplica-se a `repository_dispatch` e `schedule`. Definir explicitamente `PDDE_FINANCIAL_SYNC_ENABLED=false` interrompe esses disparos; ausência da variável não os desativa. `workflow_dispatch` permanece disponível para execução humana controlada.

O environment `production` continua precisando fornecer:

- `PDDE_SUPABASE_URL`;
- `PDDE_SUPABASE_SERVICE_ROLE_KEY`.

Ausência ou destino incorreto bloqueia a execução antes da publicação. Não existe fallback para chave `anon` nem autorização para ampliar permissões a fim de contornar secret ausente.

### Verificação operacional

A configuração do workflow não é prova de publicação. Para declarar uma sincronização automática concluída, verificar conjuntamente:

1. workflow disparado e concluído sem falha;
2. proveniência `workflow_run_id + artifact_id`;
3. nova linha/idempotência em `integracoes_financeiras_runs`;
4. contagens e dimensões promovidas;
5. evidências de ordem materializadas sem inventar crédito bancário;
6. **read-after-write** da `vw_repasses_financeiros_unidade` coincidente com o snapshot;
7. disponibilidade dos mesmos fatos na interface, que revalida as consultas financeiras a cada 5 minutos e ao recuperar foco.

A meta operacional é de **até 15 minutos** entre a publicação do snapshot validado e a persistência reconciliada. Enquanto a persistência estiver atrasada, o snapshot validado continua sendo usado para os fatos correntes de 2026 e o layout exibe o incidente de frescor.

Na reconciliação de 18/09/2026, o código de automação já estava ativo por padrão, porém o último `publicado_em` observado no Supabase ainda era de 09/09/2026. Portanto, a primeira publicação pós-PR #174 permanecia pendente de comprovação.

## Estado validado da V1

No fechamento do ciclo #129:

- 163 escolas;
- 335 contas;
- 537 repasses;
- seis dimensões financeiras contratadas, incluindo `pdde_basic_second_installment_payment_informed`;
- estado corrente do 2º ciclo: **163/163 unidades** e **R$ 765.215,00** com pagamento informado pelo FNDE; crédito bancário independente permanece evidência separada;
- RPC provada com primeira execução `published` e segunda `idempotent` em transação de teste com `ROLLBACK`;
- execução da função restrita ao `service_role`;
- replay completo das migrations e testes de contrato incorporados ao CI.

## Fronteira de responsabilidade

### `pdde-repasse-conciliador`

Coleta, evidência, normalização, conciliação e produção do snapshot validado. Pode notificar que um novo snapshot foi publicado, mas não recebe credencial de banco do PDDE Online e não executa sua RPC.

### Pipeline do PDDE Online

Validação de proveniência do evento/manifesto, transformação para o contrato operacional, avaliação de maturidade, publicação transacional, proteção contra regressão e auditoria.

### Frontend PDDE Online

Consome a projeção persistida e reconcilia os fatos correntes de 2026 com o snapshot validado publicado pelo motor. Não decide maturidade, não possui credenciais administrativas e não dispara coleta. Quando Supabase e motor divergem, a informação validada do motor prevalece temporariamente para monitoramento e a diferença de frescor fica visível até a persistência convergir.

## Documentos relacionados

- `docs/technical/integracao-financeira-pdde-2026-v1.md`;
- `docs/technical/repasses-operacionais-2026-v1.md`;
- `docs/DECISIONS.md`;
- `docs/README.md`;
- `docs/superpowers/specs/2026-09-11-event-driven-financial-ingestion-v1-design.md`.
