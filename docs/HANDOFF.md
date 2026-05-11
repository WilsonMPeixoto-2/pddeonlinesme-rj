# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-09

## Contexto atual

Fonte de verdade: GitHub `main`, atualmente em `9c47ed99887fb8df5ee2ba17251ff2c8591df989`.

PRs #40, #41, #42 e #44 foram incorporados. O PR funcional atual e:

```txt
#43 - https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/pull/43
```

Branch:

```txt
feat/demonstrativo-basico-individual
```

Objetivo da branch:

```txt
feat(documentos): generate Demonstrativo Basico from school detail
```

A branch do PR #43 foi sincronizada em 2026-05-09 com `origin/main` apos o merge do PR #44. Com isso, `supabase/config.toml` tambem aponta para o Supabase proprio `raluxyojqosfzrfozmpz`, e a branch nao contem referencias ativas aos refs antigos do Supabase Lovable.

## PRs recentes

| PR | Titulo | Branch | Estado |
|---:|---|---|---|
| #43 | feat(documentos): generate Demonstrativo Basico from school detail | `feat/demonstrativo-basico-individual` | aberto, mergeable, sincronizado com `main` apos #44, aguardando review |
| #44 | Feat/dashboard real vw dashboard basico | `feat/dashboard-real-vw-dashboard-basico` | mergeado em `9c47ed9` |
| #42 | ops(agentic): add Codex continuity and workflow infrastructure | `ops/agentic-continuity-workflows` | mergeado em `d7061ed` |
| #41 | feat: dashboard B/C paths | `feat/dashboard-export-polish` | mergeado em `89d2306` |
| #40 | feat: integrate tech stack updates (preview) | `feat/tech-stack-integration` | mergeado em `502dbeb` |

## Norte operacional

O norte atual e o Plano Global v4.1 registrado em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`.

O backlog adaptativo em `docs/OPPORTUNITIES_BACKLOG.md` funciona como radar de oportunidades. Itens ali registrados nao autorizam execucao funcional sem PR proprio.

## Sub-marco em execucao

Demonstrativo Basico Individual.

Decisao tecnica vigente:

```txt
Opcao B: preencher a aba MEMORIA diretamente com dados do Supabase.
```

Restricoes da decisao:

- nao depender da aba `BASE` para o arquivo individual;
- nao depender de `XLOOKUP` para o arquivo individual;
- nao publicar template com dados reais consolidados de unidades em `public/`;
- remover a aba `BASE` do workbook em memoria antes de salvar o arquivo final, se ela existir;
- preservar layout, formulas, bordas e mesclagens do template;
- manter revisao humana para regras documentais oficiais.

## Implementacao atual

Arquivos criados/alterados:

- `public/templates/demonstrativo-basico-4cre-template.xlsx`
- `src/lib/demonstrativo/templateCells.ts`
- `src/lib/demonstrativo/mapUnidadeToMemoria.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.test.ts`
- `src/pages/EscolaEditar.tsx`
- `package.json`
- `package-lock.json`

Decisao tecnica de dependencia:

- `exceljs` foi adicionado porque a dependencia `xlsx` existente nao preserva com confianca estilos, bordas e mesclagens do template.
- `exceljs` e carregado por `dynamic import()` apenas durante a geracao do arquivo.

## Validacoes executadas

- Template inspecionado antes da implementacao: abas `BASE`, `MEMORIA`, `Demonstrativo` e `Conciliação Bancária`; celulas-alvo da `MEMORIA` confirmadas.
- Saneamento de 2026-05-08: template publico reinspecionado apos remocao da aba `BASE`; abas finais `MEMORIA`, `Demonstrativo` e `Conciliação Bancária`.
- Saneamento de 2026-05-08: celulas de entrada da `MEMORIA` no template publico foram neutralizadas; nenhuma formula com `BASE!`, `BASE[` ou `XLOOKUP` permaneceu no template.
- Gerador atualizado para remover defensivamente a aba `BASE` do workbook em memoria apos preencher `MEMORIA` e antes de salvar o arquivo final.
- Teste automatizado adicionado para gerar workbook individual, confirmar ausencia da aba `BASE`, existencia das abas `MEMORIA`/`Demonstrativo`, preenchimento de `MEMORIA!B2` e ausencia de formulas `BASE!`, `BASE[` ou `XLOOKUP`.
- Smoke local do gerador: dois arquivos `.xlsx` gerados com fixtures de unidades diferentes.
- Inspecao com `openpyxl`: celulas-alvo da `MEMORIA` preenchidas diretamente, sem XLOOKUP remanescente em `MEMORIA`, sem tokens `#REF!`, `#VALUE!` ou `#NAME?`.
- Comentarios iniciais do Copilot foram tratados: URL do template respeita `BASE_URL`, template fica em cache de modulo, metadados do nome de arquivo foram separados dos campos reais de `MEMORIA`, parsing monetario aceita strings como `R$ 1.000,50`, e o botao recebeu `aria-busy`/icones decorativos.
- `npm test -- generateDemonstrativoBasico`: passou.
- `npx tsc --noEmit`: passou.
- `npm run lint`: passou com dois warnings preexistentes de `react-refresh/only-export-components`.
- `npm test`: passou.
- `npm run build`: passou; permanece warning de chunk grande. `exceljs` ficou em chunk separado.
- Checks Vercel do PR #43: passaram.
- Sincronizacao de 2026-05-09 com `origin/main`: `supabase/config.toml` corrigido para `raluxyojqosfzrfozmpz`; `git grep` no `HEAD` nao encontrou refs antigos do Supabase Lovable.
- Validacao tecnica apos sincronizacao: `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build` passaram.
- Lint permanece com os dois warnings preexistentes de `react-refresh/only-export-components` em `masked-input.tsx` e `useExercicio.tsx`.
- Build permanece com warning de chunk grande; `exceljs` continua em chunk separado.
- Inspecao `openpyxl` apos build confirmou que os templates em `public/` e `dist/` nao contem aba `BASE` nem formulas `BASE!`, `BASE[` ou `XLOOKUP`.
- `supabase link --project-ref raluxyojqosfzrfozmpz --yes` foi executado neste worktree; `supabase projects list` mostra `pdde-online-2026-dev` como `LINKED`.

Preview:

```txt
https://pddeonlinesme-rj-git-feat-dem-beaa6a-wilson-m-peixotos-projects.vercel.app
```

Observacao: acesso anonimo ao Preview retorna Vercel Authentication. A validacao visual/autenticada ainda precisa ser feita com sessao autorizada.

## Validacoes pendentes apos Preview

- Abrir o Preview autenticado.
- Confirmar que `/escolas/:id` carrega.
- Confirmar que o botao `Gerar Demonstrativo Básico (.xlsx)` aparece.
- Gerar arquivos a partir de pelo menos duas unidades reais do Supabase.
- Abrir os arquivos no Excel e confirmar recalculo visual da aba `Demonstrativo` a partir da `MEMORIA`.

## Regras antes de qualquer tarefa

Ler:

1. `AGENTS.md`
2. `.continuity/current-state.json`
3. `docs/HANDOFF.md`
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`
7. `docs/PROJECT_STATE.md`
8. `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`

## Regras depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`
2. `.continuity/session-log.jsonl`
3. `docs/HANDOFF.md`

Se houver nova decisao ou mudanca de prioridade, atualizar tambem `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
