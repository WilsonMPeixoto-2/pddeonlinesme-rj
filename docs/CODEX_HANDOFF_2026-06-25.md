# Handoff para o Codex — 25/06/2026

## Ponto de retomada

- Repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`.
- `main` verificada após o PR #94: `93ed0419c8b861e83eb9c564d726c86ec550cfa3`.
- Branch já criada: `types-node-26-evaluation`.
- A branch parte de `93ed0419` e ainda mantém `@types/node` em `^25.9.4`.

## Status pós-retomada no Codex

Este handoff foi consumido na branch `types-node-26-evaluation`. A decisão aplicada foi alinhar a tipagem e o gate ao runtime Node 24.x, sem atualizar para Node 26:

- `@types/node` `^24.13.2`;
- `engines.node` `24.x`;
- GitHub Actions em Node 24;
- decisão documentada em `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.

Tratar as seções abaixo como histórico do ponto de partida, não como fila ainda pendente.

## Entregas concluídas

### PR #90 — gate de qualidade

Merge: `da109185f3038927702841ea4eeb3cdf294fd419`.

Foram corrigidos os erros de lint baseados em `any`, adicionada normalização segura de erros com testes e restaurado o CI completo: typecheck, lint, testes e build.

### PR #92 — dependências seguras

Merge: `1399a691d622715a787ea1d9b720ff9992d9f679`.

Atualizados React Query, Framer Motion, Recharts, Vite, TypeScript ESLint, Autoprefixer e Globals. O lockfile foi regenerado e versionado.

A auditoria passou de 5 achados para 2 moderados. Foram eliminadas todas as vulnerabilidades low e high. O risco residual é a cadeia `exceljs → uuid`. Não executar `npm audit fix --force`, pois a correção proposta rebaixa o ExcelJS.

Referência: `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.

### PR #94 — Oxc e Rolldown

Merge: `93ed0419c8b861e83eb9c564d726c86ec550cfa3`.

- plugin React SWC substituído pelo plugin React padrão do Vite;
- Vite e Vitest alinhados;
- React Compiler não habilitado;
- `manualChunks` substituído por `rolldownOptions.codeSplitting.groups`;
- peers `react-is` e `@testing-library/dom` explicitados;
- CI completo aprovado.

O `package.json` contém o override abaixo para evitar conflito entre o peer Babel opcional e o Workbox:

```json
"overrides": {
  "@rolldown/plugin-babel": "0.1.7"
}
```

Não remover sem reproduzir a instalação limpa. Não usar `--force` ou `--legacy-peer-deps` para mascarar conflitos.

## Estado da Vercel

Projeto principal: `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`, runtime Node `24.x`.

Produção confirmada em `READY`:

- deployment `dpl_4M1tQA1JdVNnBYmjjUNXZP3eeBrx`;
- commit `1399a691d622715a787ea1d9b720ff9992d9f679`;
- corresponde ao PR #92.

O PR #94 está na `main`, mas ainda não foi confirmado em produção. A Vercel bloqueou novas execuções do projeto principal por limite temporário de frequência de builds. Houve Preview independente `READY` para o head final do PR #94, mas isso não substitui o deploy de produção.

## Próxima tarefa: tipos Node

Não atualizar automaticamente para `@types/node` 26. O runtime real da Vercel é Node 24.x.

Comparar:

1. manter 25.x temporariamente;
2. alinhar a tipagem para 24.x;
3. usar 26.x apenas se houver decisão explícita sobre runtime e benefício comprovado.

Critério: os tipos devem representar o ambiente real e não liberar APIs indisponíveis em produção.

Arquivos permitidos:

- `package.json`;
- `package-lock.json`;
- documentação relacionada;
- ajustes mínimos de tipagem diretamente causados pela escolha.

Não alterar nesta tarefa:

- migrations, auth, RLS ou roles;
- regras financeiras;
- templates oficiais;
- interface;
- funcionalidades não relacionadas.

Validações:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

Se 26.x não trouxer benefício ou ficar desalinhado ao runtime, documentar a decisão e não criar atualização meramente numérica.

## Depois da avaliação

- preservar o CI permanente sem workflows temporários;
- confirmar o SHA final da `main`;
- publicar um único deployment quando a Vercel permitir;
- confirmar `READY`, SHA associado e resposta do domínio público;
- atualizar continuidade.

## Próxima frente funcional

Após encerrar dependências, tratar em PR separado a veracidade institucional do `SecurityCenterPanel`. O componente contém estados simulados de scanner RLS, MFA e logs que não devem parecer controles reais.

## Leitura obrigatória

1. `AGENTS.md`;
2. `docs/PLANO_GLOBAL_V4_2.md`;
3. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
4. `.continuity/current-state.json`;
5. `docs/HANDOFF.md`;
6. `docs/PROJECT_STATE.md`;
7. documentos em `docs/quality/` desta rodada;
8. este arquivo.

Ao concluir, atualizar `current-state.json`, `session-log.jsonl` e `HANDOFF.md`.
