# Agentes e Políticas de IA (AGENTS.md)
Este repositório é governado por um modelo "Multi-Agente" liderado por uma Diretriz de Alto Padrão (Veto de Auto-Execução).

### Papéis Definidos
1. **Antigravity (Gemini 3.1 Pro) / Claude Opus 4.7 (CLI):** Arquitetos Principais e Executores de Engenharia. Responsáveis pelo banco de dados (Supabase), scripts ETL (Python) e documentação estrutural.
2. **Cursor IDE / Claude Opus:** Agentes de Cirurgia Frontend. Alteram React/Tailwind respeitando as premissas de UI/UX.
3. **Lovable / v0:** Laboratórios de UI. Proibidos de alterar lógica de banco, integrações de ETL ou rotas sensíveis em produção. Restritos a geração de design visual.
4. **Humano (Diretor/PO):** Gatekeeper. Nenhum agente tem permissão para realizar commits automáticos ou merge/push destrutivo sem consentimento humano expresso no log de chat.
