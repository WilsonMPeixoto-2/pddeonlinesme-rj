# Estado do Projeto — PDDE Online 2026

**Atualizado em:** 25/06/2026

## Fonte de verdade

A fonte oficial é o GitHub `main`, complementado pelos testes e deployments efetivamente verificados. Clones locais, relatórios e handoffs são snapshots auxiliares.

## Estado técnico atual

Main verificada:

- commit `ecfeb109146cbbd1856d26490b69bb8f633f6835`;
- PR #99 — hotfix de restauração da renderização estável.
- CI aprovado.

## Marcos recentes

| PR | Entrega | Merge |
|---:|---|---|
| #90 | Restauração do gate permanente de lint, typecheck, testes e build | `da109185` |
| #92 | Atualização segura de dependências e lockfile reproduzível | `1399a691` |
| #94 | Migração do plugin React para o stack padrão do Vite e code splitting do Rolldown | `93ed0419` |
| #95 | Handoff documental para continuidade no Codex | `e7cb4952` |
| #96 | Alinhamento de tipos Node e runtime para Node 24 | `dffdc25b` |
| #97 | Query options centralizadas e polimento visual seguro | `3ee6253` |
| #98 | Code splitting por rota com React lazy; revertido pelo PR #99 por incidente de renderização | `e94c36d` |
| #99 | Hotfix para restaurar renderização estável | `ecfeb109` |
| #100 | Code splitting por rota fechado sem merge para não reintroduzir o incidente #98/#99 | — |

## Dependências e segurança

O PR #92 atualizou pacotes patch/minor e executou correções seguras do npm audit.

Resultado:

- estado inicial: 5 achados — 1 low, 2 moderate e 2 high;
- estado posterior: 2 moderate, 0 low, 0 high e 0 critical;
- risco residual: cadeia `exceljs → uuid`;
- não aplicar `npm audit fix --force`, pois a correção sugerida rebaixa o ExcelJS.

Referência: `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.

O PR #96 alinhou o projeto ao runtime Node 24.x: `@types/node` `^24.13.2`, `engines.node` `24.x` e CI em Node 24. Referência: `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

O PR #97 aplicou ganho seguro sobre as dependências atualizadas: centralização de `queryOptions()` do TanStack Query e polimento visual pontual com Recharts/Framer Motion.

## Build atual

O PR #94:

- substituiu `@vitejs/plugin-react-swc` por `@vitejs/plugin-react`;
- alinhou Vite e Vitest;
- manteve React Compiler desabilitado;
- migrou `manualChunks` para `rolldownOptions.codeSplitting.groups`;
- explicitou `react-is` e `@testing-library/dom`;
- manteve override restrito de `@rolldown/plugin-babel` em `0.1.7` para compatibilidade com Workbox/Babel 7.

Não remover esse override sem reproduzir e resolver a instalação limpa.

O PR #98 tentou dividir páginas em chunks com `React.lazy()` e `Suspense`, mas causou tela vazia em produção. O PR #99 restaurou o `src/App.tsx` estável. Não retomar code splitting por rota sem diagnóstico específico de Preview, cache/service worker e smoke visual real.

## Estado da produção

Projeto Vercel principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_7YMS7fdammFttCq6bF4Edn2Yze97`;
- commit `ecfeb109146cbbd1856d26490b69bb8f633f6835`;
- estado `READY`.

A `main` e a produção principal da Vercel estão sincronizadas no commit `ecfeb109`. Smoke público em `/dashboard` redirecionou para login e renderizou sem erros de console.

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
