# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-11

## Regra de fonte de verdade

A fonte de verdade tecnica do projeto e sempre a verificacao direta do codigo-fonte, branch, commit, diff, configuracao versionada e testes reais no GitHub.

Este documento e um snapshot operacional para continuidade entre sessoes. Ele deve orientar a retomada, mas nao substitui a verificacao direta da `main` antes de qualquer decisao.

## Contexto atual verificado

Repositorio: `WilsonMPeixoto-2/pddeonlinesme-rj`

Branch base: `main`

HEAD atual verificado: `c769d473170cca63ce6f4108b873ce12277e3072`

Status: nao ha indicacao de PR funcional aberto neste snapshot.

## Ciclo recente concluido

A fila curta de higiene, governanca e estabilizacao foi concluida nos PRs recentes:

| PR | Titulo | Estado |
|---:|---|---|
| #53 | chore(deps): safe patch updates | mergeado em `c769d47` |
| #52 | docs(state): reconcile documentation with current main state | mergeado em `3152aec` |
| #51 | test(documents): cover DocumentsPanel error and placeholder flows | mergeado em `a1d04a9` |
| #50 | chore(cleanup): remove unused lovable-tagger residue | mergeado em `41e7cc4` |
| #49 | chore(deps): standardize on npm lockfile | mergeado em `308fade` |
| #48 | ci: add minimal pull request validation workflow | mergeado em `8ec8b39` |
| #47 | docs(readme): replace Lovable placeholder with project overview | mergeado em `6739dd6` |
| #46 | docs(governance): realign AGENTS with source-of-truth protocol | mergeado em `a34c3d0` |
| #45 | docs(state): reconcile continuity after PR 43 merge | mergeado em `88238ce` |
| #43 | feat(documentos): generate Demonstrativo Basico from school detail | mergeado em `4d97a9c` |

## Sub-marco entregue: Demonstrativo Basico Individual

Status: concluido, mergeado e implantado em producao.

URL de producao: https://pddeonlinesme-rj.vercel.app

Decisao tecnica vigente:

```txt
Opcao B: preencher a aba MEMORIA diretamente com dados do Supabase.
```

Restricoes permanentes para futuras alteracoes:

- nao depender da aba `BASE` para o arquivo individual;
- nao depender de `XLOOKUP` para o arquivo individual;
- nao publicar template com dados reais consolidados de unidades em `public/`;
- remover a aba `BASE` do workbook em memoria antes de salvar o arquivo final, se ela existir;
- preservar layout, formulas, bordas e mesclagens do template;
- manter revisao humana para regras documentais oficiais.

## Implementacao funcional relevante

Arquivos centrais do Demonstrativo Basico Individual:

- `public/templates/demonstrativo-basico-4cre-template.xlsx`
- `src/lib/demonstrativo/templateCells.ts`
- `src/lib/demonstrativo/mapUnidadeToMemoria.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.test.ts`
- `src/pages/EscolaEditar.tsx`
- `src/pages/Escolas.tsx`
- `src/components/DocumentsPanel.tsx`
- `src/components/DocumentsPanel.test.tsx`

Observacao: o caminho real atual do componente e `src/components/DocumentsPanel.tsx`. Nao usar `src/components/escola/DocumentsPanel.tsx` salvo se o codigo futuro criar esse caminho.

## Itens planejados, nao urgentes

Os seguintes pontos nao devem ser tratados como novas descobertas emergenciais. Eles ja pertencem ao Plano Global v4.1 e devem ser executados no marco adequado, salvo justificativa tecnica concreta para reordenacao:

| Item | Alocacao planejada |
|---|---|
| Login, cadastro publico, roles, guards e RLS final | Marco 6B |
| Configuracoes/Admin real | Marco 6B / fluxos administrativos |
| Importador institucional final | Marco 10B |
| Portal do Diretor | Marco 13 |
| Motor documental em lote/ZIP | Marcos 11, 12 e 15 |
| Hardening, smoke/e2e, acessibilidade, logs e bundle | Marco 14 / melhoria continua |

## Proxima frente recomendada

A proxima frente funcional recomendada e a **Fase 2B - edicao cadastral minima**.

Metodo recomendado:

1. iniciar por contrato tecnico pequeno;
2. definir campos editaveis;
3. definir permissao e auditoria;
4. definir validacoes e logs;
5. somente depois implementar UI.

Nao iniciar por alteracao visual ampla sem contrato de dados, permissao e rastreabilidade.

## Politica contra ciclo infinito de documentacao

Documentacao acompanha o desenvolvimento; ela nao deve travar o projeto.

Abrir PR exclusivamente documental apenas quando:

- a documentacao induzir o proximo agente a executar tarefa errada;
- listar como pendente algo ja concluido de forma que altere decisao operacional;
- apontar caminho de arquivo incorreto que possa causar erro;
- registrar prioridade incompatível com o plano global;
- houver decisao nova que altere escopo, risco ou aceite.

Drift pequeno de commit SHA, sem impacto operacional, deve preferencialmente ser corrigido junto ao proximo PR funcional.

## Regras antes de qualquer tarefa

Ler e verificar:

1. `AGENTS.md`
2. `.continuity/current-state.json` como snapshot, nao fonte absoluta
3. `docs/HANDOFF.md` como snapshot, nao fonte absoluta
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`
7. `docs/PROJECT_STATE.md`
8. `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`
9. GitHub `main`, PRs recentes e arquivos reais antes de decidir
