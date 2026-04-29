# Backlog Pós-PR3B

Este documento registra sugestões arquiteturais, visuais e operacionais levantadas durante o desenvolvimento do PR 3B. Nenhuma destas tarefas deve bloquear o fluxo crítico atual (PR 4 - Cutover Remoto). Elas são registradas para implementação futura, de forma modular e apartada.

## 1. Experiência de Usuário (UX/UI) e Estética Premium
*   **Design Tokens (Charcoal/Âmbar):** Criar branch própria para implementar a paleta "Midnight Slate" e acentos institucionais.
*   **Framer Motion / Microinterações:** Avaliar e aplicar microinterações em botões e navegação, apenas no ciclo pós-cutover.
*   **Unificação de Toasts:** Padronizar uso do `Sonner` contra o `Toaster` do Shadcn, focando em apenas um provedor global se possível.

## 2. Arquitetura e Engenharia de Frontend
*   **Camada de Dados (DAL) e Hooks:** Refatoração incremental tela a tela, consolidando a lógica de fetching (TanStack Query) fora dos componentes visuais.
*   **Virtualização:** Reaplicar técnicas de virtualização (como `@tanstack/react-virtual`) em tabelas **apenas se** os testes de performance com dados reais em produção justificarem. O PR 3B removeu a virtualização redundante.
*   **Busca Ampliada:** Consolidar a busca global do cabeçalho integrando-a corretamente com a view do Supabase.
*   **Realtime e WebSocket:** Considerar a ativação do Supabase Realtime para painéis de monitoramento, **após** o cutover.
*   **Roteamento Avançado:** A migração para `TanStack Router` foi rejeitada nesta fase. O `react-router-dom` existente supre a necessidade.
*   **Gerenciamento de Estado Global:** A introdução do `Zustand` foi considerada desnecessária no momento, visto que a combinação React Context + TanStack Query atende.

## 3. Segurança e Infraestrutura Operacional
*   **Higiene de `.env`:** Criar um PR de segurança separado focado exclusivamente em higienizar `.env` vazados no histórico da `main`.
*   **Melhoria em Import Logs:** Ajustar o script oficial para que a coluna `filename` em `import_logs` grave apenas o `basename` do arquivo auditado (ex: `BASE.xlsx`), e não o caminho absoluto do script local.
