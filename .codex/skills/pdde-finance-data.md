# Skill: pdde-finance-data

Use para dados financeiros, BASE.xlsx, escolas, INEP, CNPJ, saldos, parcelas, demonstrativos e prestacao de contas.

Regras:

- Inventariar fonte e contrato antes de alterar codigo.
- Preservar rastreabilidade entre dado Supabase, dado de planilha e artefato gerado.
- Nao inventar regra financeira.
- Para Demonstrativo Basico Individual, seguir a decisao vigente: preencher `MEMORIA` diretamente com dados do Supabase.
- O arquivo individual nao deve depender da aba `BASE` nem de `XLOOKUP`.

