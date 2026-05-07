# Workflow: ui-polish-safe

Use para polimento visual seguro.

1. Confirmar que a tarefa e visual e nao muda contrato de dados.
2. Ler `docs/UI_CHANGELOG.md`.
3. Preservar Dark Mode e Light Mode institucionais.
4. Evitar redesign global sem decisao explicita.
5. Alterar apenas os componentes/telas autorizados.
6. Rodar `npx tsc --noEmit`, `npm run lint` e `npm run build` quando houver codigo.
7. Fazer smoke visual quando a mudanca afetar tela.
8. Registrar mudanca relevante em `docs/UI_CHANGELOG.md`.

