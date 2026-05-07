# Workflow: review-pr

Use para revisar PRs abertos.

1. Consultar `gh pr view` e `gh pr checks`.
2. Classificar evidencia como GitHub remoto, workspace local, logs de ferramenta, hipotese ou pendencia.
3. Ler o diff completo.
4. Priorizar bugs, regressao, seguranca, regras financeiras/documentais, RLS/auth e ausencia de validacao.
5. Separar achados bloqueantes de melhorias.
6. Nao alterar codigo durante review sem solicitacao explicita.
7. Registrar conclusao em `docs/HANDOFF.md` quando a revisao mudar a proxima acao.

