# Registro de Decisões de Arquitetura (DECISIONS_LOG)

| Decisão | Resultado Prático | Motivação | Data |
| :--- | :--- | :--- | :--- |
| **D1** — Lovable não será referência de banco | Apenas referência visual e laboratório de UX. | Falhas semânticas no schema gerado na expansão inicial. | Abril 2026 |
| **D2** — DESIGNAÇÃO e NOME distintos | `designacao` (código), `nome` (rótulo). | Adesão total à semântica da BASE governamental SME-RJ. | Abril 2026 |
| **D3** — Supabase próprio com schema semântico | Não replicar schema "protótipo" em produção. | Necessidade de controle estrito via Migrations (IaC) e RLS. | Abril 2026 |
| **D4** — Produção *read-mostly* na v2.2 | Inibição de botões destrutivos até estabilização. | Evitar danos enquanto as migrações e auditorias ocorrem. | Abril 2026 |
| **D5** — ETL Centralizado em Script Local | Criação de script Python/Node local para importação. | Evitar sobrecarga do browser e exposição de lógica no client. | Abril 2026 |
