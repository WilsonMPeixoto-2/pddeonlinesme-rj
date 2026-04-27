# Política de Ferramentas e Regras para Agentes — PDDE Online 2026

Este documento orienta como os agentes autônomos (Antigravity, Cursor, Codex, Lovable, Claude) devem operar neste repositório.

## Regra para agentes: Strict Mode

Toda tarefa técnica deve preservar o **TypeScript Strict Mode**. Se uma alteração quebrar `npx tsc --noEmit`, o agente responsável deve corrigir o erro ou interromper a execução e devolver o bloqueio para revisão.

## Política Operacional Cursor × Codex

O projeto adotará uma política de divisão técnica baseada na natureza da tarefa, e não em preferência por ferramenta.

*   O **Cursor/Antigravity** será utilizado como arquiteto-integrador, responsável por definir contratos, boundaries, impactos sistêmicos, integração entre camadas, segurança, autenticação, permissões, RLS/policies, monorepo e revisão cross-package.
*   O **Codex/Terminal Agents** será utilizado como executor técnico de blocos delimitados, responsável por scripts, parsers, saneamento de repositório, motores documentais, importação XLSX, testes repetitivos, Docker, automações e execução terminal-first.

A regra-mãe será:
1.  **Cursor** define contratos, boundaries e impacto sistêmico.
2.  **Codex** implementa núcleos técnicos ou execuções mecânicas dentro de contrato aprovado.
3.  **Cursor** integra, revisa impacto e fecha a costura final.
4.  **Humano** aprova segurança, regras financeiras, templates oficiais e regras documentais sensíveis.

Se uma tarefa cruzar várias camadas e ainda exigir decisão de contrato, o Cursor lidera.
Se uma tarefa cruzar várias camadas, mas o contrato já estiver aprovado e a execução for mecânica, o Codex pode liderar.

Caso o Codex identifique que a tarefa exige mudança de contrato, schema, regra financeira, regra documental, permissão, autenticação ou arquitetura, deverá interromper a execução, documentar o bloqueio e devolver a decisão para Cursor + humano.

**Nenhuma alteração envolvendo segurança, RLS, papéis de usuário, templates oficiais, regras financeiras ou geração documental oficial será considerada concluída sem revisão humana expressa.**
