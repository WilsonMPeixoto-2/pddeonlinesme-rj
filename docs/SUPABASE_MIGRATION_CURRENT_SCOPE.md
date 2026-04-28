# PDDE Online 2026 — Escopo atual da migração para Supabase próprio

Data: 28/04/2026

## 1. Finalidade

Este documento delimita o escopo corrente do parêntese técnico de migração para Supabase próprio, aberto dentro do Plano Global v4.

Ele evita que a migração se transforme em um segundo plano paralelo ou absorva tarefas que pertencem ao curso natural do Plano Global v4.

## 2. Decisão central

A migração para Supabase próprio será executada como **Clean Start revisado**:

- o projeto Supabase será novo, limpo e próprio;
- as migrations já existentes no repositório serão revisadas antes de aplicação;
- o schema será compatibilizado com o contrato real do frontend;
- a importação das 163 unidades ocorrerá somente após validação do parser e das regras de dados;
- a produção só será alterada após Preview aprovado e revisão humana de segurança.

## 3. Relação com o Plano Global v4

A migração Supabase corresponde ao parêntese técnico atualmente aberto dentro do Plano Global v4, com impacto nos seguintes marcos:

| Marco v4 | Relação com este escopo |
|---|---|
| Marco 0 | Governança, memória operacional e documentação de continuidade. |
| Marco 2 | Saneamento pré-estrutural: resíduos Lovable e rebaixamento de ZIP/lote. |
| Marco 4 | Validação técnica local: build, typecheck, lint, testes e Preview. |
| Marco 6 | Supabase Clean Start e segurança mínima. |
| Marco 10 | Importação real da BASE.xlsx, parcialmente antecipada. |
| Marco 14 | Hardening parcial antes de produção com dados reais. |

## 4. O que entra no escopo atual

Entram no parêntese Supabase:

1. Criar `docs/CURRENT_GITHUB_AUDIT_2026-04-28.md`.
2. Criar `docs/FRONTEND_DATA_CONTRACT.md`.
3. Revisar todas as migrations Supabase já existentes.
4. Decidir o tratamento de:
   - `designacao`;
   - código da unidade;
   - nome da escola;
   - `programa`;
   - `alunos`;
   - saldos;
   - parcelas;
   - `import_logs`;
   - campos bancários e de localização.
5. Validar o importador atual de `BASE.xlsx`.
6. Revisar e aplicar migrations no Supabase próprio limpo.
7. Gerar types Supabase atualizados.
8. Conectar o frontend ao Supabase próprio em Vercel Preview.
9. Importar e validar as 163 unidades escolares.
10. Validar Dashboard, Escolas, EscolaEditar, Base, filtros e autenticação.
11. Sanear resíduos Lovable antes de Preview/produção institucional.
12. Rebaixar ZIP/lote antes da validação do MVP.
13. Realizar revisão humana de segurança antes de produção.
14. Promover produção somente após checklist aprovado.

## 5. O que não entra no escopo atual

Não entram agora, salvo autorização expressa:

- monorepo;
- backend Fastify;
- migração completa do frontend para API;
- Cloud Run;
- worker de lote;
- motor documental completo;
- geração individual real dos seis documentos;
- Portal do Diretor funcional completo;
- vínculo diretor-escola em produção;
- ZIP/lote real;
- dashboards avançados;
- refatoração ampla de arquitetura.

Esses itens retornam ao Plano Global v4 após fechamento do parêntese Supabase.

## 6. Gates internos da migração

| Gate | Quando | Critério de aceite |
|---|---|---|
| Gate 1 — Estado real | Antes de novas mudanças estruturais. | Auditoria do GitHub registrada. |
| Gate 2 — Contrato de dados | Antes de novas migrations. | `FRONTEND_DATA_CONTRACT.md` criado e coerente com o código real. |
| Gate 3 — SQL | Antes de aplicar no Supabase próprio. | Migrations revisadas, sem DROP perigoso e sem regra improvisada. |
| Gate 4 — Dados | Antes de importar 163 unidades. | Parser validado; campos críticos preservados como texto; regra de upsert aprovada. |
| Gate 5 — MVP | Antes de Preview institucional. | Resíduos Lovable saneados; ZIP/lote rebaixado; build/typecheck/lint ok. |
| Gate 6 — Segurança | Antes de produção. | Roles, RLS, cadastro e policies revisados por humano. |
| Gate 7 — Produção | Antes do merge final. | Preview validado visual e funcionalmente. |

## 7. Sequência operacional atualizada

1. Reconciliar o estado real do GitHub.
2. Criar o contrato real de dados do frontend.
3. Revisar migrations existentes.
4. Definir ajustes do schema alvo.
5. Sanear resíduos Lovable.
6. Rebaixar ZIP/lote para coerência do MVP.
7. Criar Supabase próprio limpo.
8. Aplicar migrations revisadas.
9. Gerar types.
10. Conectar Vercel Preview.
11. Importar e validar 163 unidades.
12. Validar fluxo principal.
13. Revisar segurança.
14. Promover produção.
15. Documentar fechamento e retorno ao Plano Global v4.

## 8. Prompt obrigatório para ferramentas executoras

Todo prompt relacionado a este escopo deve conter, no mínimo:

```txt
Esta tarefa pertence ao parêntese atual de migração para Supabase próprio.
Ela não inaugura novo plano paralelo.
Ela deve preservar compatibilidade com o Plano Global v4 e com o estado real do GitHub.
Não antecipar monorepo, Fastify, motor documental, Portal do Diretor funcional ou ZIP/lote real, salvo necessidade estrita da migração.
```

Também deve exigir leitura prévia de:

- `AGENTS.md`;
- `docs/PROJECT_STATE.md`;
- `docs/DECISIONS_LOG.md`;
- `docs/UI_CHANGELOG.md`;
- `docs/PLAN_V4_REALITY_ALIGNMENT.md`;
- `docs/FRONTEND_DATA_CONTRACT.md` (quando existir);
- `docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md`.

## 9. Handoff obrigatório

Ao final de qualquer tarefa deste escopo, a ferramenta executora deve informar:

- classificação da tarefa;
- arquivos lidos;
- arquivos alterados;
- comandos executados;
- validações realizadas;
- concluído;
- pendente;
- bloqueado;
- riscos;
- próximo passo recomendado.

## 10. Critério de fechamento do parêntese Supabase

O parêntese Supabase será considerado fechado quando:

- o Supabase próprio estiver criado e com migrations revisadas;
- as 163 unidades estiverem importadas e validadas;
- o frontend estiver conectado ao Supabase próprio;
- Preview e produção estiverem funcionando;
- papéis/RLS/cadastro tiverem revisão humana;
- o MVP estiver coerente com geração individual, sem ZIP/lote como ação principal;
- a documentação de fechamento estiver atualizada.

Após isso, o projeto retorna ao curso natural do Plano Global v4.
