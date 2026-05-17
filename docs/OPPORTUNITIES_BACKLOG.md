# Backlog Adaptativo de Oportunidades - PDDE Online 2026

Atualizado em: 2026-05-17 (Plano Global v4.2 + Radar de Inteligência Institucional)

Este backlog é um radar. Registra oportunidades, riscos e próximas frentes, mas não autoriza execução sem PR próprio.

## Concluído

| Item | Tipo | Referência |
|---|---|---|
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
| **1** | **Painel Executivo-Operacional GAD v1 + Geração em Lote 163 Demonstrativos** | **9B + 15 reclassificado** | **Próximo PR funcional** | Plano e radar consolidados; pronto para implementação |
| 2 | Smoke UI operacional Fase 2B (login admin → editar → reload → confirmar) | 6B (parcial) | Pendente | Bloqueia "Fase 2B encerrada operacionalmente"; rápido |
| 3 | Histórico documental persistido (`document_generation_runs`) | 9B / 15 | Pendente | Migration + RLS + hook; entra no PR do Painel |
| 4 | Card `DistribuicaoDeRecursos` no Painel (insight: 128/163 sem repasse) | 9B | Pendente | Valor institucional alto; baixo custo |
| 5 | Cleanup `index.html` (remover Lovable author + TODOs) | 9B | Pendente | Substituir nos comentários a marca anterior |
| 6 | UI admin para gerenciar usuários e roles | 6B | Pendente | Elimina necessidade de INSERT manual via service_role |
| 7 | Login público / cadastro / password recovery / MFA | 6B | Pendente | Sobe em prioridade pois sistema já escreve dados |
| 8 | Importador institucional via interface (dry-run + diff + hash) | 10B | Pendente | Substitui upload simples; nunca service_role no browser |
| 9 | Outros documentos (Relação de Bens, Termo, Parecer Conclusivo) | 11+12 | Pendente | Templates oficiais + revisão humana |
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
