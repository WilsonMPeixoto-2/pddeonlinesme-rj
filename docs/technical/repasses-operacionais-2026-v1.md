# Repasses Operacionais 2026 — V1

## Objetivo

Transformar os dados financeiros já confiáveis do PDDE 2026 em uma interface operacional clara para a GAD/4ª CRE, sem expor metadados técnicos de coleta e sem preencher lacunas com valores presumidos.

A V1 foi deliberadamente limitada a informações completas ou objetivamente disponíveis no banco. A interface não apresenta saldo atual, localização de crédito posterior ao limite conhecido da fonte ou qualquer valor inferido.

## Recorte institucional inicial

A página `/repasses` apresenta o recorte completo da **1ª parcela do PDDE Básico em 2026**, consolidando:

- `PDDE Básico` → `1ª Parcela`;
- `PDDE Básico — Primeira Infância` → `P1`.

No snapshot publicado utilizado pela integração, esse recorte cobre as **163 unidades escolares** e totaliza **R$ 765.215,00 pagos**.

A tela calcula, a partir dos registros carregados:

- total pago;
- quantidade de unidades;
- média e mediana;
- distribuição por ação;
- distribuição por faixa de valor;
- evolução acumulada pelas datas de pagamento informadas.

Os gráficos funcionam também como filtros da relação de escolas. A lista filtrada pode ser exportada em CSV e cada unidade conduz à sua visão detalhada de recursos.

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

Visão transversal dos pagamentos da primeira parcela:

- KPIs;
- filtros por ação, faixa e data;
- busca por unidade/INEP;
- tabela operacional com TanStack Table;
- barras proporcionais de valor;
- exportação CSV;
- navegação para o detalhe da unidade.

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
