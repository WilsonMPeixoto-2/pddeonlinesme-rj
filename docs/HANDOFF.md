# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 25/06/2026  
**Escopo:** continuidade técnica após PR #97, incidente do PR #98, hotfix #99, fechamento do PR #100, PR #101 e correção isolada do `SecurityCenterPanel`

## 1. Fonte de verdade

A fonte primária é a verificação direta da `main`, commits, diffs, testes e deployments reais. Este documento é apenas um snapshot operacional.

Repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`.

## 2. Estado atual da main

Main verificada antes da correção isolada do `SecurityCenterPanel`:

- commit `f5ad026e0d3d9ef099198f99c4c1bed3c1dbfcc8`;
- PR #101 — `[codex] docs: reconciliar hotfix e produção Vercel`;
- estado: merged;
- último marco de código de aplicação permanece o hotfix `ecfeb109146cbbd1856d26490b69bb8f633f6835` até a entrada do PR de veracidade do `SecurityCenterPanel`.

## 3. Entregas recentes

### PR #90 — restauração do gate técnico

Merge: `da109185f3038927702841ea4eeb3cdf294fd419`.

- corrigidos sete usos de `any` em tratamentos de erro;
- criada normalização segura de erros baseada em `unknown`;
- adicionados testes unitários;
- mantidas as regras de lint;
- CI normal voltou a executar typecheck, lint, testes e build.

### PR #92 — atualização segura e reproduzível

Merge: `1399a691d622715a787ea1d9b720ff9992d9f679`.

- atualizados React Query, Framer Motion, Recharts, Vite, TypeScript ESLint, Autoprefixer e Globals;
- `package-lock.json` regenerado e versionado;
- executado `npm audit fix` sem `--force`;
- vulnerabilidades reduzidas de 5 para 2 moderadas;
- eliminadas todas as vulnerabilidades low e high;
- risco residual `exceljs → uuid` documentado.

Referência: `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.

### PR #94 — Oxc e Rolldown

Merge: `93ed0419c8b861e83eb9c564d726c86ec550cfa3`.

- `@vitejs/plugin-react-swc` substituído por `@vitejs/plugin-react`;
- Vite e Vitest alinhados ao plugin React padrão;
- React Compiler não habilitado;
- `manualChunks` substituído por `rolldownOptions.codeSplitting.groups`;
- `react-is` e `@testing-library/dom` declarados explicitamente;
- lockfile sincronizado;
- CI completo aprovado.

O `package.json` mantém override restrito de `@rolldown/plugin-babel` em `0.1.7` para compatibilidade com o Workbox/Babel 7. Não remover sem reproduzir a instalação limpa.

### PR #95 — Reconciliação Documental

Merge: `e7cb4952479d6af62e49784e2c544632d2396864`.

- Concluiu a consolidação inicial da documentação de governança e logs da sessão de modernização.

### PR #96 — Alinhamento de Tipos Node 24

Merge: `dffdc25b1dde210e3a712d4d84723b81cd525938`.

- Alinhou tipos `@types/node` ao runtime Node 24.x da Vercel. Sincronizou `engines.node` e ambiente de CI do GitHub Actions.

### PR #97 — Query options e polimento visual seguro

Merge: `3ee62531466a3f46ce8d9e39b2470aa42a62ba1c`.

- Centralizou `queryOptions()` do TanStack Query;
- preservou contratos de loading, erro e dados;
- adicionou tooltip no gráfico de distribuição de recursos;
- aplicou polimento visual com Framer Motion em pontos já seguros.

### PR #98 — Code splitting por rota

Merge: `e94c36d01bfb75fd8322b699412590c0ccd3ca5c`.

- Aplicou `React.lazy()` e `Suspense` em páginas roteadas;
- reduziu o entrypoint inicial, mas causou renderização vazia em produção;
- não deve ser repetido sem investigação específica de Preview, cache, service worker e validação visual real.

### PR #99 — Hotfix de renderização

Merge: `ecfeb109146cbbd1856d26490b69bb8f633f6835`.

- Restaurou `src/App.tsx` ao padrão estável anterior ao PR #98;
- removeu temporariamente lazy loading por rota;
- restabeleceu a renderização da aplicação em produção.

### PR #100 — Fechado sem merge

PR: `https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/pull/100`.

- Foi fechado sem merge porque reintroduzia a mesma mudança revertida pelo hotfix #99;
- manter fechado para evitar regressão.

### PR #101 — Reconciliação pós-hotfix e produção

Merge: `f5ad026e0d3d9ef099198f99c4c1bed3c1dbfcc8`.

- Atualizou documentação de continuidade após o hotfix #99 e o fechamento do PR #100;
- foi implantado automaticamente em produção pela Vercel;
- não alterou código de aplicação.

## 4. Estado da Vercel

Projeto principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_56wP3LvWJsmK3YziSoLbzGroGuqg`;
- commit `f5ad026e0d3d9ef099198f99c4c1bed3c1dbfcc8`;
- estado `READY`.

A `main` estava sincronizada com a produção principal da Vercel no commit `f5ad026` antes da branch `codex/security-center-truthfulness`. Confirmar novamente o SHA de produção após o merge desta correção.

Smoke público executado em `https://pddeonlinesme-rj.vercel.app/dashboard`:

- redirecionou para `/` sem sessão autenticada;
- renderizou a tela de login;
- console sem erros ou warnings.

## 5. Decisão técnica: tipos Node

Decisão concluída: Alinhamento ao runtime real Node 24.x (via PR #96).

Alterações realizadas e validadas:

- `@types/node` ajustado para `^24.13.2`;
- `package-lock.json` sincronizado com `@types/node` `24.13.2`;
- `engines.node` declarado como `24.x`;
- GitHub Actions atualizado para executar com Node 24;
- decisão detalhada em `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

Não atualizar para `@types/node` 26.x sem decisão explícita de runtime Node 26 e benefício comprovado.

Validações obrigatórias:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

## 6. Lição técnica imediata — code splitting por rota

O code splitting por rota é uma oportunidade real, mas a tentativa do PR #98 não pode ser tratada como pronta. Ela quebrou a renderização em produção e foi revertida pelo PR #99.

Qualquer retomada deve ser feita em PR próprio com:

- preview Vercel validado visualmente antes do merge;
- teste em sessão limpa e sessão com service worker/cache prévio;
- smoke de `/`, `/dashboard`, `/acesso-negado` e uma rota autenticada;
- plano explícito de rollback;
- sem acoplar a mudanças de documentação, Supabase, auth ou regras financeiras.

## 7. Frente funcional em execução

A branch `codex/security-center-truthfulness` trata a veracidade institucional do `SecurityCenterPanel`.

Escopo permitido:

- manter o painel como mapa/checklist visual do Marco 6B;
- remover aparência de scanner RLS real, toggle MFA real e logs de auditoria reais;
- preservar layout, valor institucional e microinterações seguras.

Fora de escopo:

- Auth, RLS, Supabase, migrations, papéis, policies, templates financeiros, dependências e regras de negócio.

Depois do merge e deploy, escolher nova frente funcional com escopo fechado. Qualquer implementação real de Auth/RLS/audit_logs continua exigindo revisão humana.

## 8. Leitura obrigatória para continuidade

1. `AGENTS.md`;
2. `docs/PLANO_GLOBAL_V4_2.md`;
3. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
4. `.continuity/current-state.json`;
5. `docs/CODEX_HANDOFF_2026-06-25.md`;
6. documentos em `docs/quality/` desta rodada.

## 9. Regras de execução

- manter PRs em escopo isolado;
- não usar `--force` ou `--legacy-peer-deps` para obter instalação artificialmente verde;
- não alterar migrations, regras financeiras, templates oficiais ou segurança nesta avaliação de tipos;
- confirmar SHA de produção antes de reportar sincronização;
- atualizar `current-state.json`, `session-log.jsonl` e este handoff ao concluir a próxima tarefa.
