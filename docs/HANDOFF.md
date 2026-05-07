# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-07

## Contexto atual

Fonte de verdade: GitHub `main`, atualmente em `d7061edfbafd669d2064bd30af68a351ece57637`.

PRs #40, #41 e #42 foram incorporados. O PR funcional atual e:

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

## PRs recentes

| PR | Titulo | Branch | Estado |
|---:|---|---|---|
| #43 | feat(documentos): generate Demonstrativo Basico from school detail | `feat/demonstrativo-basico-individual` | aberto |
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
- preservar layout, formulas, bordas e mesclagens do template;
- manter revisao humana para regras documentais oficiais.

## Implementacao atual

Arquivos criados/alterados:

- `public/templates/demonstrativo-basico-4cre-template.xlsx`
- `src/lib/demonstrativo/templateCells.ts`
- `src/lib/demonstrativo/mapUnidadeToMemoria.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.ts`
- `src/pages/EscolaEditar.tsx`
- `package.json`
- `package-lock.json`

Decisao tecnica de dependencia:

- `exceljs` foi adicionado porque a dependencia `xlsx` existente nao preserva com confianca estilos, bordas e mesclagens do template.
- `exceljs` e carregado por `dynamic import()` apenas durante a geracao do arquivo.

## Validacoes executadas

- Template inspecionado antes da implementacao: abas `BASE`, `MEMORIA`, `Demonstrativo` e `Conciliação Bancária`; celulas-alvo da `MEMORIA` confirmadas.
- Smoke local do gerador: dois arquivos `.xlsx` gerados com fixtures de unidades diferentes.
- Inspecao com `openpyxl`: celulas-alvo da `MEMORIA` preenchidas diretamente, sem XLOOKUP remanescente em `MEMORIA`, sem tokens `#REF!`, `#VALUE!` ou `#NAME?`.
- `npx tsc --noEmit`: passou.
- `npm run lint`: passou com dois warnings preexistentes de `react-refresh/only-export-components`.
- `npm test`: passou.
- `npm run build`: passou; permanece warning de chunk grande. `exceljs` ficou em chunk separado.

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
