# Estado do Projeto — PDDE Online 2026

Atualizado em: 2026-05-02

## Status Global

Fase atual: **Pós-Supabase Foundation v1 concluída / retorno ao Plano Global v4**.

A migração fundacional para o Supabase próprio foi encerrada como etapa tática. O projeto deve voltar a ser conduzido pelo Plano Global v4, com as pendências funcionais realocadas para seus marcos próprios.

## Fonte de verdade

A fonte oficial de continuidade é o GitHub (`main`), complementado pelos deployments da Vercel e pelas configurações externas documentadas.

Estados locais em Antigravity, Codex, Claude Code, Lovable, PC doméstico, notebook ou clones temporários não devem ser tratados como fonte de verdade se divergirem da `main`.

## Marcos recentes incorporados à main

| PR | Entrega | Resultado |
|---:|---|---|
| #27 | Script administrativo de importação remota da BASE para Supabase próprio | Incorporado |
| #29 | `/escolas` com `vw_unidades_localizador` via React Query | Incorporado |
| #30 | `/escolas/:id` com `vw_unidade_detalhe` via React Query, read-only | Incorporado |
| #31 | Dependências essenciais e scaffold inicial de Zod para Fase 2B | Incorporado |
| #33 | Light Mode institucional premium + ThemeToggle | Incorporado |
| #32 | Premium UI Kit + `MaskedInput` | Incorporado |

## Supabase Foundation v1 — encerramento

A Supabase Foundation v1 está formalmente concluída como **migração fundacional**.

Entregas concluídas:

- Supabase próprio operacional.
- Dados reais da planilha BASE importados.
- Views fundacionais criadas e validadas.
- `/escolas` consumindo `vw_unidades_localizador`.
- `/escolas/:id` consumindo `vw_unidade_detalhe`.
- Validação read-only do Supabase concluída para a view de detalhe.
- Dependência operacional do Supabase Lovable superada nas telas principais.

O encerramento da Foundation v1 não significa conclusão do sistema final. Significa que a base real de dados e as telas principais de unidades escolares já operam sobre o Supabase próprio.

Documento de encerramento: `docs/SUPABASE_FOUNDATION_V1_CLOSURE.md`.

## Retorno ao Plano Global v4

As frentes abaixo retornam ao Plano Global v4 e não devem manter a migração Supabase aberta:

| Frente | Estado | Destino lógico |
|---|---|---|
| Dashboard real com `vw_dashboard_basico` | Pendente | Marco 9 / painel analítico |
| Edição cadastral/bancária | Pendente | Fase 2B / governança de dados |
| Importador institucional via interface | Pendente | Marco 10 |
| Motor documental | Pendente | Marco 11 |
| Geração individual real | Pendente | Marco 12 |
| Portal do Diretor funcional | Pendente | Marco 13 |
| Auth/roles/guards/RLS final | Parcial | Marco 6 e Marco 13 |
| Light Mode institucional | Concluído/antecipado | Eixo visual/design system |
| Premium UI Kit / MaskedInput / Zod scaffold | Concluído/antecipado | Preparação Fase 2B/documentos |

## Estado atual das telas principais

- `/escolas`: usa dados reais via `vw_unidades_localizador`.
- `/escolas/:id`: usa dados reais via `vw_unidade_detalhe` e permanece read-only.
- `Dashboard`: ainda requer reconciliação funcional com `vw_dashboard_basico`; há lógica anterior que deve ser revisada no marco analítico.
- `Base/importação`: a carga real foi feita por script administrativo; o importador institucional via interface permanece pendente.
- `DocumentsPanel`/geração: permanece como funcionalidade futura.

## Light Mode e design system

O Light Mode institucional premium foi incorporado. O projeto agora possui alternância de tema com ThemeToggle, preservação do Dark Mode, persistência de preferência e script anti-flash.

Essa entrega foi antecipada em relação ao fluxo funcional e deve ser tratada como evolução do eixo visual/design system, não como pendência de migração Supabase.

## Premium UI Kit e preparação para Fase 2B

Foram incorporados recursos preparatórios para próximas fases, incluindo `MaskedInput` e bibliotecas para máscaras, tabelas, upload e geração PDF. Também houve scaffold inicial de Zod.

Esses recursos não tornam `/escolas/:id` editável ainda. A edição cadastral/bancária deve ser tratada em PR próprio da Fase 2B, com governança de dados e validações.

## RBAC/RLS e segurança

O repositório já contém base de RBAC/RLS em migrations Supabase, com `app_role`, `user_roles`, `has_role()` e políticas básicas.

Pendências permanecem:

- integração efetiva dos papéis reais no frontend;
- guards por perfil;
- revisão humana de segurança;
- definição institucional de permissões por perfil;
- controle de cadastro público;
- revisão de RLS/policies antes de ampliação de uso.

## PRs antigos

- PR #22: superado pelo PR #30.
- PR #7 / PR3B: superado pela reconstrução limpa realizada em PRs menores e deve permanecer apenas como referência histórica até fechamento formal.
- PR #3: requer auditoria separada, pois a documentação/código já indicam presença de Vercel Analytics.

## Próxima ação recomendada

Antes de iniciar implementação funcional, recomenda-se encerrar a reconciliação documental e depois escolher uma frente do Plano Global v4:

1. Dashboard real com `vw_dashboard_basico`;
2. Fase 2B — edição cadastral/bancária;
3. fechamento formal dos PRs antigos superados;
4. importador institucional;
5. auth/roles/guards;
6. motor documental.

Toda nova frente deve seguir `AGENTS.md`: declarar ferramenta líder, objetivo, arquivos a ler, arquivos que pode alterar, arquivos que não deve alterar, critérios de aceite e handoff.
