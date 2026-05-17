# Roadmap Adaptativo - PDDE Online 2026

Atualizado em: 2026-05-17 (pós PRs #72 → #76)

## Norte

O **Plano Global v4.2**, em `docs/PLANO_GLOBAL_V4_2.md`, é o norte operacional atual. A versão anterior (v4.1, `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`) permanece como referência histórica — não foi revogada, apenas atualizada.

O **Radar de Inteligência Institucional** em `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` é diretriz transversal: aplica-se a toda tarefa, independentemente do marco.

Este roadmap adaptativo não substitui o plano. Ele organiza a fila curta e registra ajustes pragmáticos entre PRs pequenos.

## Estado atual

- `main` é fonte oficial de continuidade, atualmente em `5369ca1` (merge PR #76).
- **UI admin de papeis** (Marco 6B v0) entregue no PR #75. Migration `20260517130000_admin_user_management` aplicada em produção. Configuracoes deixou de ser mock.
- **Histórico de gerações documentais** (Marco 9B v2) entregue no PR #76 — card no Painel consumindo `document_generation_runs`.
- **Painel Executivo-Operacional GAD v1** (Marco 9B) + **Geração em Lote dos 163 Demonstrativos** (Marco 15 reclassificado) entregues no PR #73. Migration `20260517120000_document_generation_runs` aplicada em produção. Types regenerados.
- **Plano Global v4.2 + Radar de Inteligência Institucional** adotados no PR #72.
- PR #43 (Demonstrativo Básico Individual) entregue, hardneado (PR #57) e em produção.
- **Fase 2B (edição cadastral mínima) implementada e endurecida**: PRs #63 (motor), #66 (optimistic + React 19), #70 (polimento), #71 (RPC transacional). Migration aplicada em produção. Falta apenas smoke UI operacional.
- **Stack modernizada**: React 19, Vite 7, Vitest 4, jsdom 29 (PRs #65–#68).
- **xlsx removido, ExcelJS consolidado** (PR #69). `npm audit` zerado. Bundle inicial reduzido em 21%.
- **POC fiscal isolada** com governança e validators (PRs #58, #59, #61, #62). Reposicionada como "Aquisição Fiscal Multicanal" — congelada até MVP CRE.
- PR de reconciliação documental em andamento (este).

## Próximas frentes funcionais candidatas

Marcos 9B + 15 (PR #73), 6B v0 (PR #75), 9B v2 (PR #76) entregues. Frentes candidatas, em ordem de impacto institucional:

1. **Marco 11 — Relação de Bens Adquiridos**: 2º documento oficial. Reaproveita motor documental. Depende de template oficial real.
2. **Sub-Marco 6B — `audit_logs`**: trilha de mutações sensíveis. Pré-requisito para Portal do Diretor.
3. **Marco 10B — Importador via UI** (dry-run, diff, hash): substitui upload simples atual.
4. **Polimento visual do Painel**: refinamento estético sóbrio sem redesign.
8. Rename menu lateral: `Dashboard` → `Painel`. H1 da página: `Painel Executivo-Operacional · GAD · 4ª CRE`.
9. Cleanup `index.html` (remover `<meta author="Lovable">`, comentários TODO residuais).
10. Testes unitários da lib + smoke headless.

## Marcos funcionais maiores (v4.2)

| Marco | Tema | Status |
|---|---|---|
| 6B | Auth/roles/guards/RLS final + UI admin de roles | Sobe em prioridade pois sistema já escreve dados |
| **9B** | **Painel Executivo-Operacional GAD v1** | **Próxima frente funcional** |
| 10B | Importador institucional com dry-run/diff/hash | Substitui upload simples; nunca service_role no browser |
| 11+12 | Demais documentos (Relação de Bens, Termo, Parecer) | Templates oficiais + revisão humana |
| 13 | Portal do Diretor mobile-first | Depende Marco 6B + diretor-escola link |
| 14 | Hardening pré-produção (WCAG 2.2, perf, logs, SLOs) | Contínuo |
| **15** | **Geração em lote dos 163 Demonstrativos** | **Reclassificado: Ação Executiva de Alto Valor (entra no 9B)** |
| Frente fiscal v1 | **Aquisição Fiscal Multicanal** (XML > chave > QR > URL > barcode > PDF textual > OCR > digitação) | Spike pós-MVP CRE |

## Melhorias acessórias (não bloqueantes)

- Ampliar cobertura do gerador documental e dos hooks.
- Validar telas em viewport mobile (375px, 768px) antes do Portal do Diretor.
- Rotacionar credenciais Supabase antes de uso em produção real.
- Limpar branches locais já mergeadas (após confirmação individual).

## Lessons learned recentes

1. **Reconcile pós-merge é obrigatório**: documentos de continuidade divergem rapidamente de `main` após cada merge significativo. Atualizar HANDOFF/current-state/ROADMAP imediatamente.

2. **Smoke operacional é necessário além de checks técnicos**: `tsc`, `lint`, `test` e `build` não detectam problemas de integração visual ou silent failures de RLS. Validação autenticada em browser é complementar.

3. **Comments de PR vs blob atual**: comentários de revisão referem-se ao diff no momento da revisão, não ao blob final. Ao retomar PR, ler sempre o blob atual via `gh api ...?ref=<head>`.

4. **RLS silencioso (PR #71)**: UPDATE retornando HTTP 200 com 0 linhas afetadas é o padrão de falha de RLS no Supabase. Sempre encadear `.select("id")` e validar `length > 0` no client.

5. **Modernização pode ser rápida quando isolada por camada**: 4 PRs de stack consecutivos (#65–#68) levaram a stack inteira a 2026 sem regressão funcional. A chave foi um PR por camada (React, Vite, Vitest, deps), não tudo junto.

6. **xlsx HIGH não tem patch**: quando uma dependência crítica não tem fix upstream, migrar para alternativa já presente no projeto (ExcelJS) é mais seguro que esperar.

## Regra de uso

Cada item funcional deve virar PR pequeno e próprio. Mudanças de código, Supabase, migrations, UI, regras financeiras ou documentos oficiais não devem ser acopladas a PRs de governança documental.

Documentação deve apoiar o desenvolvimento, não capturá-lo em ciclos de reconciliação.
