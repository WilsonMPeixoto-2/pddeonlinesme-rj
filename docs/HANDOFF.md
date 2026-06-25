# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 25/06/2026  
**Escopo:** continuidade técnica após atualização de dependências, PR #97 e abertura de frente de code splitting por rota

## 1. Fonte de verdade

A fonte primária é a verificação direta da `main`, commits, diffs, testes e deployments reais. Este documento é apenas um snapshot operacional.

Repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`.

## 2. Estado atual da main

Main verificada após o merge do PR #97:

- commit `3ee62531466a3f46ce8d9e39b2470aa42a62ba1c`;
- PR #97 — `refactor: centralizar query options e polir graficos`;
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

### PR #97 — Query options e polimento visual seguro

Merge: `3ee62531466a3f46ce8d9e39b2470aa42a62ba1c`.

- Centralizou `queryOptions()` do TanStack Query em `src/lib/queryKeys.ts`;
- preservou contratos existentes de loading, erro e dados;
- adicionou tooltip no gráfico `DistribuicaoDeRecursos`;
- aplicou animações em viewport com Framer Motion em gráficos/listas.

## 4. Estado da Vercel

Projeto principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_779JPpHNfyVa5kpqvcZGLNUiApQF`;
- commit `279013f9d63edb7e9c7832f65a9a980e51dc2619`;
- estado `READY`.

A `main` está à frente da produção principal da Vercel. O preview do PR #97 ficou `READY` em `dpl_EnRBpqKazvWQeAYUaS7wb7hycnqc`, commit `fa80ef38774461856f88c80354c48881b6543767`. Tentativas de deploy/promote de produção após o merge do PR #97 foram bloqueadas por limite temporário da Vercel; confirmar novamente antes de declarar produção sincronizada.

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

## 6. Frente atual — code splitting por rota

Branch: `codex/route-level-code-splitting`.

Escopo:

- converter imports de páginas em `src/App.tsx` para `React.lazy`;
- envolver `Outlet` com `Suspense` e fallback leve;
- preservar providers, `ProtectedRoute`, `TopLoadingBar`, `CommandPalette`, auth, Supabase e regras de negócio.

Validações locais executadas:

- `npx tsc --noEmit`;
- `npm run lint`;
- `npm test`;
- `npm run build`;
- `npm audit --omit=dev` (2 vulnerabilidades moderadas residuais conhecidas em `exceljs -> uuid`);
- `vite preview` + Playwright CLI: `/dashboard` redireciona para login sem sessão; `/acesso-negado` renderiza como rota lazy não protegida. Os únicos erros de console no preview local foram 404 dos scripts Vercel Analytics/Speed Insights, esperados fora da Vercel.

Resultado de build observado:

- páginas separadas em chunks (`Dashboard`, `Escolas`, `Base`, `Configuracoes`, `PortalDiretor`, etc.);
- chunk inicial `index` em aproximadamente `22.70 kB` minificado / `7.38 kB` gzip;
- alerta restante de chunk grande concentrado no `vendor` compartilhado (`~1.92 MB` minificado / `~553 kB` gzip).

## 7. Próxima frente funcional

A próxima frente funcional continua sendo tratar a veracidade institucional do `SecurityCenterPanel`. Como alternativa técnica, após esta frente de rota, pode-se investigar a divisão adicional do `vendor` compartilhado se houver ganho mensurável sem fragmentação excessiva.

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
