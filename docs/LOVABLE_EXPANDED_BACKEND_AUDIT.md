# Auditoria do Backend Expandido (Lovable)
Data: Abril de 2026
Alvo: Commits até `v0.1.1-lovable-expanded-prototype`

## Problemas Identificados (Dívida Técnica Semântica)
O protótipo gerado pelo Lovable apresentou falhas estruturais graves ao expandir o modelo de dados para acomodar a planilha BASE.

1. **Fusão de DESIGNAÇÃO e NOME:**
   - O campo `designacao` passou a englobar tanto o código administrativo (04.10.001) quanto o nome humano da escola.
   - Isso viola a normalização de dados e impede pesquisas/filtros independentes.
2. **Acoplamento Financeiro em Cadastro:**
   - Colunas como `parcela_1_custeio` foram injetadas diretamente na tabela `unidades_escolares`.
   - Viola a Terceira Forma Normal (3NF) e impede que a plataforma armazene dados de execução para 2025, 2026 e 2027 na mesma escola.
3. **Importador via Frontend:**
   - O fluxo de ETL (criação de `baseImporter.ts`) foi delegado ao ambiente cliente (Vercel/Browser), sobrecarregando o bundle e operando de forma não segura, contornando rotinas robustas de validação.

## Diretriz de Correção
O código gerado neste protótipo deve ser descartado no que tange ao banco de dados e fluxos de inserção. A interface gráfica (UI/UX) deve ser preservada, mas o "binding" será refeito para apontar para a nova arquitetura do Plano v2.2.
