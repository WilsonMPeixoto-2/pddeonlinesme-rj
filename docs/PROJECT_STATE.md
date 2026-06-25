# Estado do Projeto — PDDE Online 2026

**Atualizado em:** 25/06/2026

## Fonte de verdade

A fonte oficial é o GitHub `main`, complementado pelos testes e deployments efetivamente verificados. Clones locais, relatórios e handoffs são snapshots auxiliares.

## Estado técnico atual

Main verificada:

- commit `e7cb4952479d6af62e49784e2c544632d2396864`;
- PR #95 — handoff documental para continuidade no Codex.

Último marco técnico de código:

- commit `93ed0419c8b861e83eb9c564d726c86ec550cfa3`;
- PR #94 — modernização React/Oxc/Rolldown;
- CI aprovado.

## Marcos recentes

| PR | Entrega | Merge |
|---:|---|---|
| #90 | Restauração do gate permanente de lint, typecheck, testes e build | `da109185` |
| #92 | Atualização segura de dependências e lockfile reproduzível | `1399a691` |
| #94 | Migração do plugin React para o stack padrão do Vite e code splitting do Rolldown | `93ed0419` |

## Dependências e segurança

O PR #92 atualizou pacotes patch/minor e executou correções seguras do npm audit.

Resultado:

- estado inicial: 5 achados — 1 low, 2 moderate e 2 high;
- estado posterior: 2 moderate, 0 low, 0 high e 0 critical;
- risco residual: cadeia `exceljs → uuid`;
- não aplicar `npm audit fix --force`, pois a correção sugerida rebaixa o ExcelJS.

Referência: `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.

A avaliação `types-node-26-evaluation` alinhou o projeto ao runtime Node 24.x: `@types/node` `^24.13.2`, `engines.node` `24.x` e CI em Node 24. Referência: `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

## Build atual

O PR #94:

- substituiu `@vitejs/plugin-react-swc` por `@vitejs/plugin-react`;
- alinhou Vite e Vitest;
- manteve React Compiler desabilitado;
- migrou `manualChunks` para `rolldownOptions.codeSplitting.groups`;
- explicitou `react-is` e `@testing-library/dom`;
- manteve override restrito de `@rolldown/plugin-babel` em `0.1.7` para compatibilidade com Workbox/Babel 7.

Não remover esse override sem reproduzir e resolver a instalação limpa.

## Estado da produção

Projeto Vercel principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_4M1tQA1JdVNnBYmjjUNXZP3eeBrx`;
- commit `1399a691d622715a787ea1d9b720ff9992d9f679`;
- estado `READY`.

A `main` está à frente da produção. O commit `93ed0419` foi validado por CI e Preview independente, mas o projeto principal não confirmou deployment desse SHA por limite temporário de frequência de builds.

## Funcionalidades já presentes

Entre as frentes entregues e verificáveis no repositório estão:

- Painel Executivo-Operacional;
- cadastro, consulta e edição controlada de unidades;
- geração individual e em lote do Demonstrativo Básico;
- histórico de gerações;
- atualização parcial assistida da BASE;
- gestão inicial de papéis;
- Portal do Diretor em evolução;
- Relação de Bens Adquiridos;
- frente fiscal funcional em estágio de endurecimento.

## Próxima ação funcional

Após mergear a frente de dependências/tipos Node, corrigir em PR isolado a veracidade institucional do `SecurityCenterPanel`, que ainda apresenta simulações de segurança com aparência de controles reais.

## Leitura para continuidade

- `AGENTS.md`;
- `docs/PLANO_GLOBAL_V4_2.md`;
- `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
- `.continuity/current-state.json`;
- `docs/HANDOFF.md`;
- `docs/CODEX_HANDOFF_2026-06-25.md`.
