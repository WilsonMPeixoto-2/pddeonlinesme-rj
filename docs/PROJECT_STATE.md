# Estado do Projeto — PDDE Online 2026

**Atualizado em:** 25/06/2026

## Fonte de verdade

A fonte oficial é o GitHub `main`, complementado pelos testes e deployments efetivamente verificados. Clones locais, relatórios e handoffs são snapshots auxiliares.

## Estado técnico atual

Main verificada:

- commit `dffdc25b1dde210e3a712d4d84723b81cd525938`;
- PR #96 — alinhamento de tipos Node e runtime para Node 24.
- CI aprovado.

## Marcos recentes

| PR | Entrega | Merge |
|---:|---|---|
| #90 | Restauração do gate permanente de lint, typecheck, testes e build | `da109185` |
| #92 | Atualização segura de dependências e lockfile reproduzível | `1399a691` |
| #94 | Migração do plugin React para o stack padrão do Vite e code splitting do Rolldown | `93ed0419` |
| #95 | Handoff documental para continuidade no Codex | `e7cb4952` |
| #96 | Alinhamento de tipos Node e runtime para Node 24 | `dffdc25b` |

## Dependências e segurança

O PR #92 atualizou pacotes patch/minor e executou correções seguras do npm audit.

Resultado:

- estado inicial: 5 achados — 1 low, 2 moderate e 2 high;
- estado posterior: 2 moderate, 0 low, 0 high e 0 critical;
- risco residual: cadeia `exceljs → uuid`;
- não aplicar `npm audit fix --force`, pois a correção sugerida rebaixa o ExcelJS.

Referência: `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.

O PR #96 alinhou o projeto ao runtime Node 24.x: `@types/node` `^24.13.2`, `engines.node` `24.x` e CI em Node 24. Referência: `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

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

- deployment `dpl_7dYRKUR42XNFUNxq2GWzz3Hutt7U`;
- commit `dffdc25b1dde210e3a712d4d84723b81cd525938`;
- estado `READY`.

A `main` e a produção principal da Vercel estão perfeitamente sincronizadas no commit `dffdc25b`.

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

Corrigir em PR isolado a veracidade institucional do `SecurityCenterPanel`, que ainda apresenta simulações de segurança com aparência de controles reais.

## Leitura para continuidade

- `AGENTS.md`;
- `docs/PLANO_GLOBAL_V4_2.md`;
- `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
- `.continuity/current-state.json`;
- `docs/HANDOFF.md`;
- `docs/CODEX_HANDOFF_2026-06-25.md`.