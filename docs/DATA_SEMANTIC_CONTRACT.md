# Contrato Semântico de Dados
Projeto: PDDE Online 2026
Status: **ATIVO E OBRIGATÓRIO**

## A Regra de Ouro da Identidade Escolar
No sistema PDDE Online, uma unidade escolar possui duas faces de identidade que **JAMAIS devem ser fundidas ou confundidas no banco de dados**.

1. **DESIGNAÇÃO (`designacao`)**
   - É o **código administrativo numérico** (ex: `04.10.001`).
   - Usado como identificador forte (UNIQUE) para *upserts*, pareamentos bancários e planilhas externas do governo.
   - NUNCA exibe o nome humano.

2. **NOME (`nome`)**
   - É o **rótulo humano/oficial** da escola (ex: `EM EMA NEGRÃO DE LIMA`).
   - Usado como título principal nas telas, *breadcrumbs*, listagens e PDFs.
   - Não contém o código administrativo.

### Apresentação Conjunta
Se o frontend precisar apresentar os dois juntos (ex: Select Box), deverá fazer em tempo de exibição ou via View (`vw_unidades_escolares_frontend`), concatenando-os:
`04.10.001 — EM EMA NEGRÃO DE LIMA`.

Isto garante independência, flexibilidade e governança sobre os dados da 4ª CRE.
