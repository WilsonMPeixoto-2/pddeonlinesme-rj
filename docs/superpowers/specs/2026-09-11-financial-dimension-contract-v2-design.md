# Financial Dimension Contract V2 — Design

## Objetivo

Reduzir a duplicação de critérios quantitativos do gate financeiro e preparar o PDDE Online para receber dimensões opcionais parciais sem bloquear a atualização das cinco dimensões V1 maduras.

A V2 **não publica saldo, aplicações ou movimentos ainda**. Ela prepara o contrato para que uma dimensão futura, por exemplo `bank_balance_positions` com cobertura 37/163, possa ser registrada como observação em formação sem contaminar ou impedir a publicação do núcleo financeiro já confiável.

## Princípio arquitetural

A solução é híbrida:

- o banco é fonte efetiva para configuração do contrato: versão, cobertura esperada, razão mínima, habilitação e obrigatoriedade para publicação do núcleo;
- código/SQL versionados continuam responsáveis por invariantes semânticas e financeiras;
- JSONB não decide sozinho que uma dimensão financeira é semanticamente válida;
- dimensões sem validador semântico de servidor podem ser armazenadas como `COLLECTING`, nunca promovidas automaticamente a `MATURE/PUBLISHED`.

Isso elimina duplicação de números/thresholds sem transformar regra financeira em configuração opaca.

## Extensão de `financial_dimension_contracts`

Adicionar:

- `required_for_core_publication boolean NOT NULL DEFAULT false`;
- `validator_key text NOT NULL` com valor não vazio.

Os cinco contratos V1 passam a ser `required_for_core_publication=true` e recebem validadores explícitos:

- `bank_accounts_v1`;
- `scheduled_repasses_v1`;
- `pdde_basic_first_installment_v1`;
- `pdde_basic_first_installment_breakdown_v1`;
- `pdde_basic_second_installment_programmed_v1`.

Uma dimensão opcional inicial de preparação é registrada como:

- `dimension_key = bank_balance_positions`;
- `required_for_core_publication = false`;
- `validator_key = pending`;
- `coverage_expected = 163`;
- `coverage_required_ratio = 1`;
- `enabled = true`.

O contrato existir não torna a dimensão publicável. `pending` significa explicitamente que não há validador semântico server-side habilitado para promoção.

## Fonte efetiva do threshold

O número `163` continua sendo uma invariável institucional do universo de escolas para o snapshot 2026, mas não deve ser repetido como threshold de maturidade de cada dimensão.

A publicação passa a ler de `financial_dimension_contracts`:

- `coverage_expected`;
- `coverage_required_ratio`;
- `required_for_core_publication`;
- `validator_key`;
- `enabled`.

A identidade do snapshot continua exigindo exatamente 163 INEPs únicos porque essa é uma invariável do pacote 4ª CRE 2026, não uma configuração de dimensão.

## Validação JavaScript

`evaluatePublicationDimensions(payload, contracts)` passa a receber contratos explicitamente.

Para cada contrato com `validator_key` conhecido, o código usa o validador semântico correspondente e calcula:

- `coverageObserved`;
- `coverageExpected` vindo do contrato;
- `coverageRatio`;
- `qualityStatus` com base no threshold do contrato e na validade semântica;
- datas de referência quando aplicável.

O script de sincronização obtém os contratos vigentes do Supabase usando a credencial de backend já confinada ao workflow do PDDE Online.

Não existe fallback silencioso para 163 se o contrato estiver ausente. Falta ou inconsistência de contrato obrigatório deve bloquear a publicação.

## Validação SQL

A RPC permanece autoridade final da escrita.

Ela continua recalculando os cinco validadores semânticos V1 a partir do payload real, mas consulta os contratos para determinar cobertura esperada e threshold de maturidade.

Para cada dimensão obrigatória:

- contrato deve existir, estar `enabled` e `required_for_core_publication=true`;
- `validator_key` deve ser o esperado pelo código SQL V1;
- cobertura observada / cobertura esperada deve atingir `coverage_required_ratio`;
- invariantes semânticas continuam sendo verificadas pelo SQL.

Só depois disso a projeção operacional de contas/repasses pode ser substituída.

## Dimensões opcionais observadas

O payload pode carregar `observedDimensions`, separado das cinco dimensões derivadas do núcleo.

Forma mínima:

```json
[
  {
    "dimensionKey": "bank_balance_positions",
    "coverageObserved": 37,
    "referenceDateMin": "2026-08-01",
    "referenceDateMax": "2026-08-31"
  }
]
```

A RPC aceita uma observação opcional somente quando:

- existe contrato habilitado para a mesma dimensão/exercício;
- `required_for_core_publication=false`;
- não há duplicidade da dimensão no payload;
- cobertura é inteiro não negativo e não excede `coverage_expected`;
- datas, quando presentes, são válidas e ordenadas.

Enquanto `validator_key='pending'`, o status gravado é obrigatoriamente:

- `quality_status='COLLECTING'`;
- `publication_status='UNPUBLISHED'`.

A observação opcional não participa do gate dos cinco contratos obrigatórios e não pode retirar/substituir o último retrato publicado do núcleo.

## Publicação e histórico

Na publicação de um novo núcleo válido:

- somente os status atualmente `PUBLISHED` das dimensões obrigatórias que serão substituídas são marcados `WITHDRAWN`;
- status opcionais `UNPUBLISHED` anteriores permanecem históricos e não precisam ser retirados;
- os cinco contratos obrigatórios recebem novo status `MATURE/PUBLISHED`;
- observações opcionais do payload recebem novo status `COLLECTING/UNPUBLISHED`.

A unicidade existente `(dimension_key, integration_run_id)` continua suficiente para impedir duplicação dentro da mesma execução.

## Idempotência

Uma execução já conhecida continua idempotente se:

- run/artifact são os mesmos;
- digest é o mesmo;
- os cinco contratos obrigatórios da execução já estão `MATURE/PUBLISHED`.

A contagem deixa de ser hardcoded em `= 5`; a RPC determina quantos contratos obrigatórios habilitados existem para o exercício.

Dimensões opcionais não mudam a decisão de idempotência do núcleo.

## Segurança

- tabelas e RPCs permanecem sem acesso para `anon` e `authenticated`;
- leitura do contrato para o worker é exclusiva de `service_role`;
- frontend comum não recebe requirements/validator keys;
- nenhuma dimensão opcional vira operacional só porque chegou no payload;
- falha de contrato obrigatório aborta a transação inteira.

## Migração

A mudança será entregue em migration nova, sem editar a migration V1 já aplicada.

Ela deve:

1. evoluir `financial_dimension_contracts`;
2. atualizar os cinco contratos existentes;
3. semear `bank_balance_positions` como opcional/pending;
4. criar RPC de leitura de contratos para backend;
5. substituir `publish_financial_snapshot_v1` mantendo a assinatura externa;
6. preservar permissões `service_role`;
7. adicionar testes pgTAP para threshold configurável, dimensão opcional parcial e idempotência dinâmica.

A assinatura pública da RPC é preservada para evitar criar dois caminhos de publicação concorrentes.

## Critérios de aceite

- alterar `coverage_expected`/`coverage_required_ratio` em contrato de teste muda a decisão de maturidade sem editar JS/SQL quantitativo;
- os cinco contratos obrigatórios continuam 163/163 e publicados no cenário atual;
- payload com `bank_balance_positions=37` publica normalmente o núcleo e grava saldo como `COLLECTING/UNPUBLISHED`;
- dimensão opcional não pode ficar `PUBLISHED` enquanto seu validator é `pending`;
- ausência/desabilitação de contrato obrigatório bloqueia publicação;
- idempotência conta contratos obrigatórios habilitados, não literal `5`;
- nenhuma permissão nova é concedida a `anon`/`authenticated`;
- replay completo das migrations e pgTAP ficam verdes.
