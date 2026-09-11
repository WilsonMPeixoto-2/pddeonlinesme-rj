# Integração financeira PDDE 2026 — V1

**Atualizado em:** 11/09/2026 após consolidação do pipeline de publicação por dimensão (PR #129).

## Objetivo

Incorporar ao PDDE Online dados financeiros reais e estruturados das 163 unidades da 4ª CRE, preservando a hierarquia operacional de programas, ações, parcelas e contas bancárias.

A camada operacional da interface não deve expor metadados técnicos de coleta. Proveniência, workflow e artefatos ficam restritos à auditoria interna.

## Escopo recebido

Carga consolidada originalmente em 08/09/2026 a partir do snapshot publicado pelo projeto `pdde-repasse-conciliador`.

- 163 unidades escolares conciliadas por INEP: 163/163
- 335 contas bancárias
- 163 contas marcadas como principais para compatibilidade com estruturas legadas
- 537 registros de repasse/parcela
- 163 unidades com pelo menos um repasse
- 491 registros de repasse com conta explicitamente vinculada no dado de origem
- 169 registros com pagamento informado

## Contas por programa

| Programa | Contas | Unidades |
|---|---:|---:|
| PDDE Básico | 167 | 163 |
| PDDE Qualidade | 163 | 163 |
| PDDE Equidade | 5 | 5 |

A quantidade de contas do PDDE Básico é superior ao número de unidades porque algumas escolas possuem mais de uma conta desse programa. O modelo não deve assumir relação 1:1 entre escola e conta.

## Repasses por ação

| Programa | Ação | Registros | Programado | Pago informado |
|---|---|---:|---:|---:|
| PDDE Básico | PDDE Básico | 222 | R$ 1.265.170,00 | R$ 632.585,00 |
| PDDE Básico | PDDE Básico — Primeira Infância | 104 | R$ 265.260,00 | R$ 132.630,00 |
| PDDE Qualidade | Educação Conectada | 162 | R$ 523.672,00 | — |
| PDDE Qualidade | Escola das Adolescências | 6 | R$ 62.400,00 | R$ 62.400,00 |
| PDDE Qualidade | Escola e Comunidade | 43 | R$ 122.000,00 | — |

Totais do conjunto recebido:

- valor programado: **R$ 2.238.502,00**
- pagamento informado: **R$ 827.615,00**

Para o universo PDDE Básico / Primeira Infância das 163 unidades:

- 1ª parcela paga: **R$ 765.215,00**
- 2ª parcela programada: **R$ 765.215,00**
- 163/163 registros com ação, valor da 1ª parcela, data de pagamento e valor programado da 2ª parcela também refletidos em `execucao_financeira` para compatibilidade.

## Modelo de dados

### `contas_bancarias`

Passa a comportar:

- `programa`
- `exercicio`
- múltiplas contas por unidade/programa
- uma conta `principal` apenas como compatibilidade com telas e documentos legados

### `repasses_financeiros`

Contrato normalizado:

`unidade → exercício → programa → ação → parcela → valores → datas → conta vinculada`

Campos centrais:

- programa
- ação
- parcela
- valor programado
- valor pago
- custeio/capital programado quando disponível
- custeio/capital pago quando disponível
- data do pagamento
- data da ordem de pagamento
- conta bancária vinculada

### Semântica de ausência

Ausência de informação não é convertida em zero.

- `valor_pago = NULL`: pagamento não informado
- custeio/capital `NULL`: detalhamento não disponível na fonte estruturada
- `0,00`: somente quando o dado efetivamente informa zero

## Regra para a interface

Informações que devem aparecer na ficha da escola:

- PDDE Básico
- PDDE Qualidade
- PDDE Equidade quando aplicável
- ações vinculadas a cada programa
- conta(s) do programa
- valor da 1ª parcela
- data de pagamento
- valor programado da 2ª parcela
- custeio/capital apenas quando efetivamente conhecidos

Não devem aparecer na superfície operacional:

- workflow run
- artifact id
- hash
- parser
- nome técnico de dataset
- textos sobre metodologia de coleta
- explicações de proveniência

Esses elementos permanecem disponíveis exclusivamente na camada de auditoria.

## Integridade validada

- correspondência INEP: 163/163
- unidades sem conta principal: 0
- unidades com mais de uma conta principal: 0
- duplicidades de contas: 0
- duplicidades de repasses: 0
- repasses com conta órfã: 0
- valores negativos: 0
- importador temporário utilizado na carga inicial: neutralizado após a conclusão

## Estado pós-PR #129 — publicação por dimensão

A carga inicial deixou de ser o único mecanismo de proteção da integração. O PDDE Online passou a possuir contrato versionado de publicação por dimensão.

As cinco dimensões V1 estão atualmente `MATURE/PUBLISHED`, com cobertura 163/163:

1. `bank_accounts`;
2. `scheduled_repasses`;
3. `pdde_basic_first_installment`;
4. `pdde_basic_first_installment_breakdown`;
5. `pdde_basic_second_installment_programmed`.

A promoção de um snapshot ocorre por RPC transacional, que valida o universo das escolas, contas, repasses, vínculos e maturidade antes de substituir a projeção operacional.

### Invariantes do pipeline

- publicação atômica: falha bloqueante desfaz toda a transação;
- idempotência por workflow/artifact;
- execução mais antiga que a última publicação é rejeitada;
- dimensão já publicada não pode regredir abaixo do contrato mínimo;
- `NULL` continua sendo ausência;
- publicação exige `service_role` e não é exposta ao frontend.

Detalhes em `docs/technical/financial-publication-contract-v1.md`.

## Classificação de ações canônicas

O snapshot pode fornecer determinadas ações pelo nome isolado. O transformador reconhece explicitamente:

### PDDE Qualidade

- Educação Conectada
- Escola e Comunidade
- Escola das Adolescências
- Cantinho da Leitura

### PDDE Equidade

- PDDE SRM

Não existe fallback genérico para rótulo desconhecido.

## Relação com o Painel e Repasses

A interface não usa o total global de pagamentos como KPI principal quando esse total mistura universos com maturidade diferente.

O recorte institucional principal vigente é a **1ª parcela paga do PDDE Básico**, no mesmo universo de:

- valor;
- cobertura;
- data de pagamento;
- composição custeio/capital quando disponível.

A página `/repasses` e o Painel devem respeitar essa fronteira até que novas dimensões tenham contrato próprio de maturidade.

## Sincronização futura

Existe `.github/workflows/sync-financial-snapshot.yml` para validar e publicar snapshots maduros.

O agendamento só publica quando:

- `PDDE_FINANCIAL_SYNC_ENABLED=true`;
- `PDDE_SUPABASE_URL` e `PDDE_SUPABASE_SERVICE_ROLE_KEY` estão configurados no environment `production`.

Enquanto isso não ocorrer, a existência de `schedule` no workflow não significa sincronização automática ativa.

## Fora do escopo desta V1

Não são dados operacionais atuais, salvo futura decisão e contrato próprios:

- saldo atual
- movimentações posteriores à cobertura pública disponível
- localização de crédito como indicador completo
- aplicações/rendimentos sem cobertura madura
- reconciliação documento × débito bancário

Essas dimensões permanecem no motor financeiro até alcançarem cobertura e semântica adequadas para publicação operacional.

## Documentos relacionados

- `docs/technical/financial-publication-contract-v1.md`
- `docs/technical/repasses-operacionais-2026-v1.md`
- `docs/DECISIONS.md`
- `docs/README.md`
