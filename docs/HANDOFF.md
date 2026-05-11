# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-11

## Regra de leitura

A fonte de verdade técnica é sempre o código-fonte, branch, commit, diff, configuração versionada e testes reais no GitHub. Este arquivo é um snapshot operacional para continuidade; deve orientar a retomada, mas não substitui verificação direta na `main`.

## Contexto atual

Fonte de verdade a verificar: GitHub `main`.

Snapshot operacional desta atualização: `main` em `c769d473170cca63ce6f4108b873ce12277e3072`.

PRs #40 a #53 foram incorporados a `main`. Não há indicação, neste snapshot, de PR funcional aberto a ser continuado.

## Estado consolidado entregue

### Demonstrativo Básico Individual

Status: **concluído e mergeado; validação/deploy em produção reportados operacionalmente, sem artefato versionado no repositório**.

```txt
#43 - https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/pull/43
Merge commit: 4d97a9cba09fcfe155402f4c6b6679087fc3d19e
Merged at: 2026-05-11T01:37:40Z
Merged by: WilsonMPeixoto-2 (admin bypass)
```

Decisão técnica vigente:

```txt
Opção B: preencher a aba MEMORIA diretamente com dados do Supabase.
```

Restrições vigentes para qualquer alteração futura:

- não depender da aba `BASE` para o arquivo individual;
- não depender de `XLOOKUP` para o arquivo individual;
- não publicar template com dados reais consolidados de unidades em `public/`;
- remover a aba `BASE` do workbook em memória antes de salvar o arquivo final, se ela existir;
- preservar layout, fórmulas, bordas e mesclagens do template;
- manter revisão humana para regras documentais oficiais.

### Correções de UI entregues no PR #43

1. **Tabela `/escolas`:** substituição de `motion.tr` + `row-accent` por `TableRow` nativo, `table-fixed` e `colgroup`, para evitar desalinhamento de colunas.
2. **DocumentsPanel:** integração com `useUnidadeDetalhe`, `generateDemonstrativoBasico` e `file-saver/saveAs`, eliminando o antigo sucesso falso sem download.

Arquivo real do componente: `src/components/DocumentsPanel.tsx`.

## PRs recentes incorporados

| PR | Título | Estado |
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
| #44 | Feat/dashboard real vw dashboard basico | mergeado em `9c47ed9` |
| #42 | ops(agentic): add Codex continuity and workflow infrastructure | mergeado em `d7061ed` |
| #41 | feat: dashboard B/C paths | mergeado em `89d2306` |
| #40 | feat: integrate tech stack updates (preview) | mergeado em `502dbeb` |

## Validações e limites da evidência

- O código e os testes versionados são a evidência primária.
- Smoke autenticado em produção foi reportado em sessão operacional, mas não há artefato versionado no repositório para esse smoke.
- Qualquer agente deve validar novamente no código antes de afirmar estado funcional.

## Norte operacional

O norte atual é o Plano Global v4.1 registrado em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`.

Itens como login definitivo, roles, RLS, Portal do Diretor, importador institucional, motor documental em lote, configurações reais e hardening **já estão alocados no Plano Global**. Não devem ser tratados como novas falhas urgentes apenas por ainda não estarem implementados no protótipo.

## Próxima frente funcional recomendada

**Fase 2B — Edição cadastral mínima**, iniciando por contrato técnico antes de UI:

- campos editáveis;
- quem pode editar;
- se a alteração será direta ou por solicitação;
- validação;
- trilha de auditoria;
- impacto em documentos já gerados.

## Pendências planejadas, não urgentes

| Tema | Alocação planejada | Observação |
|---|---|---|
| Login, cadastro público, roles, guards e RLS final | Marco 6B | Protótipo usado pelo desenvolvedor; não tratar como urgência sem risco real. |
| Configurações/Admin real | Marco 6B / fluxos administrativos | A tela atual pode conter placeholders. |
| Importador institucional final | Marco 10B | Diferenciar importador técnico atual de fluxo institucional final. |
| Portal do Diretor | Marco 13 | Depende de papéis e vínculo diretor-escola. |
| Motor documental em lote / ZIP | Marcos 11, 12 e 15 | Avançar após contratos documentais. |
| Hardening, smoke/e2e, acessibilidade, logs e bundle | Marco 14 / contínuo | Não bloquear protótipo salvo regressão concreta. |

## Implementação entregue pelo PR #43

Arquivos principais:

- `public/templates/demonstrativo-basico-4cre-template.xlsx`
- `src/lib/demonstrativo/templateCells.ts`
- `src/lib/demonstrativo/mapUnidadeToMemoria.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.ts`
- `src/lib/demonstrativo/generateDemonstrativoBasico.test.ts`
- `src/pages/EscolaEditar.tsx`
- `src/pages/Escolas.tsx`
- `src/components/DocumentsPanel.tsx`
- `src/components/DocumentsPanel.test.tsx`
- `package.json`
- `package-lock.json`

## Regras antes de qualquer tarefa

Ler como orientação, não como fonte absoluta:

1. `AGENTS.md`
2. `.continuity/current-state.json`
3. `docs/HANDOFF.md`
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`
7. `docs/PROJECT_STATE.md`
8. `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`

Depois, verificar diretamente o código, branch, commit e diff reais no GitHub.

## Política de atualização documental

Documentação deve servir ao desenvolvimento, não capturá-lo.

Abrir PR exclusivamente documental apenas quando o documento puder induzir a próxima tarefa ao erro, marcar trabalho concluído como pendente, marcar pendência planejada como falha urgente ou alterar prioridade/escopo de forma relevante.

Drift pequeno de SHA ou metadado histórico deve ser corrigido no próximo PR funcional, salvo se afetar decisão operacional imediata.
