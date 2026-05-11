# Roadmap Adaptativo - PDDE Online 2026

Atualizado em: 2026-05-11

## Norte

O Plano Global v4.1, em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`, e o norte operacional atual.

Este roadmap adaptativo nao substitui o plano. Ele organiza a fila curta e registra ajustes pragmaticos entre PRs pequenos.

## Estado atual

- Supabase Foundation v1 encerrada como migracao fundacional.
- `main` e a fonte oficial de continuidade, atualmente em `a1d04a971f265b9c9e525628b85e16dcd2c092f2`.
- PR #43 (Demonstrativo Basico Individual) entregue e implantado em producao.
- PRs de higiene/governanca (#46 a #51) mergeados.
- Telas principais de escolas ja usam views reais do Supabase proprio.
- PRs #40 ate #51 incorporados na `main`.
- Nenhum PR funcional aberto no momento.

## Fila curta recomendada

*(Fila curta de higiene concluída nos PRs #46 a #51. Ver Marcos Funcionais abaixo para próximos passos)*

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
