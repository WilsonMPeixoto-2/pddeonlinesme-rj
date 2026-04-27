# Mapeamento do Schema (SCHEMA_MAPPING.md)
Projeto: PDDE Online 2026

## 1. Identidade da Unidade Escolar (unidades_escolares)
Esta tabela é o Cadastro Central. Dados puramente organizacionais e bancários.

| Coluna BASE | Campo Supabase | Tipo | Regra |
| :--- | :--- | :--- | :--- |
| DESIGNAÇÃO | `designacao` | `text` | NOT NULL, UNIQUE. Ex: 04.10.001 (Código administrativo) |
| NOME | `nome` | `text` | NOT NULL. Rótulo humano principal. |
| INEP | `inep` | `text` | 8 dígitos. |
| CNPJ | `cnpj` | `text` | 14 dígitos (normalizado). |
| DIRETOR | `diretor` | `text` | Nome do gestor responsável. |
| ENDEREÇO | `endereco` | `text` | Localização. |
| AGÊNCIA | `agencia` | `text` | Preservar zeros. |
| CONTA CORRENTE | `conta_corrente` | `text` | Preservar zeros e dígito X. |

## 2. Execução Financeira (execucao_financeira)
Esta tabela isola os dados transitórios, preservando o histórico por ano.

Chave Única Composta: `(unidade_id, exercicio, programa)`

| Campo | Tipo | Regra |
| :--- | :--- | :--- |
| `unidade_id` | `uuid` | FK para unidades_escolares. ON DELETE RESTRICT (recomendado). |
| `exercicio` | `integer` | Ano (ex: 2026). NOT NULL. |
| `programa` | `text` | Ex: 'basico'. NOT NULL. |
| `reprogramado_custeio` | `numeric(14,2)` | Padrão 0.00. |
| `reprogramado_capital` | `numeric(14,2)` | Padrão 0.00. |
| `parcela_1_custeio` | `numeric(14,2)` | Padrão 0.00. |
| `parcela_1_capital` | `numeric(14,2)` | Padrão 0.00. |
| `parcela_2_custeio` | `numeric(14,2)` | Padrão 0.00. |
| `parcela_2_capital` | `numeric(14,2)` | Padrão 0.00. |

## 3. Views de Acesso (Frontend)
### vw_unidades_escolares_frontend
View consolidada usando `WITH (security_invoker = true)` para mesclar cadastro e execução. Retorna sempre os dados de UM `exercicio` específico.

O frontend deve SEMPRE aplicar o filtro: `.eq('exercicio', valor)` para não mesclar contas de anos distintos.
