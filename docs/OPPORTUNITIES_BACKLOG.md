# Backlog Adaptativo de Oportunidades - PDDE Online 2026

Atualizado em: 2026-05-07

Este backlog e um radar. Ele registra oportunidades, riscos e proximas frentes, mas nao autoriza execucao sem PR proprio.

| Prioridade | Item | Tipo | Status | Observacao |
|---:|---|---|---|---|
| 1 | Demonstrativo Basico Individual via `MEMORIA` | documentos | proximo sub-marco | Usar Opcao B; nao depender de `BASE` nem de `XLOOKUP`; requer rastreabilidade entre Supabase e template. |
| 2 | PRs #40 e #41 | governanca GitHub | incorporado | Ambos ja foram mergeados na `main`. |
| 3 | Fechamento de PRs historicos superados | governanca GitHub | pendente | Seguir docs de reconciliacao antes de fechar. |
| 4 | Dashboard real/analitico | produto/dados | pendente | Pertence ao Marco 9; nao tratar como Foundation v1. |
| 5 | Fase 2B edicao cadastral/bancaria | dados/UI | pendente | Exige contrato, permissao, auditoria e validacao. |
| 6 | Importador institucional via interface | dados/documentos | pendente | Pertence ao Marco 10; carga administrativa inicial ja cumpriu seu papel. |
| 7 | Auth/roles/guards/RLS final | seguranca | pendente | Revisao humana obrigatoria. |
| 8 | Portal do Diretor | produto/seguranca | pendente | Depende de vinculo diretor-escola e escopo de acesso. |
| 9 | Motor documental v1 | documentos | pendente | Deve respeitar templates oficiais e revisao humana. |
| 10 | Hardening pre-producao | qualidade/seguranca | continuo | Incluir bundle, smoke, acessibilidade, logs e validacoes. |

## Como promover um item

Para promover um item a PR:

1. Confirmar o marco do Plano Global v4.1.
2. Definir ferramenta lider.
3. Definir arquivos permitidos e proibidos.
4. Registrar criterio de aceite.
5. Registrar validacoes tecnicas.
6. Atualizar `docs/HANDOFF.md` ao final.
