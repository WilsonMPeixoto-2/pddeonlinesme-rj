# Roadmap Adaptativo - PDDE Online 2026

Atualizado em: 2026-05-07

## Norte

O Plano Global v4.1, em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`, e o norte operacional atual.

Este roadmap adaptativo nao substitui o plano. Ele organiza a fila curta e registra ajustes pragmaticos entre PRs pequenos.

## Estado atual

- Supabase Foundation v1 encerrada como migracao fundacional.
- `main` e a fonte oficial de continuidade.
- Telas principais de escolas ja usam views reais do Supabase proprio.
- PRs abertos atuais: #40 e #41, ambos aguardando revisao.
- Este PR e exclusivamente documental/operacional.

## Fila curta recomendada

1. `ops(agentic): add Codex continuity and workflow infrastructure`
   - Escopo: governanca operacional e continuidade.
   - Status: em preparacao neste PR.

2. `feat(documentos): gerar Demonstrativo Basico individual via MEMORIA`
   - Escopo: gerar o Demonstrativo Basico Individual.
   - Decisao tecnica: Opcao B, preencher `MEMORIA` diretamente com dados do Supabase.
   - Bloqueios: revisar contrato de dados, template oficial, regras financeiras e criterios de rastreabilidade antes de implementar.

3. Revisao/fechamento dos PRs abertos ou superados
   - #40 e #41 requerem revisao.
   - PRs historicos superados devem ser tratados conforme documentos de reconciliacao.

4. Proximas frentes do Plano Global v4.1
   - Dashboard real e analitico.
   - Fase 2B de edicao cadastral/bancaria.
   - Importador institucional.
   - Auth/roles/guards/RLS.
   - Portal do Diretor.

## Regra de uso

Cada item funcional deve virar PR pequeno e proprio. Mudancas de codigo, Supabase, migrations, UI, regras financeiras ou documentos oficiais nao devem ser acopladas a PRs de governanca.
