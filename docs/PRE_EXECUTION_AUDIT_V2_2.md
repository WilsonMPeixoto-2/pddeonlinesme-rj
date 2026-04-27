# Auditoria Técnica Pré-Execução (G0)
Projeto: PDDE Online 2026
Alvo: Plano de Migração Supabase Próprio v2.2

## 1. Achados Confirmados no Repositório (Dívida Técnica Atual)
A análise dos arquivos do repositório em `v0.1.1-lovable-expanded-prototype` confirma os seguintes passivos estruturais:

| Achado | Evidência no Repositório | Consequência |
| :--- | :--- | :--- |
| `useExercicio` é apenas `useState("2026")` | `src/hooks/useExercicio.tsx` | Precisa persistir em `localStorage` e orientar todas as *queries*. |
| `Escolas.tsx` busca direto na tabela | `src/pages/Escolas.tsx` | PR 3 deve migrar para `vw_unidades_escolares_frontend` e filtrar por exercício. |
| `Dashboard.tsx` soma campos legados direto | `src/pages/Dashboard.tsx` | PR 3 deve usar a *View* com agregados processados pelo Postgres. |
| `baseImporter.ts` ignora a coluna NOME | `src/lib/baseImporter.ts` | Reforça a urgência da correção semântica proposta no V2.2. |
| `import_logs` lido por qualquer autenticado | `20260427004801_...sql` | Exige política (RLS) mais restritiva no novo Supabase. |
| Migration antiga permite DELETE por admin | Migrations iniciais | Risco crítico. O novo schema deve usar `ativo=false` (Soft Delete) e FK `ON DELETE RESTRICT`. |
| `QueryClient` globalmente configurado | `src/App.tsx` | As *Query Keys* do React Query precisarão incluir a variável `exercicio`. |

## 2. Riscos Mapeados e Mitigações

### A. Risco de Falso Negativo (View vs LEFT JOIN)
A *view* `vw_unidades_escolares_frontend` pode ocultar escolas se o frontend filtrar por `.eq('exercicio', 2026)` e a escola não tiver registro financeiro criado.
**Mitigação:** O script de ETL (Python/Node) deverá obrigatoriamente criar uma linha inicializada para cada escola na tabela `execucao_financeira` do ano base, mesmo com R$ 0,00.

### B. Risco de Perda Histórica (ON DELETE CASCADE)
**Mitigação:** Fica expressamente proibido o uso de `ON DELETE CASCADE` na FK da tabela `execucao_financeira`, `documentos_gerados` ou logs. O projeto adotará o uso da flag booleana `ativo` para Soft Delete.

### C. Risco de Cache Misturado (React Query)
O uso do TanStack Query exige governança sobre a revalidação.
**Mitigação:** O PR 3 deve assegurar que toda consulta de dados adicione a variável `exercicio` à sua *Query Key* (ex: `['escolas', exercicio]`).

## 3. Emendas ao Plano v2.2 (Decisões G0)
*   **E1 — Inicialização obrigatória:** Todo import de escola inicializa o ano financeiro vigente zerado.
*   **E2 — Proibição de CASCADE:** Proteção do histórico via `ON DELETE RESTRICT`.
*   **E3 — Query Keys Reativas:** O frontend invalidará cache ao trocar o exercício.
*   **E4 — View Segura:** Teste de integridade contra desaparecimento de escolas.
*   **E5 — Testes de Integridade no PR 2:** O relatório final do PR 2 deve provar que não há entidades órfãs.

## 4. Checklist Obrigatório para PR 2
- [ ] Schema `unidades_escolares` com `nome` e `designacao` separados.
- [ ] Schema `execucao_financeira` com `unidade_id` -> `ON DELETE RESTRICT`.
- [ ] Script Python garante injeção de linha em `execucao_financeira` para cada inserção no cadastro.
- [ ] Supabase CLI gera tipos limpos e sem conflito de CASCADE.
- [ ] Gerar arquivo `import_report.md` atestando integridade (zero escolas ausentes do ano base).

## 5. Checklist Obrigatório para PR 3
- [ ] Hook `useExercicio` lê e grava em `localStorage`.
- [ ] React Query usa `exercicio` nas chaves (`['escolas', exercicio]`).
- [ ] `Dashboard.tsx` refatorado para consumir dados agregados da *View*.
- [ ] O rótulo da UI de escolas prioriza `nome` sobre `designacao`.
