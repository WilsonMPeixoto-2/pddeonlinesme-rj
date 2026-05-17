# Backlog Adaptativo de Oportunidades - PDDE Online 2026

Atualizado em: 2026-05-17 (pós PR #72 v4.2 + PR #73 Painel GAD v1)

Este backlog é um radar. Registra oportunidades, riscos e próximas frentes, mas não autoriza execução sem PR próprio.

## Concluído

| Item | Tipo | Referência |
|---|---|---|
| **Painel Executivo-Operacional GAD v1 + Geração em Lote 163 Demonstrativos** | produto/dados | PR #73, merge `9f755ee` |
| **Plano Global v4.2 + Radar de Inteligência Institucional** | governança | PR #72, merge `b552cb2` |
| Demonstrativo Básico Individual via `MEMORIA` (Opção B) | documentos | PR #43, merge `4d97a9c` |
| Hardening do motor documental + contrato Fase 2B | qualidade | PR #57, merge `7baac702` |
| **Fase 2B — Edição cadastral mínima** | dados/UI | PR #63, merge `e6fd8171` |
| **React 19 + optimistic update no cadastro** | stack/UX | PR #66, merge `9e8bce3b` |
| **Vite 5 → 7 + esbuild vuln resolvida** | stack | PR #67, merge `496bdbc7` |
| **Vitest 3 → 4 + jsdom 20 → 29** | stack/testes | PR #68, merge `194a309f` |
| **xlsx removido (HIGH) + ExcelJS consolidado** | stack/segurança | PR #69, merge `c56adba5` |
| Polimento visual UnidadeCadastroEditDialog + skeleton | UI | PR #70, merge `9629b21a` |
| **RPC transacional cadastro com SECURITY INVOKER** | dados/segurança | PR #71, merge `d6b2d514` |
| POC fiscal Python isolada + governança + validators | spike | PRs #58, #59, #61, #62 |
| PRs históricos #40–#56 (Foundation v1 + higiene) | governança | Mergeados |

## Em aberto

| Prioridade | Item | Marco v4.2 | Status | Observação |
|---:|---|---|---|---|
| **1** | **UI admin para gerenciar usuários e roles** | **6B v0** | **Próximo PR funcional candidato** | Elimina necessidade de INSERT manual via service_role |
| **1.alt** | **Relação de Bens Adquiridos (2º documento oficial)** | **11** | **Próximo PR funcional candidato** | Reaproveita motor documental |
| 2 | Smoke UI operacional Fase 2B (login admin → editar → reload → confirmar) | 6B (parcial) | Pendente | Bloqueia "Fase 2B encerrada operacionalmente"; rápido |
| 3 | Painel: histórico de `document_generation_runs` (timeline) | 9B v2 | Pendente | Aproveita base persistida em #73 |
| 4 | `audit_logs` para mutações sensíveis | sub-6B | Pendente | Pré-requisito para Portal do Diretor |
| 5 | Login público / cadastro / password recovery / MFA | 6B | Pendente | Sobe em prioridade pois sistema já escreve dados |
| 6 | Importador institucional via interface (dry-run + diff + hash) | 10B | Pendente | Substitui upload simples; nunca service_role no browser |
| 7 | Termo de Doação, Consolidação de Preços, Ata, Parecer | 11+12 | Pendente | Templates oficiais + revisão humana |
| 10 | Portal do Diretor mobile-first | 13 | Pendente | Depende Marco 6B + diretor-escola link + RLS por escopo |
| 11 | **Aquisição Fiscal Multicanal v1** (XML > chave > QR > URL > barcode > PDF textual > OCR > digitação) | Frente fiscal v1 | Pendente | Reposicionada de "OCR-first"; spike pós-MVP CRE |
| 12 | Hardening pré-produção (WCAG 2.2, performance, logs, SLOs) | 14 | Contínuo | Inclui bundle, smoke, acessibilidade, logs e validações |
| 13 | Mobile responsiveness das telas atuais | 13 (preparação) | Pendente | Validar 375px e 768px antes do Portal do Diretor |
| 14 | Cobertura de teste do gerador e hooks | qualidade | Contínuo | Ampliar onde houve bug ou regressão |
| 15 | Rotacionar credenciais Supabase antes de prod real | operacional | Pendente | Wilson.mpeixoto / wilsonmp2 são DEV; rotacionar antes |
| 16 | Limpeza de branches locais já mergeadas | higiene | Pendente | Listar individualmente e confirmar (não em massa) |

## Riscos rastreados (não bloqueantes)

| Risco | Mitigação prevista | Marco |
|---|---|---|
| RLS silent failure (UPDATE/INSERT retorna 200 com 0 rows) | Padrão `.select("id")` + length check obrigatório em mutações sensíveis | Contínuo |
| Geração em lote pode estourar memória do browser com 163 unidades + template | Batches controlados (5 a 10 por vez); pré-checagem; limite de fallback | 9B/15 |
| Service_role acidentalmente no bundle do browser | Lint/CI específico + revisão humana obrigatória em qualquer mutação privilegiada | 6B / contínuo |
| Documentos fiscais reais commitados | `.gitignore` + revisão humana + sanitização em testes | Frente fiscal |
| Templates oficiais com dados consolidados em `public/` | Proibido por contrato técnico; sanitização automática | Sempre |

## Lessons learned recentes (v4.2)

1. **Reconcile pós-merge** continua obrigatório.
2. **Smoke operacional** continua complementar aos checks técnicos.
3. **Blob atual no head**, não comments de review, é fonte para auditoria.
4. **RLS silencioso** pede `.select("id")` + length check; já é padrão no projeto.
5. **Modernização por camada** (1 PR = 1 dependência grande) é mais segura que upgrade em bloco.
6. **Documentação focada**: apenas abre PR documental quando a doc pode induzir o próximo agente ao erro ou alterar prioridade/escopo. Drift pequeno corrige-se no próximo PR funcional.
7. **Inteligência institucional** entra como filtro obrigatório (Radar §3.1): valor visível, ação orientada, fluxo real, rastreabilidade, modernidade responsável, estética institucional.

## Como promover um item a PR

1. Confirmar o marco do Plano Global v4.2.
2. Aplicar as 8 perguntas obrigatórias do Radar (`docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` §3.1).
3. Definir ferramenta líder (ou execução solo).
4. Definir arquivos permitidos e proibidos.
5. Registrar critério de aceite (operacional, não apenas técnico).
6. Registrar validações técnicas (tsc, lint, test, build, audit).
7. Definir smoke operacional quando aplicável.
8. Atualizar `docs/HANDOFF.md`, `.continuity/current-state.json` ao final.
