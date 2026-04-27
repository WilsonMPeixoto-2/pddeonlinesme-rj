# Plano de Migra√ß√£o Supabase Pr√≥prio v2.2

## Sum√°rio
Corre√ß√£o Sem√¢ntica da BASE e Adapta√ß√£o Controlada do Frontend (PDDE Online 2026)

## Decis√£o-m√£e do plano
A migra√ß√£o para o Supabase pr√≥prio n√£o replicar√° a confus√£o sem√¢ntica produzida no prot√≥tipo Lovable. A BASE oficial define a sem√¢ntica: DESIGNA√á√ÉO ser√° preservada como designacao (c√≥digo), NOME ser√° preservado como nome. O frontend ser√° adaptado de forma controlada para consumir essa sem√¢ntica correta.

*(Ver detalhes da modelagem e regras nos documentos irm√£os na pasta docs/: `DATA_SEMANTIC_CONTRACT.md`, `SCHEMA_MAPPING.md`, `LOVABLE_EXPANDED_BACKEND_AUDIT.md` e `DECISIONS_LOG.md`)*

## Gates Obrigat√≥rios
* **G1 ‚Äî Governan√ßa**: Claude Code formalizado; .env saneado; Lovable auditado; contratos aprovados.
* **G2 ‚Äî Supabase pr√≥prio**: Projeto criado; segredos protegidos; usu√°rio admin criado; Auth/Roles aplicados.
* **G3 ‚Äî Schema**: Migrations aplicadas; RLS validada; views criadas; types regenerados.
* **G4 ‚Äî Importa√ß√£o**: BASE importada; designacao e nome preservados; relat√≥rio gerado.
* **G5 ‚Äî Preview**: Vercel Preview validado no Dashboard, Escolas, Base.
* **G6 ‚Äî Produ√ß√£o**: Deploy da Produ√ß√£o Vercel.


## Emendas ObrigatÛrias de Integridade (PÛs-Auditoria G0)

* **E1 ó InicializaÁ„o obrigatÛria de execucao_financeira:** Para toda unidade importada, criar/atualizar linha em execucao_financeira para o exercÌcio/programa correspondente, ainda que os valores sejam zero.
* **E2 ó ProibiÁ„o de cascade histÛrico:** N„o usar ON DELETE CASCADE em execucao_financeira, documentos_gerados ou logs. A exclus„o ser· por ativo=false e a FK usar· ON DELETE RESTRICT.
* **E3 ó Query keys sensÌveis ao exercÌcio:** Toda query baseada em exercÌcio deve incluir exercicio na query key quando usar React Query.
* **E4 ó View segura contra falso negativo:** A view deve ser testada para n„o ocultar escolas acidentalmente.
* **E5 ó Testes mÌnimos de integridade:** O PR 2 deve atestar no relatÛrio a inexistÍncia de exclusıes Ûrf„s ou cascateamento.
