# Contrato Financeiro PDDE v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Endurecer o contrato financeiro, separar cadastro escolar de contas bancárias e preparar leitura tipada da nova camada financeira.

**Architecture:** O banco passa a proteger coerência entre repasse, unidade, programa e carga de origem. O frontend mantém cadastro escolar separado de bancos e passa a depender de um contrato tipado para a próxima UI financeira.

**Tech Stack:** PostgreSQL/Supabase, React 19, TypeScript, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-financeiro-contrato-v1-design.md`

## Global Constraints

- Não inventar dados financeiros.
- `null` permanece desconhecido; zero é zero conhecido.
- Não editar contas bancárias implicitamente no cadastro escolar.
- Repasses importados são somente leitura para usuários autenticados.
- Preservar os 537 repasses e 335 contas atualmente carregados.
- Supabase oficial: `raluxyojqosfzrfozmpz`.

---

### Task 1: Proteger cadastro escolar contra alteração bancária implícita

**Files:**
- Modify: `src/hooks/useUpdateUnidadeCadastro.test.tsx`
- Modify: `src/hooks/useUpdateUnidadeCadastro.ts`
- Modify: `src/components/UnidadeCadastroEditDialog.tsx`
- Modify: `src/lib/unidadeCadastro.ts`
- Create: `supabase/migrations/20260909053000_financeiro_contrato_v1_hardening.sql`

**Interfaces:**
- Consumes: `update_unidade_cadastro_minima` atual.
- Produces: RPC com args `p_unidade_id`, `p_nome`, `p_diretor`, `p_endereco`.

- [ ] **Step 1: Escrever teste que exige ausência dos argumentos bancários**

```ts
expect(mockedRpc).toHaveBeenCalledWith("update_unidade_cadastro_minima", {
  p_unidade_id: "uid-1",
  p_nome: "Escola Municipal Teste",
  p_diretor: "Maria Teste",
  p_endereco: "Rua Alfa, 123",
});
```

- [ ] **Step 2: Rodar CI do PR e confirmar falha pelo contrato antigo**

Expected: o teste falha porque o hook ainda envia `p_banco`, `p_agencia` e `p_conta_corrente`.

- [ ] **Step 3: Remover edição bancária do hook e do diálogo**

O hook deve aplicar optimistic update somente em `nome`, `diretor` e `endereco`. O diálogo deve deixar de renderizar inputs editáveis de banco/agência/conta.

- [ ] **Step 4: Substituir RPC em migration nova**

```sql
CREATE OR REPLACE FUNCTION public.update_unidade_cadastro_minima(
  p_unidade_id uuid,
  p_nome text,
  p_diretor text,
  p_endereco text
) RETURNS uuid ...;
```

A função atualiza apenas `unidades_escolares.nome`, `diretor` e `endereco`, preservando checagem de role e row lock.

- [ ] **Step 5: Rodar testes e confirmar verde**

Run: `npm test -- src/hooks/useUpdateUnidadeCadastro.test.tsx`
Expected: PASS.

### Task 2: Endurecer `repasses_financeiros`

**Files:**
- Modify: `supabase/migrations/20260909053000_financeiro_contrato_v1_hardening.sql`
- Modify: `docs/technical/integracao-financeira-pdde-2026-v1-validation.sql`

**Interfaces:**
- Produces: `integracao_run_id uuid NOT NULL`, trigger `validate_repasses_financeiros_account`, checks de componentes e RLS read-only.

- [ ] **Step 1: Adicionar consultas adversariais ao arquivo de validação**

```sql
select count(*) as vinculos_unidade_invalidos
from repasses_financeiros r
join contas_bancarias c on c.id = r.conta_bancaria_id
where c.unidade_id <> r.unidade_id;
```

Expected atual: 0.

- [ ] **Step 2: Adicionar `integracao_run_id`, backfill e NOT NULL**

Backfill deve selecionar a execução financeira mais recente do mesmo exercício sem hardcode de UUID.

- [ ] **Step 3: Criar trigger de coerência conta/unidade/programa**

A trigger rejeita conta inexistente, conta de outra unidade ou programa divergente quando `contas_bancarias.programa` não for nulo.

- [ ] **Step 4: Criar checks condicionais de componentes**

```sql
CHECK (
  custeio_programado IS NULL OR capital_programado IS NULL
  OR custeio_programado + capital_programado = valor_programado
)
```

Análogo para pagamento, exigindo `valor_pago` quando ambos os componentes pagos estiverem presentes.

- [ ] **Step 5: Tornar repasses somente leitura para authenticated**

Remover policies INSERT/UPDATE/DELETE de `repasses_financeiros`, mantendo SELECT autenticado.

- [ ] **Step 6: Validar dados existentes antes de aplicar migration**

Esperado: 0 vínculos inválidos, 0 somas inválidas, 537 repasses.

### Task 3: Regenerar tipos Supabase e reconciliar testes

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: testes/tipos diretamente afetados pela nova assinatura RPC.

**Interfaces:**
- Produces: tipos com `repasses_financeiros`, `integracoes_financeiras_runs`, novos campos de `contas_bancarias`, `integracao_run_id` e nova assinatura RPC.

- [ ] **Step 1: Gerar tipos contra o projeto oficial após migration**

Use geração oficial de tipos do Supabase.

- [ ] **Step 2: Substituir o arquivo versionado**

Preservar apenas overrides manuais que continuem necessários e sejam comprovados.

- [ ] **Step 3: Rodar typecheck, lint, unit, build e E2E**

Run:
```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```
Expected: todos verdes.

### Task 4: Verificação final e merge

- [ ] **Step 1: Validar produção Supabase**

Confirmar 163 unidades, 335 contas, 537 repasses, 491 links, 0 inconsistências e 537 repasses com `integracao_run_id`.

- [ ] **Step 2: Confirmar CI da PR**

Expected: success.

- [ ] **Step 3: Merge somente após checks verdes**

- [ ] **Step 4: Confirmar Vercel Production READY no SHA da main**
