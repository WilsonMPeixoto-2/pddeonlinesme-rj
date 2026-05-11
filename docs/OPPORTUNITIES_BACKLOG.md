# Backlog Adaptativo de Oportunidades - PDDE Online 2026

Atualizado em: 2026-05-11

Este backlog e um radar. Ele registra oportunidades, riscos e proximas frentes, mas nao autoriza execucao sem PR proprio.

| Prioridade | Item | Tipo | Status | Observacao |
|---:|---|---|---|---|
| — | Demonstrativo Basico Individual via `MEMORIA` | documentos | **concluido** (PR #43, merge `4d97a9c`) | Entregue em producao. Opcao B. |
| — | PRs #40, #41, #42, #44 | governanca GitHub | **concluido** | Todos mergeados em `main`. |
| — | PRs historicos superados | governanca GitHub | **concluido** | Branches deletadas, PRs fechados. |
| — | Reconciliacao pos-merge PR #43 | governanca/docs | **concluido** (PR #45, merge `88238ce`) | Drift corrigido. |
| — | AGENTS.md realinhado | governanca | **concluido** (PR #46, merge `a34c3d0`) | Fonte de verdade estabelecida. |
| — | README real | documentacao | **concluido** (PR #47, merge `6739dd6`) | Substituiu boilerplate Lovable. |
| — | CI minimo | infraestrutura | **concluido** (PR #48, merge `8ec8b39`) | lint + typecheck em PRs adicionado. |
| — | Lockfile unico | infraestrutura | **concluido** (PR #49, merge `308fade`) | `bun.lock` e `bun.lockb` removidos. |
| — | Limpeza lovable-tagger | infraestrutura | **concluido** | Removido de devDependencies e `vite.config.ts`. |
| — | Cobertura de testes DocumentsPanel | qualidade | **concluido** | Caminhos de erro e placeholders cobertos. |
| 6 | Dashboard real/analitico | produto/dados | pendente | Pertence ao Marco 9; nao tratar como Foundation v1. |
| 8 | Fase 2B edicao cadastral/bancaria | dados/UI | pendente | Exige contrato, permissao, auditoria e validacao. |
| 9 | Importador institucional via interface | dados/documentos | pendente | Pertence ao Marco 10; carga administrativa inicial ja cumpriu seu papel. |
| 10 | Auth/roles/guards/RLS final | seguranca | pendente | Revisao humana obrigatoria. |
| 11 | Portal do Diretor | produto/seguranca | pendente | Depende de vinculo diretor-escola e escopo de acesso. |
| 12 | Motor documental v1 | documentos | pendente | Deve respeitar templates oficiais e revisao humana. |
| 13 | Hardening pre-producao | qualidade/seguranca | continuo | Incluir bundle, smoke, acessibilidade, logs e validacoes. |
| 14 | Cobertura de teste | qualidade | continuo | Ampliar coverage do gerador e das views. |
| 15 | Mobile responsiveness | UI | pendente | Validar telas em viewport mobile. |
| 16 | Rotacao de senha Supabase | operacional | pendente | Automatizar ou documentar periodicidade. |

## Lessons learned recentes

1. **Reconcile pos-merge:** documentos de continuidade divergem rapidamente. O PR de reconciliacao deve ser a primeira acao apos cada merge significativo.

2. **Smoke operacional necessario alem de checks tecnicos:** `tsc`, `lint`, `test` e `build` nao detectam bugs de integracao visual. Validacao visual autenticada complementa os checks automatizados.

3. **Comments de PR vs blob atual:** ao retomar um PR, verificar o blob atual no GitHub, nao apenas comments de revisao que podem referir-se a um estado anterior do diff.

## Como promover um item

Para promover um item a PR:

1. Confirmar o marco do Plano Global v4.1.
2. Definir ferramenta lider.
3. Definir arquivos permitidos e proibidos.
4. Registrar criterio de aceite.
5. Registrar validacoes tecnicas.
6. Atualizar `docs/HANDOFF.md` ao final.
