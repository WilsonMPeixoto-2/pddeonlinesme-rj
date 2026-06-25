# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 25/06/2026  
**Escopo:** continuidade técnica após alinhamento de tipos Node, verificação de produção Vercel, reconciliação documental e abertura de frente de polimento técnico pós-atualização de pacotes

## 1. Fonte de verdade

A fonte primária é a verificação direta da `main`, commits, diffs, testes e deployments reais. Este documento é apenas um snapshot operacional.

Repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`.

## 2. Estado atual da main

Main verificada após o alinhamento de tipos Node e reconciliação documental:

- commit `dffdc25b1dde210e3a712d4d84723b81cd525938`;
- PR #96 — `chore: alinhar tipos node e engine para node 24`;
- estado: merged.

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

## 4. Estado da Vercel

Projeto principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_7dYRKUR42XNFUNxq2GWzz3Hutt7U`;
- commit `dffdc25b1dde210e3a712d4d84723b81cd525938`;
- estado `READY`.

A `main` está perfeitamente sincronizada com a produção principal da Vercel no commit `dffdc25b`.

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

## 6. Frente em avaliação — polimento técnico pós-atualização

Branch: `codex/tanstack-query-ui-polish`.

Escopo preparado:

- centralizar `queryOptions()` do TanStack Query em `src/lib/queryKeys.ts`;
- manter os hooks existentes com `useQuery`, preservando contratos atuais de `isLoading`, `error` e `data`;
- adicionar `Tooltip` do Recharts ao gráfico `DistribuicaoDeRecursos`;
- aplicar `useInView` do Framer Motion em animações de entrada de gráficos/listas.

Fora do escopo desta frente:

- migração ampla para `useSuspenseQuery`;
- alterações no `SecurityCenterPanel`;
- mudanças em Supabase, migrations, templates financeiros, regras de negócio ou produção Vercel.

Validações locais já executadas na branch:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
git diff --check
```

## 7. Próxima frente funcional

A próxima frente funcional é tratar a veracidade institucional do `SecurityCenterPanel`. O componente contém estados simulados de scanner RLS, MFA e logs que não devem parecer controles reais.

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
