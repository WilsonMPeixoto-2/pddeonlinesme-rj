# Contrato de publicação financeira por dimensão — V1

## Objetivo

Transformar o `pdde-repasse-conciliador` de fornecedor ocasional de snapshots em motor contínuo de dados do PDDE Online, sem permitir que uma dimensão tecnicamente válida, porém incompleta ou imatura, altere silenciosamente a experiência operacional.

A publicação separa duas decisões:

1. **qualidade técnica** da dimensão;
2. **estado de publicação** da dimensão.

A interface operacional continua consumindo apenas dados promovidos. Evidências, hashes, workflow IDs e detalhes de validação permanecem na camada interna de auditoria.

## Princípios

- ausência não vira zero;
- coleta nova não substitui retrato válido se houver regressão de cobertura;
- publicação é transacional e idempotente;
- uma falha em qualquer invariável bloqueia toda a promoção;
- dimensões novas podem ser coletadas e armazenadas no motor sem aparecer no PDDE Online;
- qualidade e publicação são estados diferentes;
- o contrato de maturidade é versionado e auditável;
- o frontend não chama o motor de coleta em tempo real;
- o Supabase permanece a fronteira operacional do PDDE Online.

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

## Automação

O PDDE Online possui um workflow próprio que:

1. lê o manifesto publicado pelo `pdde-repasse-conciliador`;
2. reidrata o snapshot `gzip-base64-parts`;
3. transforma o contrato humano do motor no payload normalizado do PDDE Online;
4. avalia localmente as dimensões para diagnóstico antecipado;
5. chama a RPC transacional com credencial de backend;
6. encerra sem alterações quando o workflow/artifact já foi publicado.

A execução é **diária e também manual**, com `concurrency` para impedir publicações concorrentes. O workflow opera somente no projeto Supabase `raluxyojqosfzrfozmpz` e exige segredo de backend próprio. A ausência desse segredo bloqueia a automação, sem recorrer a escrita com chave `anon` ou permissões ampliadas.

## Fronteira de responsabilidade

### `pdde-repasse-conciliador`

Coleta, evidência, normalização, conciliação e produção do snapshot validado.

### Pipeline do PDDE Online

Transformação para o contrato operacional, avaliação de maturidade, publicação transacional, proteção contra regressão e auditoria.

### Frontend PDDE Online

Consumo do contrato já promovido. Não decide maturidade e não exibe metadados técnicos na interface comum.
