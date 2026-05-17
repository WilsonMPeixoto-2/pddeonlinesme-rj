# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-17 (Plano Global v4.2 + Radar de Inteligência Institucional)

## Regra de leitura

A fonte de verdade técnica é sempre o código-fonte, branch, commit, diff, configuração versionada e testes reais no GitHub. Este arquivo é um snapshot operacional para continuidade; deve orientar a retomada, mas não substitui verificação direta na `main`.

## Contexto atual

**main HEAD:** `d6b2d5147d5c3fc8fa6c5f521dc1d75912e5f077` (merge PR #71)

PRs #57 a #71 estão incorporados. PR #71 (RPC transacional Fase 2B) foi mergeado e a migration aplicada em produção via `supabase db push`. Falta apenas smoke UI operacional pela revisão humana.

Não há indicação, neste snapshot, de PR funcional aberto a ser continuado (exceto o presente PR documental v4.2).

## Norte operacional (v4.2)

**Plano vigente:** `docs/PLANO_GLOBAL_V4_2.md`.

**Diretriz transversal obrigatória:** `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

Versão anterior do plano (v4.1) preservada em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` como referência histórica — não foi revogada, apenas atualizada.

## Estado consolidado entregue

### Demonstrativo Básico Individual

Status: concluído, em produção e robustecido.

```txt
PR #43 (motor inicial) → merge 4d97a9c
PR #57 (hardening + contrato Fase 2B) → merge 7baac702
```

Decisão técnica vigente: Opção B (preencher aba MEMORIA diretamente com dados do Supabase).

Restrições vigentes:
- Não depender da aba `BASE`
- Não depender de `XLOOKUP`
- Não publicar template com dados reais consolidados em `public/`
- Remover aba `BASE` do workbook em memória antes de salvar
- Preservar layout, fórmulas, bordas e mesclagens do template
- Manter revisão humana para regras documentais oficiais

### Fase 2B — Edição Cadastral Mínima

Status: implementada, endurecida e em produção.

```txt
PR #63 (implementação) → merge e6fd8171
PR #66 (optimistic update + React 19) → merge 9e8bce3b
PR #70 (polimento visual) → merge 9629b21a
PR #71 (RPC transacional SECURITY INVOKER) → merge d6b2d514
Migration 20260516120000 aplicada em produção via supabase db push
```

Pendente: smoke UI operacional (login admin → editar diretor/endereço → validar optimistic update → recarregar página → confirmar persistência).

### Stack modernizada

```txt
React 18 → 19 (PR #66)
Vite 5 → 7 (PR #67)
Vitest 3 → 4 + jsdom 20 → 29 (PR #68)
xlsx removido → ExcelJS consolidado (PR #69)
npm audit: 0 vulnerabilities
Bundle inicial reduzido em 21%
```

### POC fiscal (isolada, congelada até MVP CRE)

```txt
PR #58 — POC Python isolada
PR #59, #62 — governança + alinhamento 2026
PR #61 — testes de validators
PR #64 (DRAFT, não mergeado) — ADR preliminar
```

Reposicionada como **Aquisição Fiscal Multicanal** (XML > chave > QR > URL > código de barras > PDF textual > OCR > digitação). Detalhe arquitetural em `reference_pdde_fiscal_acquisition_layer_idea` (memória auxiliar).

## PRs recentes incorporados (cronologia)

| PR | Título | Merge |
|---:|---|---|
| #71 | fix(unidades): make cadastro update atomic via SECURITY INVOKER RPC | `d6b2d514` |
| #70 | style(unidades): polish UnidadeCadastroEditDialog + Escolas skeleton | `9629b21a` |
| #69 | chore(deps): remove xlsx (HIGH vuln) and migrate to exceljs | `c56adba5` |
| #68 | chore(deps): upgrade jsdom 20 → 29 and vitest 3 → 4 | `194a309f` |
| #67 | chore(deps): upgrade Vite 5 → 7 and resolve esbuild vuln | `496bdbc7` |
| #66 | chore(deps): upgrade React 18 → 19 + optimistic cadastro updates | `9e8bce3b` |
| #65 | chore(deps): safe patch updates 2026-05-16 | `510702a4` |
| #63 | feat(unidades): implement minimal cadastro editing flow | `e6fd8171` |
| #62 | docs(fiscal): align validation protocol with 2026 architecture policy | `2acf6cb1` |
| #61 | test(fiscal): cover extraction validators | `cf80fa3d` |
| #59 | docs(fiscal): define validation protocol for fiscal extraction POC | `87e41a4c` |
| #58 | spike(fiscal): add document extraction proof of concept | `bb1bb366` |
| #57 | test(documentos): harden workbook generation and prepare Fase 2B contract | `7baac702` |

## Próxima frente funcional recomendada (v4.2)

**Marco 9B — Painel Executivo-Operacional GAD v1**, incorporando **Marco 15 reclassificado — Geração em Lote dos 163 Demonstrativos como Ação Executiva de Alto Valor**.

Escopo proposto para próximo PR funcional:

- Lib + hook de geração em lote (browser-side, batches controlados, JSZip, file-saver)
- Pré-checagem antes de iniciar (quantas unidades aptas vs sem dados)
- Migration `document_generation_runs` (histórico persistido: usuário, timestamp, status, falhas)
- Card `CentralDocumental` no Painel (entre hero e stat cards, destaque)
- Card `TopReprogramados` (top 5 por valor reprogramado — destaca concentração real)
- Card `DistribuicaoDeRecursos` (insight: % unidades sem repasse, com repasse, concentração)
- Substituir botão "Gerar resumos (.zip)" placeholder em `/escolas` pela lib real
- Rename menu lateral: `Dashboard` → `Painel`; h1 da página: `Painel Executivo-Operacional · GAD · 4ª CRE`
- Cleanup `index.html` (remover `<meta author="Lovable">`, comentários TODO residuais)
- Testes unitários da lib + smoke headless

## Pendências planejadas, não urgentes (v4.2)

| Tema | Marco | Observação |
|---|---|---|
| Login, cadastro público, roles, guards, RLS final | 6B | Sobe em prioridade pois sistema já escreve dados |
| UI admin para gerenciar usuários e roles | 6B / fluxos administrativos | Elimina INSERT manual via service_role |
| Importador institucional final (dry-run, diff, hash) | 10B | Substitui upload simples; nunca service_role no browser |
| Portal do Diretor mobile-first | 13 | Depende Marco 6B + diretor-escola link + RLS |
| Outros documentos além do Demonstrativo Básico | 11+12 | Templates oficiais + revisão humana de regras |
| Aquisição Fiscal Multicanal (XML/chave/QR/URL/OCR) | Frente fiscal v1 | Spike pós-MVP da 4ª CRE |
| Hardening pré-produção (WCAG, performance, logs, SLOs) | 14 | Contínuo |

## Implementação entregue pelos PRs recentes (referência rápida)

- Demonstrativo Básico: `src/lib/demonstrativo/`, `src/components/DocumentsPanel.tsx`, template em `public/templates/`
- Edição cadastral: `src/components/UnidadeCadastroEditDialog.tsx`, `src/hooks/useUpdateUnidadeCadastro.ts`, `src/lib/unidadeCadastro.ts`, RPC `public.update_unidade_cadastro_minima` (migration `20260516120000`)
- Stack/deps: `package.json`, `package-lock.json`, configs Vite/Vitest/ESLint atualizadas
- Visual: Dashboard atual já com hero institucional, donut Recharts, stat cards com TiltCard, stagger animation Framer Motion, Recent activity, Atenção operacional

## Regras antes de qualquer tarefa (v4.2)

Ler como orientação obrigatória, não como fonte absoluta:

1. `AGENTS.md`
2. **`docs/PLANO_GLOBAL_V4_2.md`** (plano vigente)
3. **`docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`** (diretriz transversal)
4. `.continuity/current-state.json`
5. `docs/HANDOFF.md` (este arquivo)
6. `docs/DECISIONS.md`
7. `docs/ROADMAP_ADAPTIVE.md`
8. `docs/OPPORTUNITIES_BACKLOG.md`

Depois, verificar diretamente o código, branch, commit e diff reais no GitHub.

## Política de atualização documental

Documentação deve servir ao desenvolvimento, não capturá-lo em ciclos de reconciliação.

Abrir PR exclusivamente documental apenas quando:

- A documentação pode induzir a próxima tarefa ao erro
- Marca trabalho concluído como pendente ou pendente como concluído
- Marca pendência planejada como falha urgente
- Altera prioridade/escopo de forma relevante

Drift pequeno de SHA ou metadado histórico deve ser corrigido no próximo PR funcional, salvo se afetar decisão operacional imediata.

## Política de prompts para agentes (v4.2)

Todo prompt para Codex/Claude Code/outros deve incluir:

```
Antes de implementar, aplicar Radar de Inteligência Institucional:
- Existe fonte estruturada antes de OCR/digitação?
- A solução reduz clique, retrabalho ou memória?
- Há caminho para detalhe/ação no indicador?
- A entrega respeita perfis, RLS e auditoria?
- O ganho é demonstrável visualmente para Alta Administração?
- A abordagem é adequada para 2026?

Cumprir Plano Global v4.2.
```
