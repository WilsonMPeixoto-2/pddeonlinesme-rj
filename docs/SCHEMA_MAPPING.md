# Mapeamento do Schema (SCHEMA_MAPPING.md v2.2.1)

## 1. Identidade da Unidade Escolar (unidades_escolares)
| Coluna BASE | Campo Supabase | Tipo | Regra |
| :--- | :--- | :--- | :--- |
| DESIGNAÇÃO | `designacao` | `text` | NOT NULL, UNIQUE. Ex: 04.10.001 |
| NOME | `nome` | `text` | NOT NULL. Rótulo principal (Emenda E5). |
| INEP | `inep` | `text` | 8 dígitos. |
| CNPJ | `cnpj` | `text` | 14 dígitos (normalizado). |
| DIRETOR | `diretor` | `text` | Nome do gestor responsável. |
| ENDEREÇO | `endereco` | `text` | Localização. |
| AGÊNCIA | `agencia` | `text` | Preservar zeros. |
| CONTA CORRENTE | `conta_corrente` | `text` | Preservar zeros e dígito X. |
| (Novo) | `ativo` | `boolean` | DEFAULT true. Substitui o DELETE físico (Emenda E3). |

## 2. Execução Financeira (execucao_financeira)
Chave Única: `(unidade_id, exercicio, programa)`

* Regra Crítica (Emenda E1): Para cada inserção de escola, o script deve injetar 1 linha aqui (R$ 0,00 se vazio) para evitar desaparecimento na View.
* Regra Crítica (Emenda E3): `unidade_id` referenciando cadastro com **ON DELETE RESTRICT**.

## 3. Logs de Importação (import_logs)
* Regra Crítica (Emenda E8): Política de RLS restrita. APENAS `admin` e `operador` possuem acesso (diretores não podem ler).
