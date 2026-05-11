# Roadmap Adaptativo - PDDE Online 2026

Atualizado em: 2026-05-11

## Norte

O Plano Global v4.1, em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`, e o norte operacional atual.

Este roadmap adaptativo nao substitui o plano. Ele organiza a fila curta e registra ajustes pragmaticos entre PRs pequenos.

## Estado atual

- Supabase Foundation v1 encerrada como migracao fundacional.
- `main` e a fonte oficial de continuidade, atualmente em `4d97a9cba09fcfe155402f4c6b6679087fc3d19e`.
- PR #43 (Demonstrativo Basico Individual) entregue e implantado em producao.
- Telas principais de escolas ja usam views reais do Supabase proprio.
- PRs #40, #41, #42, #43 e #44 incorporados na `main`.
- Nenhum PR funcional aberto no momento.

## Fila curta recomendada

1. `docs/state-reconcile-after-pr43` — reconciliacao de `.continuity/` e `docs/` apos merge do PR #43.
   - Escopo: apenas `.continuity/` e `docs/`.
   - Status: em preparacao neste PR.

2. `README real` — substituir boilerplate Lovable por documentacao propria do projeto.
   - Escopo: `README.md`.

3. `AGENTS.md realinhado` — alinhar a regra de fonte de verdade (GitHub > documentos).
   - Escopo: `AGENTS.md`.

4. `CI minimo` — lint + typecheck em PRs.
   - Escopo: `.github/workflows/`.

5. `Lockfile unico` — remover `yarn.lock` se presente, manter apenas `package-lock.json`.
   - Escopo: lockfiles.

6. `Limpeza lovable-tagger` — remover GitHub Action herdada do Lovable.
   - Escopo: `.github/workflows/`.

## Marcos funcionais maiores (pós higiene)

- Marco 6B: Edicao cadastral minima (Fase 2B).
- Marco 10B: Importador institucional via interface.
- Marcos 11+12: Auth/roles/guards/RLS final.
- Marco 13: Portal do Diretor.
- Marco 14: Motor documental v1 (geracao em lote).

## Melhorias acessorias

- Cobertura de teste: ampliar coverage do gerador e das views.
- Mobile responsiveness: validar telas em viewport mobile.
- Rotacao de senha Supabase: automatizar ou documentar periodicidade.
- Deletar diretorio fisico de branches locais ja mergeadas.

## Lessons learned recentes

1. **Reconcile pos-merge e obrigatorio:** documentos de continuidade divergem rapidamente de `main` apos um merge. O PR de reconciliacao deve ser aberto imediatamente apos cada merge significativo.

2. **Smoke operacional e necessario alem de checks tecnicos:** `tsc`, `lint`, `test` e `build` nao detectam problemas de integracao visual (ex: `motion.tr` desalinhando colunas, painel mock nao conectado ao gerador). Validacao visual autenticada e complementar e necessaria.

3. **Comments de PR vs blob atual:** comentarios de revisao em PR referem-se ao estado do diff no momento da revisao, nao ao estado final do blob apos fixups. Ao retomar um PR, verificar sempre o blob atual, nao os comments isolados.

## Regra de uso

Cada item funcional deve virar PR pequeno e proprio. Mudancas de codigo, Supabase, migrations, UI, regras financeiras ou documentos oficiais nao devem ser acopladas a PRs de governanca.
