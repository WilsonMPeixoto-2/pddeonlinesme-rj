> **Documento histórico.** Esta reconciliação foi superada pelo encerramento da Supabase Foundation v1 em 2026-05-02. Para continuidade atual, consulte `docs/PROJECT_STATE.md`, `docs/SUPABASE_FOUNDATION_V1_CLOSURE.md` e `docs/GLOBAL_PLAN_V4_RECONCILIATION_AFTER_SUPABASE.md`.

# PDDE Online 2026 — Reconciliação do PR3B após recuperação da produção

Data: 2026-04-29

## 1. Finalidade

Este documento registra a auditoria de reconciliação entre a `main` atual, recuperada após as PRs #8, #9 e #10, e a branch técnica da migração Supabase preservada no PR #7 / PR3B.

A finalidade é impedir que a migração Supabase continue a partir de estado local, branch defasada ou interpretação equivocada dos números dos PRs.

## 2. Fontes oficiais consultadas

- `main` atual: commit `dfa80a9e78ef023e703a92e6f46cd3d1befb1158`.
- PR #7 / PR3B: branch `feature/pr3b-frontend-semantic-schema`.
- PR #6: fechado sem merge por obsolescência documental.
- PR #8: mesclado; restaurou a tabela normal de escolas.
- PR #9: mesclado; adicionou `vercel.json` com fallback SPA.
- PR #10: mesclado; registrou o estado atual após recuperação da produção.

## 3. Resultado da comparação GitHub

Comparação executada:

```text
base: main
head: feature/pr3b-frontend-semantic-schema
```

Resultado:

```text
status: diverged
ahead_by: 9
behind_by: 41
merge_base: 50e7904d6261fea210be2b2217e590996a0ef5a2
```

Interpretação:

- o PR3B possui 9 commits próprios que não estão na `main`;
- a `main` possui 41 commits que não estão no PR3B;
- a base comum ainda é o commit `50e7904`, anterior às recuperações posteriores de produção;
- portanto, o PR3B não deve ser mesclado como está.

## 4. Arquivos alterados pelo PR3B em relação à main

Segundo a comparação GitHub, o PR3B altera/adiciona/remove os seguintes arquivos:

```text
.env.example
docs/MIGRATION_PLAN_FINAL.md
docs/POST_PR3B_BACKLOG.md
docs/PR3B_LOCAL_TESTING.md
docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md
docs/PR3B_PROMPTS.md
docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md
docs/PROJECT_STATE.md
docs/UI_CHANGELOG.md
src/components/ImportResultsPanel.tsx
src/hooks/useExercicio.tsx
src/lib/baseImporter.ts
src/lib/formatters.ts
src/lib/mockEscolas.ts
src/lib/queryKeys.ts
src/pages/Base.tsx
src/pages/Dashboard.tsx
src/pages/EscolaEditar.tsx
src/pages/Escolas.tsx
src/pages/PortalDiretor.tsx
```

## 5. Classificação dos conteúdos do PR3B

### 5.1. Conteúdos aproveitáveis como referência técnica

O PR3B contém material técnico relevante para a migração Supabase:

- adaptação do Dashboard para `vw_unidades_escolares_frontend`;
- adaptação da página `/escolas` para view semântica;
- ajuste de `EscolaEditar` para leitura por view e escrita separada em `unidades_escolares` e `execucao_financeira`;
- remoção de mocks e importador antigo do frontend;
- criação de utilitários como `formatters.ts` e `queryKeys.ts`;
- documentação de preflight local, diagnóstico de Preview e testes do Supabase local.

Esses conteúdos são valiosos como base de consulta, mas não devem ser aplicados à `main` por merge direto neste momento.

### 5.2. Conteúdos que exigem reconciliação manual

Os seguintes pontos exigem cuidado antes de reaproveitamento:

- `src/pages/Escolas.tsx`: a `main` já foi restaurada pela PR #8 para remover a virtualização problemática; a versão do PR3B precisa ser comparada para garantir que não reintroduz regressões visuais ou estruturais.
- `vercel.json`: foi adicionado à `main` pela PR #9 e pode não existir no PR3B, devendo ser preservado em qualquer retomada.
- documentação de estado: a PR #10 registra estado mais recente do que os documentos antigos do PR3B e deve prevalecer.
- `.env.example`: o ajuste para `VITE_SUPABASE_PUBLISHABLE_KEY` é útil, mas precisa ser reconciliado com a política de variáveis vigente.
- `src/hooks/useExercicio.tsx`: o PR3B altera lógica do exercício; precisa ser validado contra o estado visual funcional da produção.

### 5.3. Conteúdos que não devem ser considerados prontos para produção

- qualquer conexão com Supabase remoto próprio;
- qualquer interpretação de que o PR3B validou Production;
- qualquer início automático do PR4 lógico;
- qualquer `db push` remoto;
- qualquer alteração de Vercel Production;
- qualquer uso de dados reais sem revisão humana.

## 6. Decisão operacional

O PR #7 / PR3B deve permanecer:

```text
aberto;
draft;
não mesclado;
não promovido;
usado como referência técnica preservada.
```

Não é recomendável fechá-lo agora, porque ele preserva uma trilha técnica importante da migração. Também não é recomendável mesclá-lo, porque está 41 commits atrás da `main` e pode sobrescrever ou conflitar com a recuperação de produção.

## 7. Próxima ação recomendada

A próxima ação segura é criar uma nova branch técnica, a partir da `main` atual, para reconstruir a linha PR3B de forma limpa.

Nome sugerido:

```text
feature/pr3b-rebased-semantic-schema
```

Objetivo dessa nova branch:

- partir da `main` atual, e não da base antiga;
- preservar `vercel.json`;
- preservar a tabela funcional restaurada em produção;
- reaproveitar seletivamente as alterações úteis do PR3B;
- validar localmente antes de abrir novo PR;
- manter Production intocada;
- não iniciar PR4 lógico.

## 8. Estratégia recomendada para reconstrução limpa

Em vez de rebase automático amplo, a estratégia recomendada é cherry-pick/reaplicação seletiva por blocos:

1. **Documentação técnica útil**
   - `docs/PR3B_LOCAL_TESTING.md`
   - `docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md`
   - `docs/PR3B_PROMPTS.md`
   - `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md`
   - `docs/POST_PR3B_BACKLOG.md`

2. **Contrato de ambiente**
   - reconciliar `.env.example` para `VITE_SUPABASE_PUBLISHABLE_KEY` se o código atual assim exigir.

3. **Utilitários seguros**
   - `src/lib/formatters.ts`
   - `src/lib/queryKeys.ts`

4. **Telas principais, uma por vez**
   - `Dashboard.tsx`
   - `Escolas.tsx`
   - `EscolaEditar.tsx`
   - `Base.tsx`
   - `PortalDiretor.tsx`
   - `ImportResultsPanel.tsx`

5. **Remoção de mocks/importador antigo**
   - remover `baseImporter.ts` e `mockEscolas.ts` apenas quando as telas já estiverem adaptadas e validadas.

## 9. Gates antes de qualquer novo PR técnico

Antes de abrir um novo PR técnico substituto do PR3B, executar:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Além disso, validar visualmente em Preview:

- Dashboard;
- `/escolas`;
- `/escolas/:id`;
- Base;
- PortalDiretor;
- Login/ProtectedRoute;
- fallback SPA por rota direta.

## 10. Bloqueios preservados

Não iniciar ainda:

- PR4 lógico/cutover remoto;
- Supabase remoto próprio;
- `supabase db push`;
- migrations novas;
- alteração de variáveis na Vercel;
- promoção de Production;
- monorepo;
- Fastify;
- Cloud Run;
- motor documental real.

## 11. Conclusão

O PR3B continua aproveitável como trilha técnica, mas não como PR diretamente mesclável.

O estado correto do projeto passa a ser:

```text
Produção estável na main.
PR3B antigo preservado em draft.
PR6 fechado por obsolescência.
Próxima etapa: reconstruir PR3B em branch limpa a partir da main atual, com reaproveitamento seletivo.
```
