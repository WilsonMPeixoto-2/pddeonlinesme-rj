# Política de Ferramental (TOOLING_POLICY.md)
Consolidação das ferramentas utilizadas na fase V2.2 em diante.

- **Frontend:** React, Vite, TailwindCSS (preservando estética Lovable).
- **Backend / DB:** Supabase hospedado, PostgreSQL.
- **ORM / Types:** Supabase-JS com Typescript Types gerados pela CLI oficial.
- **Importação/Carga (ETL):** Scripts backend locais (Python ou Node.js scripts). **PROIBIDO** o uso de importadores `.xlsx` no frontend em produção para a carga massiva da BASE.
- **Geração de UI Opcional:** Lovable. Exportar o código visual e integrar manualmente.
