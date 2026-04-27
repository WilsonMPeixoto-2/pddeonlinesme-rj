# PR3B.-1 — Higiene de repositorio pre-PR 3B

Data: 2026-04-27
Branch: `feature/pr3b-frontend-semantic-schema`
Commit base: `50e7904d6261fea210be2b2217e590996a0ef5a2` (Merge PDDE Online v2.2 local validation)

## Objetivo

Antes de iniciar o PR 3B funcional, sanear tres debitos transversais que poderiam contaminar a validacao das adaptacoes de tela:

1. Diagnostico da tela azul (`docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md`) ainda untracked.
2. `.env.example` divergente do contrato lido pelo codigo (`VITE_SUPABASE_ANON_KEY` em vez de `VITE_SUPABASE_PUBLISHABLE_KEY`).
3. Lockfile dessincronizado no estado atual de `main` (`decc727`), com `npm ci` falhando.

## Restricoes respeitadas nesta etapa

- Nao alterar producao.
- Nao mexer na Vercel.
- Nao cadastrar variaveis de ambiente.
- Nao rodar `supabase db push`.
- Nao alterar schema, migrations ou frontend visual.
- Nao trabalhar em `main`.
- Nao fazer merge.
- Nao commitar segredos.
- Nao usar `service_role`.

## Acoes executadas

### 1. Branch criada

- Verificacao previa: `feature/pr3b-frontend-semantic-schema` NAO existia local nem em `origin/` antes da acao.
- Criada com `git switch -c feature/pr3b-frontend-semantic-schema 50e7904d6261fea210be2b2217e590996a0ef5a2`.
- HEAD confirmado: `50e7904d6261fea210be2b2217e590996a0ef5a2`.
- A branch ainda NAO foi publicada em `origin/`. A publicacao (`git push -u origin ...`) fica como decisao explicita de Wilson.

### 2. Diagnostico da tela azul preservado

Arquivo: `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md` (anteriormente untracked, agora staged).

Itens cobertos no relatorio:

- (a) Erro exato registrado: `Error: supabaseUrl is required.`
- (b) Causa raiz documentada: ausencia de `VITE_SUPABASE_URL` e/ou `VITE_SUPABASE_PUBLISHABLE_KEY` no bundle gerado.
- (c) Estado da Vercel registrado: `envs: []` em `preview`, `production` e `development`.
- (d) Preview marcado como invalido enquanto as variaveis nao forem configuradas no target Preview.
- (e) Adicionada secao "Chaves Supabase no frontend" registrando que `service_role` nunca deve ser embarcada no bundle do cliente, em variaveis `VITE_*`, em arquivos commitados ou em headers expostos. O frontend usa exclusivamente a chave publica/anon (`VITE_SUPABASE_PUBLISHABLE_KEY`).

### 3. `.env.example` corrigido

Diff aplicado:

```
- VITE_SUPABASE_ANON_KEY=your_anon_key
+ VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

Justificativa: `src/integrations/supabase/client.ts` le `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`, nao `VITE_SUPABASE_ANON_KEY`. O contrato documental agora bate com o que o codigo realmente espera.

O codigo NAO foi alterado nesta etapa.

### 4. Lockfile

Em `50e7904`, `npm ci` instalou 498 pacotes em 2 min sem erro de sincronizacao:

```
added 498 packages, and audited 499 packages in 2m
```

O `package-lock.json` ja estava alinhado com o `package.json` neste commit. A divergencia descrita no diagnostico (`npm ci` falhando porque o lock nao continha `xlsx@0.18.5`) ocorre apenas em commits posteriores (entre `50e7904` e `decc727`), e por isso `npm install --package-lock-only` nao precisou ser executado.

Nenhum arquivo de dependencia (`package.json`, `package-lock.json`, `bun.lock`, `bun.lockb`) foi modificado nesta etapa.

## Validacoes

| Comando | Resultado | Tempo |
|---|---|---|
| `npm ci` | exit 0; 498 packages instalados | 2 min |
| `npx tsc --noEmit` | exit 0; sem erros de tipo | <30s |
| `npm run build` | exit 0; bundle `dist/assets/index-BLuX4Rxb.js` (~1640 kB) | 12.92s |
| `npm run lint` | exit 0; 1 warning pre-existente (ver abaixo) | <30s |

Warning de lint pre-existente:

```
src/hooks/useExercicio.tsx
  22:17  warning  Fast refresh only works when a file only exports components.
                  Use a new file to share constants or functions between components
                  react-refresh/only-export-components
```

Sera revisitado no sub-prompt **3B.1**, que ja tem este arquivo no escopo (adicionar persistencia em `localStorage` e helper `useExercicioAsNumber`). Nao e bloqueante para o PR3B.-1.

Warning de build pre-existente sobre tamanho de chunk (>500 kB apos minify) NAO foi alvo desta etapa.

`npm audit` reportou 6 vulnerabilidades (3 low, 2 moderate, 1 high). Tratamento fica como item separado, fora do escopo do PR3B.-1.

## Estado pos-acao

Arquivos staged para commit:

- `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md` (novo, com secao adicional sobre `service_role`).
- `.env.example` (linha 3 corrigida).
- `docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md` (este arquivo, novo).

Arquivos NAO modificados nesta etapa: todo o `src/`, todas as migrations, `package.json`, `package-lock.json`, configuracoes de build/lint/test.

`node_modules/` foi reinstalado a partir do lockfile e esta funcional.

## Observacao sobre `.env` versionado em `main`

O `.env` com chaves Supabase reais existe tracked em `main` (`decc727`) mas NAO existe em `50e7904` nem nesta branch. Por consequencia:

- A `feature/pr3b-frontend-semantic-schema` nasce limpa do problema.
- O problema **continua presente em `main`** e exige tratamento deliberado em PR separado de seguranca, com:
  - Rotacao previa das chaves expostas em `decc727` (a chave publishable nao concede acesso administrativo, mas qualquer chave commitada deve ser rotacionada por higiene).
  - `git rm --cached .env` em `main`.
  - Adicao de `.env` ao `.gitignore` se ainda nao estiver.

Esse trabalho NAO foi feito aqui porque exige decisao de seguranca explicita de Wilson e operacao em `main`, ambas fora do escopo do PR3B.-1.

## Pendencias deliberadamente nao tratadas

1. **Variaveis na Vercel.** Cadastro de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em targets `Preview` e `Production` fica para a etapa de Preview/cutover, posterior ao PR 3B funcional.
2. **`.env` tracked em `main`.** Tratamento descrito na secao acima; PR de seguranca dedicado, posterior.
3. **Vulnerabilidades reportadas por `npm audit`.** 6 itens; tratamento fora de escopo.
4. **Warning de tamanho de bundle.** Pre-existente; fora de escopo.
5. **Warning de `react-refresh/only-export-components` em `useExercicio.tsx`.** Sera reavaliado no 3B.1.

## Proxima acao

Aguardar autorizacao explicita de Wilson para iniciar **3B.0** (preflight do Supabase local + dados de teste).
