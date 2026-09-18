# Repasses Operacionais 2026 — V1

## Objetivo

Transformar os dados financeiros já confiáveis do PDDE 2026 em uma interface operacional clara para a GAD/4ª CRE, sem expor metadados técnicos de coleta e sem preencher lacunas com valores presumidos.

A V1 foi deliberadamente limitada a informações completas ou objetivamente disponíveis no banco. A interface não apresenta saldo atual, localização de crédito posterior ao limite conhecido da fonte ou qualquer valor inferido.

## Recortes operacionais publicados

A página `/repasses` mantém dois recortes explicitamente separados.

### 1ª parcela paga

O recorte principal consolida:

- `PDDE Básico` → `1ª Parcela`;
- `PDDE Básico — Primeira Infância` → `P1`.

No snapshot publicado utilizado pela integração, esse recorte cobre as **163 unidades escolares** e totaliza **R$ 765.215,00 pagos**.

A tela calcula total pago, quantidade de unidades, média, mediana, distribuição por ação, distribuição por faixa de valor e evolução acumulada pelas datas de pagamento informadas. Os gráficos também funcionam como filtros da relação de escolas.

### 2º ciclo / ordens

O recorte `/repasses?ciclo=2` publica somente unidades para as quais existe valor informado no 2º ciclo do PDDE Básico. A visão apresenta:

- unidade escolar e INEP;
- ação;
- situação semântica;
- data da ordem de pagamento;
- data de pagamento, quando existir;
- custeio;
- capital;
- total informado;
- busca, filtro, ordenação e exportação CSV.

A presença de `valor_pago` como fallback de evidência externa não autoriza o rótulo **Pagamento identificado**. Esse estado exige `data_pagamento`. Na ausência dessa data, a interface usa **Ordem emitida** quando existe `data_ordem_pagamento`, ou **Pagamento informado** quando há valor sem data de ordem.

Cada unidade conduz à visão detalhada de recursos e o retorno preserva o recorte do segundo ciclo.

## Hierarquia operacional

A ficha financeira da escola segue a hierarquia:

```text
UNIDADE ESCOLAR
├─ PDDE BÁSICO
│  ├─ conta(s)
│  ├─ PDDE Básico
│  │  ├─ 1ª parcela
│  │  └─ 2ª parcela
│  └─ PDDE Básico — Primeira Infância
│     ├─ P1
│     └─ P2
├─ PDDE QUALIDADE
│  ├─ conta(s)
│  ├─ Educação Conectada
│  ├─ Escola e Comunidade
│  └─ Escola das Adolescências
└─ PDDE EQUIDADE
   └─ conta(s)/ações quando aplicável
```

Uma escola pode possuir mais de uma conta dentro do mesmo programa. A interface lista todas as contas encontradas e não reduz o programa a uma conta singular.

## Regra de precisão

A camada `src/lib/financeiroPDDE.ts` preserva a distinção entre ausência de informação e zero conhecido.

- `null` significa informação não disponível no recorte atual;
- `0` só pode representar zero quando a fonte realmente o informar;
- a interface apresenta ausência como `—`;
- custeio e capital só são exibidos quando o respectivo componente está disponível;
- programa com conta válida continua visível mesmo sem repasse associado no recorte.

Essa regra é essencial para impedir que lacunas de fonte sejam convertidas em informação financeira falsa.

## Componentes

### `src/pages/Repasses.tsx`

Entrada única para os recortes de repasses. Preserva a visão madura da 1ª parcela e seleciona o drill-down do segundo ciclo por parâmetro de URL.

### `src/components/SegundaParcelaRepassesView.tsx`

Drill-down operacional do segundo ciclo com KPIs, composição custeio/capital, busca, filtros de situação, ordenação, exportação e tabela nominal das unidades.

### `src/components/SegundaParcelaResumo.tsx`

Resumo do segundo ciclo no Painel, com total, composição, data da ordem e prévia nominal que conduz ao conjunto completo.

### `src/components/RecursosPDDEPanel.tsx`

Componente reutilizável de leitura por programa, contas, ações e parcelas. Mantém os nomes oficiais operacionais em primeiro plano e não exibe workflow IDs, hashes, parser, artefato ou demais informações de proveniência técnica.

### `src/pages/EscolaEditarComRecursos.tsx`

Mantém a ficha cadastral existente e adiciona acesso rápido a `Recursos PDDE` em painel lateral, evitando duplicação do fluxo cadastral legado.

### `src/pages/EscolaRecursos.tsx`

Visão dedicada e expansível de recursos da unidade em `/escolas/:id/recursos`.

## Dados e consultas

A interface lê exclusivamente:

- `contas_bancarias`;
- `vw_repasses_financeiros_unidade`.

As consultas são tipadas e centralizadas em `src/lib/queryKeys.ts`. Contas e repasses da unidade são buscados em paralelo e agrupados no frontend por programa e ação.

Os dados importados permanecem somente leitura para a interface autenticada. Escritas financeiras devem ocorrer por fluxo controlado de integração, não por edição direta na ficha escolar.

## Identidade visual

A V1 preserva o design system existente do PDDE Online e usa distinção semântica discreta:

- PDDE Básico: cor primária;
- PDDE Qualidade: cor de sucesso;
- PDDE Equidade: cor de atenção.

A cor é apoio visual, não o único meio de identificação: todos os programas e ações permanecem nomeados por texto.

## Evolução prevista

Novos recortes podem ser publicados na interface quando a fonte possuir cobertura completa e semântica validada. O contrato atual não autoriza inferir saldo corrente, data de crédito bancário ausente ou composição custeio/capital desconhecida.
