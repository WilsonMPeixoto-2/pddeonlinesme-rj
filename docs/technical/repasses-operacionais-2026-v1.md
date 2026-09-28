# Repasses Operacionais 2026 — contrato corrente

**Atualizado em:** 28/09/2026

## Objetivo

Transformar os dados financeiros confiáveis do PDDE 2026 em uma interface operacional clara para a GAD/4ª CRE, preservando a distinção entre **repasse oficial**, **posição bancária** e **conciliação**.

A superfície de Repasses prioriza fatos oficiais completos para o universo apresentado. Ausência de saldo/extrato contemporâneo não invalida pagamento oficial do FNDE e não é convertida em pendência fictícia.

## Visões operacionais publicadas

A página `/repasses` possui três visões articuladas.

### Visão anual — entrada padrão

A rota `/repasses` consolida os pagamentos oficiais dos dois ciclos de repasses do PDDE Básico:

- 1º ciclo: `PDDE Básico → 1ª Parcela` + `Primeira Infância → P1`;
- 2º ciclo: `PDDE Básico → 2ª Parcela` + `Primeira Infância → P2`.

Regra de inclusão: `valor_pago IS NOT NULL` e `data_pagamento IS NOT NULL`.

No estado verificado em 28/09/2026:

- 1º ciclo de repasses: **163 unidades / R$ 765.215,00**;
- 2º ciclo de repasses: **163 unidades / R$ 765.215,00**;
- total anual do PDDE Básico: **R$ 1.530.430,00**;
- 163/163 unidades possuem pagamentos oficiais nos dois ciclos.

A visão anual apresenta:

- total anual e composição 1º ciclo + 2º ciclo;
- cobertura dos dois ciclos;
- média, mediana, menor e maior total por unidade;
- distribuição por faixas de valor;
- linha do tempo dos pagamentos oficiais;
- filtros cruzados entre faixa, data e tabela;
- busca, ordenação e exportação do recorte;
- tabela por escola com 1º ciclo, 2º ciclo e total anual;
- drill-down para a ficha da unidade preservando filtros na URL.

### 1º ciclo de repasses

A rota `/repasses?ciclo=1` consolida:

- `PDDE Básico → 1ª Parcela`;
- `PDDE Básico — Primeira Infância → P1`.

Mantém análises por ação, faixa de valor e data, com gráficos/filtros ligados à relação nominal das escolas.

### 2º ciclo de repasses

A rota `/repasses?ciclo=2` consolida:

- `PDDE Básico → 2ª Parcela`;
- `PDDE Básico — Primeira Infância → P2`.

A visão apresenta unidade, INEP, ação, situação semântica, ordem, pagamento, custeio, capital, total, busca, filtros, ordenação e exportação.

O rótulo de pagamento exige `data_pagamento`. Ordem sem data de pagamento permanece **Ordem emitida** e não entra nos totais anuais recebidos.

## Linha do tempo

A camada `src/lib/financeiroPDDE.ts` agrupa os pagamentos oficiais por:

`ciclo de repasses + data_pagamento`

Cada evento contém:

- ciclo;
- data;
- quantidade de unidades;
- total financeiro;
- IDs das unidades do evento.

A Visão anual usa esses IDs para filtrar a tabela. O filtro temporal é representado na URL por `dataAnual` e sobrevive ao drill-down/retorno.

No dataset verificado em 28/09/2026, os marcos são:

- 30/04 — 1º ciclo — 57 unidades — R$ 261.455,00;
- 22/05 — 1º ciclo — 33 unidades — R$ 85.155,00;
- 08/07 — 1º ciclo — 1 unidade — R$ 2.015,00;
- 05/08 — 1º ciclo — 72 unidades — R$ 416.590,00;
- 15/09 — 2º ciclo — 52 unidades — R$ 132.630,00;
- 17/09 — 2º ciclo — 111 unidades — R$ 632.585,00.

## Ficha financeira da unidade

`/escolas/:id/recursos` mostra no topo do conteúdo financeiro:

- total de repasses do PDDE Básico no exercício;
- valor do 1º ciclo;
- valor do 2º ciclo;
- participação proporcional de cada ciclo;
- datas dos pagamentos oficiais;
- linha temporal compacta 1º → 2º ciclo.

Abaixo permanecem programa, ação, parcela e contas vinculadas.

## Hierarquia operacional

```text
UNIDADE ESCOLAR
├─ PDDE BÁSICO
│  ├─ visão anual
│  │  ├─ 1º ciclo de repasses
│  │  └─ 2º ciclo de repasses
│  ├─ conta(s)
│  ├─ PDDE Básico
│  │  ├─ 1ª parcela
│  │  └─ 2ª parcela
│  └─ PDDE Básico — Primeira Infância
│     ├─ P1
│     └─ P2
├─ PDDE QUALIDADE
└─ PDDE EQUIDADE
```

Uma escola pode possuir mais de uma conta dentro do mesmo programa.

## Semântica financeira

### Repasse oficial

Um registro compõe totais de repasse quando há:

- `valor_pago`;
- `data_pagamento`;
- ação/parcela pertencente ao ciclo do PDDE Básico.

Crédito bancário localizado não é pré-condição.

### Camada bancária

Saldo, extrato e crédito individual são dimensões independentes.

- ausência de extrato contemporâneo não significa divergência;
- crédito localizado pode ser exibido como evidência positiva;
- divergência só pode ser criada quando a fonte bancária cobre temporalmente a data esperada e ainda assim a correspondência não é localizada;
- saldo não deve ser usado por diferença para “provar” um crédito individual.

## Regra de precisão

- `null` significa informação não disponível;
- zero só significa zero quando a fonte o informa;
- ordem sem pagamento não entra no total recebido;
- nenhum ciclo parcial pode ser apresentado como total anual completo;
- filtros e drill-down devem preservar o recorte do usuário.

## Componentes principais

- `src/components/PDDEBasicoVisaoAnual.tsx`: visão anual, distribuição, timeline, filtros cruzados, tabela e exportação;
- `src/pages/Repasses.tsx`: roteamento entre visão anual, 1º ciclo e 2º ciclo;
- `src/components/SegundaParcelaRepassesView.tsx`: detalhe operacional do 2º ciclo;
- `src/components/PDDEBasicoAnualUnidadeResumo.tsx`: total anual e timeline compacta da unidade;
- `src/pages/EscolaRecursos.tsx`: ficha financeira da unidade;
- `src/components/RecursosPDDEPanel.tsx`: programa/ação/parcela/conta;
- `src/lib/financeiroPDDE.ts`: regras de consolidação e semântica.

## Dados e consultas

A interface continua somente leitura e usa as consultas tipadas centralizadas em `src/lib/queryKeys.ts`.

Escritas financeiras permanecem restritas ao fluxo controlado de integração. Proveniência técnica, workflow IDs, hashes e artefatos continuam fora da superfície operacional cotidiana.

## Identidade visual

A evolução analítica segue o design system existente. O princípio não é copiar visualmente o Power BI, mas incorporar:

- hierarquia forte;
- indicadores acionáveis;
- filtros cruzados;
- gráficos que levam a registros;
- drill-down preservando contexto;
- cores com função semântica;
- baixa poluição visual.

Nenhum gráfico ou KPI deve existir apenas como decoração.
