# Auditoria Técnica Pré-Execução (G0) - Revisão Expandida
Projeto: PDDE Online 2026
Alvo: Plano de Migração Supabase Próprio v2.2.1

## 1. Achados Confirmados no Repositório (Dívida Técnica Atual)

| Achado | Evidência no Repositório | Consequência |
| :--- | :--- | :--- |
| `useExercicio` é apenas visual (`useState`) | `src/hooks/useExercicio.tsx` | Precisa persistir em `localStorage` e orientar todas as queries reais. |
| Falso Negativo na View | Modelo separado sem sincronia | A view pode ocultar escolas se a execução financeira for nula no ano. |
| ON DELETE CASCADE perigoso | Migrations antigas | Risco de apagar histórico financeiro ao apagar uma escola. |
| `baseImporter.ts` obsoleto | `src/lib/baseImporter.ts` | Concatena Designação e Nome. Não serve para a carga oficial. |
| O campo `nome` não existe no frontend | `Escolas.tsx`, `Dashboard.tsx` | Refatoração estrutural necessária nas telas para trocar `designacao` por `nome`. |
| Autorização frágil | `ProtectedRoute.tsx`, `migrations` | `useAuth` checa sessão mas não checa *roles* para rotas restritas. |
| `import_logs` público | Migration 20260427004801 | Qualquer autenticado lê logs. Precisamos restringir via RLS. |
| `documentos_gerados` ausente | Frontend (mockado por ID) | Reforça a necessidade de criar a tabela na migration inicial. |
| Frontend fazendo ETL real | `Base.tsx` | Carga massiva sendo feita pelo browser usando chaves públicas. Inadmissível. |

## 2. Emendas Técnicas Obrigatórias (E1 a E10)
O plano original evolui para **v2.2.1** com as seguintes garantias blindadas:

*   **E1 — Inicialização obrigatória:** Toda unidade importada gera linha zerada em `execucao_financeira`.
*   **E2 — View protegida:** `vw_unidades_escolares_frontend` não ocultará unidades ativas por falha de JOIN.
*   **E3 — Proibição de CASCADE:** A exclusão será via `ativo=false`. FKs usam `ON DELETE RESTRICT`.
*   **E4 — `useExercicio` persistente:** Persistir no `localStorage` e incluir nas *Query Keys*.
*   **E5 — Refatoração de Identidade:** Trocar uso visual de `designacao` por `nome` nas telas.
*   **E6 — Importador Oficial Novo:** O `baseImporter.ts` do frontend é descartado em prol do script Python.
*   **E7 — RLS / Roles Estritos:** Políticas de banco e rotas React protegidas por privilégio mínimo.
*   **E8 — `import_logs` restrito:** Apenas `admin` e `operador` podem ler histórico de importações.
*   **E9 — Documentos mínimos:** Estrutura de `document_types` e `documentos_gerados` inserida no schema inicial.
*   **E10 — Testes de Aceite:** O PR 2 atestará o total de unidades e bloqueio de exclusões físicas.
