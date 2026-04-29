# PDDE Online 2026 — Plano de reconstrução limpa do PR3B

Data: 2026-04-29
Branch: `feature/pr3b-clean-semantic-schema`
Base: `main` atual após PR #8, #9, #10 e #11

## 1. Finalidade

Esta branch nasce da `main` atual, já recuperada e estabilizada, para reconstruir a etapa lógica PR3B sem reaplicar cegamente a branch antiga `feature/pr3b-frontend-semantic-schema`.

O objetivo é reaproveitar seletivamente o trabalho técnico válido do PR #7 / PR3B, preservando as correções de produção e o fallback SPA da Vercel.

## 2. Regra principal

Não fazer rebase automático amplo nem merge direto da branch antiga.

A reconstrução deve ser seletiva, por blocos pequenos, com validação após cada grupo de alterações.

## 3. Estado de partida

A branch atual parte da `main` que contém:

- produção recuperada;
- tabela de escolas restaurada sem `VirtualizedSchoolsTable`;
- remoção de `@tanstack/react-virtual`;
- `vercel.json` com fallback SPA;
- registros documentais de estado e reconciliação.

Esses elementos devem ser preservados.

## 4. PR3B antigo como referência

A branch antiga continua existindo:

```text
feature/pr3b-frontend-semantic-schema
```

Ela deve ser usada apenas como fonte de consulta/reaproveitamento seletivo.

Não deve ser mesclada diretamente.

## 5. Blocos de reconstrução recomendados

### Bloco 1 — Documentação técnica útil

Reaproveitar seletivamente, se ainda fizer sentido:

- `docs/PR3B_LOCAL_TESTING.md`
- `docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md`
- `docs/PR3B_PROMPTS.md`
- `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md`
- `docs/POST_PR3B_BACKLOG.md`

Critério:

- atualizar referências a commits antigos;
- registrar que a `main` atual já contém PR #8, #9, #10 e #11;
- não substituir documentos mais recentes por documentos antigos.

### Bloco 2 — Contrato de ambiente

Verificar se o código atual espera:

```text
VITE_SUPABASE_PUBLISHABLE_KEY
```

Se sim, reconciliar `.env.example` para refletir o contrato real.

Não commitar `.env` real.
Não commitar service role.
Não alterar variáveis Vercel nesta etapa.

### Bloco 3 — Utilitários seguros

Avaliar reaproveitamento de:

- `src/lib/formatters.ts`
- `src/lib/queryKeys.ts`

Critério:

- importar apenas se usado pelas telas adaptadas;
- evitar criar código morto;
- manter tipagem estrita.

### Bloco 4 — Hook de exercício

Avaliar reaproveitamento das alterações em:

- `src/hooks/useExercicio.tsx`

Critério:

- preservar funcionamento visual atual;
- evitar regressão no seletor global de exercício;
- validar `npx tsc --noEmit` após alteração;
- documentar warning de Fast Refresh, se persistir.

### Bloco 5 — Telas de leitura

Reaplicar de modo seletivo:

- `src/pages/Dashboard.tsx`
- `src/pages/Escolas.tsx`
- `src/pages/Base.tsx`
- `src/components/ImportResultsPanel.tsx`

Critério:

- preservar tabela funcional da produção;
- não reintroduzir virtualização;
- não reintroduzir mock falso sem sinalização;
- usar views semânticas somente se o contrato de dados estiver confirmado.

### Bloco 6 — Tela de edição

Reaplicar seletivamente:

- `src/pages/EscolaEditar.tsx`

Critério:

- leitura via view é aceitável;
- escrita deve ser separada em tabelas-base apenas se o schema/tipos estiverem coerentes;
- não escrever em view diretamente;
- se exigir RPC/backend/transação real, parar e registrar bloqueio.

### Bloco 7 — Remoção de mocks/importador antigo

Remover apenas quando as telas já estiverem adaptadas:

- `src/lib/baseImporter.ts`
- `src/lib/mockEscolas.ts`

Critério:

- não quebrar build;
- não deixar imports órfãos;
- validar com `rg`.

## 6. Proibições nesta branch

Não fazer nesta branch sem autorização expressa:

- PR4 lógico;
- Supabase remoto próprio;
- `supabase db push`;
- migrations novas;
- alteração de variáveis Vercel;
- promoção de Production;
- monorepo;
- Fastify;
- Cloud Run;
- motor documental real;
- alterações Lovable;
- virtualização de tabela;
- uso de dados reais sensíveis.

## 7. Validações obrigatórias

Após cada bloco relevante:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Antes de abrir PR técnico:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Validação visual obrigatória em Preview:

- Dashboard;
- `/escolas`;
- rota direta `/escolas`;
- `/escolas/:id`;
- Base;
- PortalDiretor;
- login/rotas protegidas;
- fallback SPA.

## 8. Critério para abrir novo PR técnico

Abrir PR somente quando:

- a branch compilar;
- não houver resíduos de virtualização;
- `vercel.json` estiver preservado;
- a tabela de escolas funcionar;
- as telas adaptadas estiverem coerentes com o schema semântico;
- Supabase remoto não tiver sido alterado;
- Production não tiver sido tocada.

Título sugerido:

```text
PR3B clean — adapta frontend ao schema semântico a partir da main recuperada
```

## 9. Handoff obrigatório

Ao final da próxima execução técnica, registrar:

- arquivos lidos;
- arquivos alterados;
- blocos executados;
- comandos rodados;
- resultados dos testes;
- pendências;
- riscos;
- se o PR técnico pode ser aberto;
- se a branch antiga pode ser fechada posteriormente.

## 10. Conclusão

Esta branch é o novo ponto limpo para retomada da migração frontend/Supabase.

A branch antiga `feature/pr3b-frontend-semantic-schema` permanece preservada como referência, mas não deve receber merge direto.
