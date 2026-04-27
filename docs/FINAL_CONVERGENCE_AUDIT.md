# Auditoria Final de Convergência — PDDE Online 2026

## Veredito executivo

O projeto está **apto a prosseguir para o PR 1**, mas **não está apto a criar o Supabase próprio, importar dados ou fazer cutover sem incorporar os controles obrigatórios abaixo**.

Classificação final:

```txt
Arquitetura central: APROVADA.
PR 1 — Governança/documentação: APTO.
PR 2 — Schema/importação: APTO COM CONTROLES OBRIGATÓRIOS.
PR 3 — Frontend/cutover: APTO COM CONTROLES OBRIGATÓRIOS.
Produção: BLOQUEADA até validação de RLS, importação, view, exercício e frontend.
```

A decisão central permanece correta e **não será reaberta**:

```txt
DESIGNAÇÃO → designacao
NOME       → nome
Lovable    → referência visual/UX
Supabase próprio → fonte semântica correta
```

A partir desta auditoria, novos achados só devem entrar em uma de três classes: **bloqueador**, **controle obrigatório** ou **backlog**.

---

# 1. Escopo da auditoria realizada

A auditoria analisou o núcleo crítico do repositório atual:

```txt
src/hooks/useExercicio.tsx
src/App.tsx
src/pages/Dashboard.tsx
src/pages/Escolas.tsx
src/pages/EscolaEditar.tsx
src/pages/Base.tsx
src/pages/PortalDiretor.tsx
src/components/DocumentsPanel.tsx
src/hooks/useAuth.ts
src/components/ProtectedRoute.tsx
src/lib/baseImporter.ts
supabase/migrations/*.sql
```

Também confrontei o projeto com documentação técnica oficial sobre Supabase migrations, RLS, views, delete/cascade e TanStack Query.

A documentação do Supabase trata migrations como forma de versionar alterações de banco ao longo do tempo, com reset local e deploy controlado por `db push`; isso confirma que o novo Supabase deve nascer por migrations versionadas, e não por alterações manuais soltas no painel.

---

# 2. Achados classificados como OK

## OK-01 — Decisão semântica central
A separação entre `designacao` e `nome` está correta e deve ser mantida.
O importador atual do Lovable faz o contrário: ignora `NOME` como campo próprio. Isso confirma que a decisão de **não copiar o schema do Lovable** é correta. 

## OK-02 — Criação de `execucao_financeira` separada
A separação entre cadastro da escola e execução financeira está correta. A migração para tabela separada não é opcional; ela é necessária para o modelo multi-exercício.

## OK-03 — Necessidade de views de frontend
A criação de `vw_unidades_escolares_frontend` e `vw_unidades_status` permanece correta. Devem ser usadas com `security_invoker = true`.

## OK-04 — `document_types` e `documentos_gerados` mínimos
A inclusão dessas tabelas já na primeira modelagem mínima está correta para substituir mock por dado real vazio.

---

# 3. Bloqueadores

## BLQ-01 — O importador atual do Lovable não pode ser usado como importador oficial
**Decisão:** criar importador novo, controlado, que preserve: `DESIGNAÇÃO → designacao` e `NOME → nome`.

## BLQ-02 — O frontend atual ainda usa `designacao` como nome da escola
**Decisão:** PR 3 deve refatorar a identidade visual da unidade: `nome` = rótulo principal.

## BLQ-03 — O modelo atual não possui `execucao_financeira`; há risco de falso negativo na view futura
**Decisão obrigatória:** o importador oficial deve criar ou atualizar uma linha em `execucao_financeira` para toda unidade válida importada.

## BLQ-04 — Política de exclusão física é inadequada para prestação de contas
**Decisão obrigatória:** Não usar ON DELETE CASCADE em histórico. Usar ativo = false para desativação lógica. Usar FK restritiva.

## BLQ-05 — RLS/autorização ainda é insuficiente para produção
**Decisão obrigatória:** PR 2 deve criar RLS por menor privilégio.

---

# 4. Controles obrigatórios por PR

## PR 1 — Governança, documentação e auditoria
| ID   | Controle | Classificação |
| ---- | --- | --- |
| C1.1 | Criar `docs/FINAL_CONVERGENCE_AUDIT.md` com esta auditoria | Obrigatório |
| C1.2 | Atualizar `docs/MIGRATION_PLAN_FINAL.md` anexando controles | Obrigatório |
| C1.3 | Criar `DATA_SEMANTIC_CONTRACT.md` (`DESIGNAÇÃO → designacao`) | Obrigatório |
| C1.4 | Criar `SCHEMA_MAPPING.md` com mapeamento da BASE | Obrigatório |
| C1.5 | Registrar Lovable como referência visual | Obrigatório |
| C1.6 | Sanear `.env`, criar `.env.example` e proteger no `.gitignore` | Obrigatório |
| C1.7 | Registrar que `baseImporter.ts` atual é protótipo | Obrigatório |

## PR 2 — Supabase próprio, schema, RLS e importação controlada
| ID    | Controle | Justificativa |
| ----- | --- | --- |
| C2.1  | Criar `unidades_escolares` com `designacao` e `nome` separados | Corrige erro semântico |
| C2.2  | Criar `execucao_financeira` por `unidade_id + exercicio + programa` | Permite multi-exercício |
| C2.3  | Importador cria linha em `execucao_financeira` para toda unidade válida | Evita falso negativo |
| C2.4  | Não usar `ON DELETE CASCADE` em tabelas históricas | Evita perda de histórico |
| C2.5  | Usar `ativo = false` para desativação de escola | Preserva rastreabilidade |
| C2.6  | Criar `document_types` e `documentos_gerados` mínimos | Substitui mock documental |
| C2.7  | Criar `import_logs` com RLS restritiva | Histórico administrativo |
| C2.8  | Criar `profiles`, `user_roles`, `app_role`, `has_role()` | Supabase novo nasce vazio |
| C2.9  | Incluir `diretor` como papel reservado, sem ativar Portal real | Evita retrabalho futuro |
| C2.10 | Criar views com `security_invoker = true` | Evita bypass de RLS |
| C2.11 | Regenerar `types.ts` após migrations | Evita divergência código/banco |
| C2.12 | Testar migrations com `supabase db reset` local | Garante estado reproduzível |

## PR 3 — Frontend adaptado ao schema correto
| ID    | Controle | Justificativa |
| ----- | --- | --- |
| C3.1  | `/escolas` usa `nome` principal e `designacao` secundário | Corrige UX |
| C3.2  | Dashboard usa view/agregados por exercício | Evita soma legacy |
| C3.3  | EscolaEditar separa campo `nome` e campo `designacao` | Evita confusão cadastral |
| C3.4  | DocumentsPanel recebe `nome`, `designacao`, `unidade_id` e `exercicio` | Prepara documentos reais |
| C3.5  | PortalDiretor marcado como wireframe | Evita falsa operacionalidade |
| C3.6  | `useExercicio` persiste em `localStorage` | Evita reset visual |
| C3.7  | Queries filtram por `exercicio` | Evita dado de ano errado |
| C3.8  | Se usar React Query, `exercicio` entra na `queryKey` | Evita cache incorreto |
| C3.9  | `getPrograma` fake bloqueado para produção | Evita filtro falso |
| C3.10 | `getDocMeta` fake substituído por `documentos_gerados` | Evita contagem inventada |

---

# 5. Matriz final de classificação
* **Arquitetura designacao/nome:** Mantida.
* **Lovable como referência visual:** Mantido.
* **Lovable como referência de schema:** Rejeitado.
* **Importador baseImporter.ts:** Não usar como oficial.
* **Criação de execucao_financeira:** PR 2.
* **Linha financeira inicial para toda unidade:** PR 2.
* **ON DELETE CASCADE em histórico:** Proibido.
* **ativo=false:** PR 2.
* **RLS ampla para produção:** Corrigir.
* **import_logs lido por qualquer autenticado:** Restringir.
* **useExercicio com persistência/Query Cache:** PR 3.

**Veredito:** APTO COM CONTROLES OBRIGATÓRIOS. Nenhuma nova análise estrutural é permitida.
