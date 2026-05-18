# Atualização Parcial Assistida da BASE

Marco 10B v2 — feature de atualização cadastral em lote a partir de planilhas parciais padronizadas. Vive em `/base` como card próprio, abaixo da importação total da BASE.

## Princípio central

> Flexibilidade no tamanho e escopo do arquivo, **não** flexibilidade ilimitada na interpretação dos dados.

Planilha parcial padronizada → preview obrigatório → confirmação → RPC atômica → auditoria completa.

## Diferença entre BASE completa e Atualização Parcial

| Operação | Fluxo | Quando usar |
|---|---|---|
| **BASE completa** (`/base` topo) | Substitui tudo. Upsert por `designacao`. Atualiza centenas de campos. | Carga oficial periódica. |
| **Atualização Parcial** (`/base` meio) | Altera apenas os campos enviados na planilha. Campos ausentes não são tocados. | Correções pontuais (ex.: eleição de diretores). |

A regra-chave: **colunas ausentes significam "não alterar", nunca "apagar"**.

## Versão atual: v1

| Aspecto | Estado v1 |
|---|---|
| Campos alteráveis | **Apenas `diretor`** |
| Chaves aceitas | `designacao`, `inep`, `cnpj` |
| Limite | 200 linhas por upload |
| Formatos | `.xlsx` e `.csv` (UTF-8 ou Latin-1, delimitador `,` ou `;`, BOM tolerado) |
| Persistência | Transação SQL via RPC `apply_partial_bulk_update` |
| Auditoria | `audit_logs` (alterações) + `bulk_update_runs` (corrida) + `bulk_update_items` (linhas) |
| Reversão automática | **Não** — registra antes/depois para reversão manual |

## Como funciona

### 1. Upload

A planilha precisa conter:
- pelo menos uma coluna de **chave** reconhecida (`designacao`, `INEP` ou `CNPJ`)
- a coluna `diretor` (ou alias reconhecido)

Exemplos válidos:

```csv
designacao,diretor
04.10.001 — EM EMA NEGRÃO,MARIA DA SILVA
04.10.002 — EM ALBINO SOUZA,JOÃO COSTA
```

```csv
inep;diretor
33023456;MARIA DA SILVA
33023457;JOÃO COSTA
```

### 2. Reconhecimento de colunas

Aliases controlados (whitelist):

| Alvo | Aliases aceitos |
|---|---|
| `designacao` | designacao, designação, unidade, codigo da unidade, cod_unidade |
| `inep` | inep, codigo inep, cod inep |
| `cnpj` | cnpj, cnpj cec, cnpj uex, cnpj da uex, cnpj do cec |
| `diretor` | diretor, diretor(a), diretora, nome do diretor, nome da diretora, novo diretor, nova diretora, diretor atual, diretora atual |

**Não é fuzzy match.** Apenas correspondência exata após normalização (NFD + lowercase + colapso de espaços + remoção de pontuação). Colunas como "Presidente do CEC", "Email", "Endereço" aparecem como `ignored` e não afetam o cadastro.

### 3. Preview/Diff

Antes de gravar qualquer coisa, o sistema mostra uma tabela com:

| # | Unidade | Diretor atual | Novo diretor | Status |
|---|---|---|---|---|
| 2 | 04.10.001 — EM EMA NEGRÃO | ANTONIO LOPES | MARIA SILVA | **Alterar** |
| 3 | 04.10.002 — EM ALBINO | maria silva | MARIA SILVA | Sem alteração |
| 4 | 04.99.999 — INEXISTENTE | — | ANA PEREIRA | Não localizada |

Status possíveis:

| Status | Significado | Aplica? |
|---|---|---|
| `ready` | Vai alterar | Sim |
| `unchanged` | Valor igual ao atual (case-insensitive, trim) | Não |
| `error_not_found` | Chave não existe no banco | Não |
| `error_duplicate_key` | Chave repetida no arquivo | **bloqueia tudo** |
| `error_ambiguous` | Mais de uma unidade tem essa chave | Não |
| `error_key_mismatch` | Linha trouxe INEP + designação que não convergem | Não |
| `error_empty_value` | Novo valor vazio (proibido limpar em massa) | Não |

### 4. Confirmação

Botão "Aplicar N alterações" abre ConfirmDialog destrutivo. O número é a contagem real de linhas `ready`. Linhas `unchanged` e `error_*` ficam de fora.

### 5. Aplicação

RPC `apply_partial_bulk_update` faz:
1. Valida role (admin/operador).
2. Cria `bulk_update_runs` em status `pending`.
3. Itera cada item:
   - Whitelist enforcement: campo precisa estar em `('diretor')`.
   - `SELECT ... FOR UPDATE` na unidade para lock.
   - Se valor igual → marca `skipped_unchanged`.
   - Se diferente → `UPDATE unidades_escolares SET diretor = ...`.
   - Insere `audit_logs` (com `old_value` + `new_value`).
   - Insere `bulk_update_items`.
4. Atualiza `bulk_update_runs` com contagens + status final.
5. Retorna JSON com `{run_id, status, total, applied, skipped, errors}`.

### 6. Próxima ação

Após aplicar, o painel mostra:

> Os Demonstrativos Básicos de **N** unidades podem estar desatualizados após a alteração de diretor(a).
>
> [Abrir Painel para regenerar]

A regeneração **não é automática**. O operador navega ao Painel e usa o card CentralDocumental conforme já existe.

## Trilha de auditoria

Três tabelas trabalham juntas:

```txt
bulk_update_runs       ← uma linha por upload
  ↓ run_id
bulk_update_items      ← uma linha por linha do arquivo
                         (incluindo as ignoradas e com erro)

audit_logs             ← uma linha por mudança efetiva de dado
                         (apenas para itens applied)
                         linked via source_run_id
```

Consultas úteis (admin via SQL):

```sql
-- Histórico de corridas
SELECT id, file_name, created_at, total_rows, applied_count, status
  FROM bulk_update_runs
 ORDER BY created_at DESC
 LIMIT 20;

-- Detalhes de uma corrida
SELECT row_number, key_value, old_value, new_value, status
  FROM bulk_update_items
 WHERE run_id = 'xxx'
 ORDER BY row_number;

-- Histórico de alterações de uma unidade específica
SELECT created_at, actor_id, field_name, old_value, new_value
  FROM audit_logs
 WHERE table_name = 'unidades_escolares'
   AND record_id = 'uuid-da-unidade'
 ORDER BY created_at DESC;
```

## Segurança

| Mecanismo | Onde está |
|---|---|
| RLS em `audit_logs` | SELECT só dono ou admin |
| RLS em `bulk_update_runs` | SELECT só dono ou admin |
| RLS em `bulk_update_items` | SELECT só pelo dono da corrida ou admin |
| Whitelist de campos | client (`columnAliases.ts`) + RPC (`if field_name not in ('diretor')`) |
| Anti-impersonation | RPC pega `auth.uid()` direto, ignora payload |
| Bloqueio de service_role | RPC é `SECURITY DEFINER` chamada via cliente autenticado normal |
| Hash do arquivo | SHA-256 calculado no browser, persistido em `bulk_update_runs.file_hash` |
| Limite | 200 linhas por corrida (enforcement client + server) |

## Limitações da v1

- **Apenas `diretor`** é alterável. Outros campos (endereço, banco, agência, conta, email) ficam para v2.
- **Sem reversão automática.** Para reverter, é preciso editar manualmente as unidades ou criar uma planilha inversa.
- **Sem INSERT/DELETE.** Apenas UPDATE em unidades existentes.
- **Sem regeneração automática** de Demonstrativos. O operador é redirecionado ao Painel.
- **Sem pré-seleção do CentralDocumental.** A passagem dos IDs afetados para o Painel é apenas informativa nesta versão.

## Próximos passos (roadmap)

| Versão | Escopo |
|---|---|
| **v1** (esta) | Apenas `diretor`. Fluxo completo. |
| **v2** | Adicionar `endereco`, `email`, `banco`, `agencia`, `conta_corrente`. |
| **v3** | Pré-seleção automática no CentralDocumental para regeneração após alteração. |
| **v4** | Histórico de corridas com filtros e download de relatório `.csv`. |
| **v5** | INSERT de novas unidades + DELETE de unidades fechadas. |

## Frase canônica (referência institucional)

> "A atualização parcial assistida permite envio de planilhas enxutas, contendo apenas chave da unidade e campos a alterar, sem exigir reenvio da BASE completa. A ausência de coluna não apaga nem sobrescreve dados existentes. Na v1, somente o campo diretor é alterável."
