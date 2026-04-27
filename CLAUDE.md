# Instruções para Claude / Agentes CLI (CLAUDE.md)
Ao atuar neste projeto, LEIA AS DIRETRIZES DE ALTO PADRÃO:

1. **NUNCA auto-aprove execuções destrutivas.** Apresente o diff e espere a confirmação humana.
2. **Respeite o Contrato Semântico:** Leia `docs/DATA_SEMANTIC_CONTRACT.md`. Não funda "Nome" com "Designacao".
3. **Padrão Estético Premium:** Se tocar no frontend, use Tailwind de forma harmônica, preserve o glassmorphism, dark mode e as transições nativas. Não gere lixo web genérico.
4. **Segurança (RLS):** Qualquer tabela nova exposta no Supabase deve nascer com Row Level Security ativo e Policies desenhadas por papéis (app_role).
