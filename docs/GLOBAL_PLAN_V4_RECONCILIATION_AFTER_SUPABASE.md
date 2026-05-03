# PDDE Online 2026 — Reconciliação com o Plano Global v4 após Supabase Foundation v1

Data: 2026-05-02

## 1. Objetivo

Este documento reconcilia o estado atual do projeto com o Plano Global v4 após a conclusão da Supabase Foundation v1.

O objetivo é impedir que a etapa de migração Supabase continue crescendo indefinidamente e recolocar as tarefas remanescentes nos marcos funcionais corretos do Plano Global v4.

## 2. Decisão de governança

A Supabase Foundation v1 foi uma etapa tática para destravar o uso de dados reais.

Ela não substitui o Plano Global v4, não elimina os marcos funcionais posteriores e não transforma toda funcionalidade futura em “migração Supabase”.

A partir deste ponto:

- a migração fundacional está encerrada;
- novas funcionalidades devem ser tratadas dentro do Plano Global v4;
- qualquer tarefa que envolva Supabase deve ser classificada pelo seu objetivo funcional, não apenas pela tecnologia usada.

## 3. O que foi antecipado em relação ao plano

Durante a migração foram antecipadas entregas que não eram estritamente necessárias para encerrar a fundação Supabase, mas que melhoram o produto e preparam fases futuras:

| Entrega antecipada | PR | Eixo do Plano Global v4 |
|---|---:|---|
| Light Mode institucional premium | #33 | Design system / refinamento visual |
| ThemeToggle e persistência de tema | #33 | UX global |
| Premium UI Kit e MaskedInput | #32 | Preparação para formulários e documentos |
| Scaffold inicial de Zod | #31 | Preparação para Fase 2B |

Essas entregas devem ser mantidas, documentadas e consideradas ativos do projeto.

## 4. Pendências realocadas

| Pendência | Não é mais bloqueio da migração? | Marco/Frente correta |
|---|---:|---|
| Dashboard real com `vw_dashboard_basico` | Sim | Marco 9 / painel analítico |
| Edição cadastral/bancária | Sim | Fase 2B / governança de dados |
| Importador institucional via interface | Sim | Marco 10 |
| Motor documental | Sim | Marco 11 |
| Geração individual real | Sim | Marco 12 |
| Portal do Diretor funcional | Sim | Marco 13 |
| Auth/roles/guards/RLS final | Sim | Marco 6 e Marco 13 |
| Upload de comprovantes/notas fiscais | Sim | Marcos documental/importação |
| Lote/ZIP/Cloud Run opcional | Sim | Marco 15 |

## 5. Classificação das próximas frentes

### 5.1. Dashboard real

Objetivo: substituir a lógica anterior do Dashboard por leitura consistente de `vw_dashboard_basico` e, se necessário, novas views analíticas.

Não deve ser tratado como “continuação da migração”, mas como frente de BI/painel analítico.

### 5.2. Fase 2B — edição cadastral/bancária

Objetivo: transformar a ficha read-only da unidade em formulário controlado, com validação e salvamento seguro.

Premissas já disponíveis:

- `MaskedInput` criado;
- Zod scaffold iniciado;
- React Hook Form disponível;
- página `/escolas/:id` já lê `vw_unidade_detalhe`.

Decisões ainda necessárias:

- quais campos serão editáveis;
- onde gravar dados bancários: `unidades_escolares`, `contas_bancarias` ou fluxo combinado;
- quais perfis podem editar;
- como registrar auditoria;
- como tratar divergência entre dado importado e dado corrigido manualmente.

### 5.3. Importador institucional

Objetivo: substituir o uso administrativo local do script por uma experiência controlada de upload, validação, prévia, confirmação e log.

A carga inicial por script cumpriu sua função. O importador via interface pertence ao Marco 10.

### 5.4. Motor documental e geração individual

Objetivo: transformar o `DocumentsPanel` e os botões de geração em fluxo real de documentos.

Pertence aos Marcos 11 e 12. Não é pendência da Foundation v1.

### 5.5. Portal do Diretor

Objetivo: criar experiência funcional para perfis externos/institucionais, com vínculo diretor-escola e escopo de acesso.

Pertence ao Marco 13 e depende de auth/roles/guards.

### 5.6. Auth/roles/guards/RLS

Objetivo: concluir a integração entre RBAC/RLS existente no banco, frontend e fluxos de acesso.

É frente crítica com revisão humana obrigatória, conforme `AGENTS.md`.

## 6. Documentos históricos superados

Os documentos abaixo continuam úteis como registro histórico, mas não devem orientar a próxima execução sem leitura deste documento:

- `docs/CURRENT_STATUS_AFTER_PRODUCTION_RECOVERY_2026-04-29.md`;
- `docs/PR3B_RECONCILIATION_AFTER_PRODUCTION_RECOVERY_2026-04-29.md`.

Ambos foram escritos antes dos PRs #27, #29, #30, #31, #32 e #33.

## 7. PRs antigos

- **PR #22**: deve ser fechado como superado pelo PR #30.
- **PR #7**: deve ser fechado ou preservado apenas como referência histórica, pois a reconstrução limpa já avançou por PRs menores e incorporados.
- **PR #3**: deve ser auditado separadamente antes de decisão, porque há indícios de que Analytics já foi incorporado/registrado.

## 8. Critério de retorno ao Plano Global v4

O retorno ao Plano Global v4 se dá quando:

- Supabase Foundation v1 está declarada concluída;
- o estado atual do projeto está registrado em `PROJECT_STATE.md`;
- as pendências foram realocadas para os marcos corretos;
- PRs históricos superados foram identificados;
- a próxima frente for escolhida com escopo próprio.

## 9. Próxima decisão recomendada

Escolher uma das frentes abaixo, em PR separado e com escopo fechado:

1. fechar PRs antigos superados (#22 e #7);
2. Dashboard real com `vw_dashboard_basico`;
3. Fase 2B — edição cadastral/bancária;
4. importador institucional via interface;
5. auth/roles/guards;
6. motor documental.

Recomendação operacional: fechar/arquivar PRs superados antes de iniciar a próxima frente funcional, para reduzir ruído entre ferramentas.
