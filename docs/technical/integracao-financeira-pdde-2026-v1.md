# Integração financeira PDDE 2026 — V1

## Objetivo

Incorporar ao PDDE Online dados financeiros reais e estruturados das 163 unidades da 4ª CRE, preservando a hierarquia operacional de programas, ações, parcelas e contas bancárias.

A camada operacional da interface não deve exibir metadados técnicos de coleta. Proveniência, workflow e artefatos ficam restritos à auditoria interna.

## Escopo recebido

Carga consolidada em 08/09/2026 a partir do snapshot publicado pelo projeto `pdde-repasse-conciliador`.

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

Novo contrato normalizado:

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
- importador temporário utilizado na carga: neutralizado após a conclusão

## Fora do escopo desta V1

Não foram incorporados como dados operacionais atuais:

- saldo atual
- movimentações posteriores à cobertura pública disponível
- localização de crédito como indicador completo
- reconciliação documento x débito bancário

Essas dimensões permanecem no motor financeiro até alcançarem cobertura e semântica adequadas para publicação operacional.
