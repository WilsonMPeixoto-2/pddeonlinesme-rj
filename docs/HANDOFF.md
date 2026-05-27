# Handoff Operacional - PDDE Online 2026

Atualizado em: 2026-05-18 (pós PR #83 + PR Marco 10B v2 em vôo)

## Regra de leitura

A fonte de verdade técnica é sempre o código-fonte, branch, commit, diff, configuração versionada e testes reais no GitHub. Este arquivo é um snapshot operacional para continuidade; deve orientar a retomada, mas não substitui verificação direta na `main`.

## Contexto atual

**main HEAD:** `d30ca39` (merge PR #83 — flexibilização Marco 11 v2 + 15 v2)

PRs #57 a #83 estão incorporados. PR em vôo: **Marco 10B v2 — Atualização Parcial Assistida da BASE**.

## Regra de negócio — geração documental

Nesta fase, a geração do Demonstrativo Básico depende dos dados cadastrais essenciais, mas não depende da completude fiscal/financeira.

Campos cadastrais ou financeiros ausentes devem sair como `—` no arquivo gerado. Pendências cadastrais não bloqueiam geração individual nem lote; devem ser registradas como pendências da corrida.

## Regra de negócio — atualização parcial da BASE (Marco 10B v2)

A atualização parcial assistida permite envio de planilhas enxutas, contendo apenas chave da unidade e campos a alterar, sem exigir reenvio da BASE completa. A ausência de coluna não apaga nem sobrescreve dados existentes. **Na v1, somente o campo `diretor` é alterável.** Detalhes operacionais em `docs/BULK_UPDATE_PARTIAL_BASE.md`.

Cronologia recente:

- **PR #71** (16/05): RPC transacional Fase 2B com migration aplicada em produção.
- **PR #72** (17/05): adoção formal do **Plano Global v4.2** + **Radar de Inteligência Institucional** como diretriz transversal.
- **PR #73** (17/05): **Painel Executivo-Operacional GAD v1** com **Geração em Lote dos 163 Demonstrativos** (Marco 9B + Marco 15 reclassificado). Migration `20260517120000_document_generation_runs` aplicada em produção.
- **PR #74** (17/05): reconciliação documental + types regenerados pós #72/#73.
- **PR #75** (17/05): **UI admin de papeis** (Marco 6B v0). Migration `20260517130000_admin_user_management` aplicada em produção. RPCs `list_admin_users`, `admin_assign_role`, `admin_revoke_role`. `Configuracoes.tsx` deixou de ser protótipo mock.
- **PR #76** (17/05): **Histórico de gerações documentais** no Painel — card consumindo `document_generation_runs`.
- **PR #78** (17/05): polish — substitui "Em breve" misleading em `/escolas` por "Demonstrativo Básico disponível".
- **PR #79** (17/05): **10 refinamentos visuais sóbrios** no Painel + Configurações (sem redesign, sem trocar fonte/paleta/libs).
- **PR #83** (18/05): **flexibilização da geração do Demonstrativo Básico** — desacopla de completude fiscal/financeira (Marco 11 v2 + 15 v2). Permite gerar 163 demonstrativos para todas as unidades com cadastrais essenciais; valores ausentes saem como `—`.
- **PR Marco 10B v2** (18/05, em vôo): **Atualização Parcial Assistida da BASE** — feature de mass update cadastral cirúrgico em `/base`. Migration `20260518060000_bulk_update_audit` aplicada em produção (audit_logs + bulk_update_runs + bulk_update_items + RPC `apply_partial_bulk_update`). UI em `BulkUpdatePanel`. Whitelist v1: apenas `diretor`. Limite 200 linhas. Aceita .xlsx e .csv (UTF-8/Latin-1, `;` ou `,`, BOM tolerado). Hash SHA-256 do arquivo persistido.
- **Frente 1 / Reconciliação** (26/05): **Modernização Tecnológica, Performance & Governança** — branch `docs/state-reconcile-after-pr43` mesclada e enviada com sucesso ao GitHub. Migration `20260526000000_performance_indexes` criada localmente. Otimizações de manualChunks no Vite, prefetching reativo no hover em `/escolas` e Zod strict CNPJ/INEP validation schema em `src/schemas/unidadeSchema.ts`. Reconciliação completa de dependências com `package-lock.json` e todos os 120 testes de unidade Vitest passando verdes.
- **Frente 6 / E-mail & Zod Estrita** (27/05): **Governança Cadastral Expandida** — commit `445884a` integrado diretamente a `main`. Adição de campo de E-mail Institucional no formulário de cadastro escolar reativo e blindagem estrita usando o `unidadeSchema` do Zod, com persistência híbrida via RPC transacional + Supabase client e invalidação do cache do TanStack Query.
- **Frente A / Responsividade Mobile** (27/05): **Polimento e Homologação Visual** — commit `24d775f` integrado diretamente a `main` (produção Vercel). Otimizou a responsividade de telas pequenas, ocultando de forma cirúrgica as colunas de Exercício e Início em `HistoricoGeracoes.tsx` no mobile, e configurou a listagem de anexos no `PortalDiretor.tsx` para empilhar dinamicamente (`flex-col sm:flex-row`), evitando quebra de textos em viewports de 375px. Limpeza local de branches obsoletas mergeadas realizada com sucesso.
- **Frente B / Segurança e Auditoria** (27/05): **Centro de Segurança e Auditoria** — commit `87263bd` integrado diretamente a `main` (produção Vercel). Implementou o `SecurityCenterPanel.tsx` sob `/configuracoes` contendo verificação interativa de políticas PostgreSQL RLS, Multi-Factor Authentication (MFA) OTP toggle com toasts reativos e log visual terminal-like dos logs dos triggers nativos de banco de dados para segurança em profundidade (Marco 6B).



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
- Não bloquear geração por ausência de notas, despesas, saldos detalhados ou extração fiscal ainda pendente
- Não inventar dados cadastrais nem valores financeiros quando a fonte não existir; usar `—`
- Acompanhar pendências cadastrais essenciais: exercício, designação, CNPJ, endereço, diretor(a), agência e conta corrente

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
| #79 | polish(painel): 10 refinamentos visuais sobrios sem redesign | `fac1d9b` |
| #78 | polish(escolas): replace misleading "Em breve" with honest affordance | `381baff` |
| #77 | chore(reconcile): docs final pos PRs #75 + #76 | `c5b1cdb` |
| #76 | feat(painel): historico de geracoes documentais em lote | `5369ca1` |
| #75 | feat(roles): UI admin de papeis (Marco 6B v0) | `a1ec353` |
| #74 | chore(reconcile): regenerate types + reconcile docs after PR #72 + #73 | `a706751` |
| #73 | feat(painel): Painel Executivo-Operacional GAD v1 + geracao em lote | `9f755ee` |
| #72 | docs: adopt Plano Global v4.2 + Radar de Inteligência Institucional | `b552cb2` |
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

## Próximo passo prioritário: smoke operacional manual

Antes de qualquer nova frente funcional, executar smoke como usuário real:

1. **`/painel`**: hero + CentralDocumental (gerar 163 com progress + ZIP + entry no histórico) + 3 cards de insights (Top, Distribuição, Histórico).
2. **`/configuracoes`**: lista real de usuários; atribuir papel a email teste; tentar revogar próprio admin (deve bloquear).
3. **`/escolas`** linha qualquer: clicar "Gerar documentos" → DocumentsPanel mostra "Demonstrativo Básico disponível".

## Próximas frentes funcionais candidatas (pós-smoke)

Marcos 9B + 15 (PR #73), 6B v0 (PR #75), 9B v2 (PR #76), polish visual (PR #79) entregues. Frentes candidatas, em ordem de impacto institucional:

1. **Marco 11 — Relação de Bens Adquiridos**: 2º documento oficial; consolida o catálogo do `DocumentsPanel`. Depende de template oficial (artefato externo) para virar realidade — sem ele, fica em-breve.
2. **Sub-Marco 6B — `audit_logs`**: trilha de mutações sensíveis (cadastro, contas bancárias, runs documentais, papeis). Pré-requisito para Portal do Diretor.
3. **Marco 10B — Importador via UI** (dry-run, diff, hash): substitui upload simples atual. Nunca service_role no browser.
4. **Página dedicada `/painel/historico`**: filtros + paginação, se uso do card top 5 crescer.

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
