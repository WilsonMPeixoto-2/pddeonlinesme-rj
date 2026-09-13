---
name: pdde-continuity
description: Use para iniciar ou encerrar tarefas no PDDE Online 2026 com leitura, reconciliacao e atualizacao de continuidade operacional.
---

# PDDE Continuity

## Antes de agir

1. Leia `AGENTS.md`.
2. Leia `docs/README.md`.
3. Leia `.continuity/current-state.json`.
4. Leia `docs/HANDOFF.md`.
5. Leia `docs/DECISIONS.md`.
6. Leia `docs/ROADMAP_ADAPTIVE.md`.
7. Se `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md` estiver com `Status: ATIVO`, leia-o antes de qualquer tarefa que toque dados, Supabase, Auth/RLS, importacao, financeiro, fiscal, cache, logs ou observabilidade.
8. Leia a documentacao tecnica especifica do topico.
9. Confirme branch/PR/SHA atuais, arquivos permitidos/proibidos e o sistema real correspondente ao topico.

### Regra especial durante o hardening ativo

Nao reinicie a investigacao do zero.

Depois da leitura do registro de hardening:

1. identifique o ultimo status e o proximo ponto de retomada do topico;
2. compare esse status com codigo, migrations, banco, CI e deployment atuais;
3. se o registro continuar coerente, prossiga do ponto documentado;
4. se houver divergencia, registre a nova evidencia antes de mudar o plano;
5. nao reabra item `CLOSED` sem evidencia nova de regressao/divergencia;
6. nao marque item como concluido apenas porque mock/teste local passou quando o risco envolve contrato Supabase real.

## Depois de agir

Depois de agir, avalie se houve mudanca operacional relevante.

Enquanto a campanha de hardening estiver ativa, **sempre atualize** `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md` ao concluir uma etapa/tópico, incluindo:

- novo status;
- evidencia objetiva;
- commit/PR quando existir;
- validacoes executadas;
- risco/bloqueio remanescente;
- proximo ponto exato de retomada.

Atualize `.continuity/current-state.json`, `.continuity/session-log.jsonl` e `docs/HANDOFF.md` quando a tarefa alterar estado, escopo, prioridade, decisao, risco, marco atual ou informacao necessaria para a proxima retomada.

Atualize `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` ou `docs/OPPORTUNITIES_BACKLOG.md` somente quando houver mudanca real de rumo, prioridade, criterio de aceite ou alocacao no Plano Global.

Nao abrir PR exclusivamente documental por drift pequeno de SHA ou metadado historico sem impacto operacional. A campanha de hardening e excecao deliberada porque o registro e parte do mecanismo de continuidade ate o encerramento formal.