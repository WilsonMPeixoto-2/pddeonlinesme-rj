# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 25/06/2026  
**Escopo:** continuidade técnica após restauração do CI, atualização segura de dependências e modernização do build

## 1. Fonte de verdade

A fonte primária é a verificação direta da `main`, commits, diffs, testes e deployments reais. Este documento é apenas um snapshot operacional.

Repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`.

## 2. Estado atual da main

Main verificada após o PR documental de continuidade:

- commit `e7cb4952479d6af62e49784e2c544632d2396864`;
- PR #95 — `docs: reconciliar estado e preparar continuidade no Codex`;
- estado: merged.

Último marco técnico de código:

- commit `93ed0419c8b861e83eb9c564d726c86ec550cfa3`;
- PR #94 — `build: migrar React para Oxc e Rolldown`;
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

## 4. Estado da Vercel

Projeto principal:

- ID `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime Node `24.x`;
- domínio `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada:

- deployment `dpl_4M1tQA1JdVNnBYmjjUNXZP3eeBrx`;
- commit `1399a691d622715a787ea1d9b720ff9992d9f679`;
- estado `READY`.

A `main` está à frente da produção. O PR #94 foi validado por CI e Preview independente, mas o projeto principal não confirmou deployment desse SHA por limite temporário de frequência de builds. Não declarar produção em `93ed0419` antes de verificar o deployment real.

## 5. Decisão técnica: tipos Node

Branch: `types-node-26-evaluation`.

Decisão tomada: alinhar os tipos ao runtime real Node 24.x, sem atualizar para 26.x.

Alterações da branch:

- `@types/node` de `^25.9.4` para `^24.13.2`;
- `package-lock.json` sincronizado com `@types/node` `24.13.2`;
- `engines.node` declarado como `24.x`;
- GitHub Actions atualizado de Node 20 para Node 24;
- decisão documentada em `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

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

## 6. Próxima frente funcional

Após mergear a avaliação de tipos Node, tratar em PR separado a veracidade institucional do `SecurityCenterPanel`. O componente contém estados simulados de scanner RLS, MFA e logs que não devem parecer controles reais.

## 7. Leitura obrigatória para continuidade

1. `AGENTS.md`;
2. `docs/PLANO_GLOBAL_V4_2.md`;
3. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
4. `.continuity/current-state.json`;
5. `docs/CODEX_HANDOFF_2026-06-25.md`;
6. documentos em `docs/quality/` desta rodada.

## 8. Regras de execução

- manter PRs em escopo isolado;
- não usar `--force` ou `--legacy-peer-deps` para obter instalação artificialmente verde;
- não alterar migrations, regras financeiras, templates oficiais ou segurança nesta avaliação de tipos;
- confirmar SHA de produção antes de reportar sincronização;
- atualizar `current-state.json`, `session-log.jsonl` e este handoff ao concluir a próxima tarefa.
