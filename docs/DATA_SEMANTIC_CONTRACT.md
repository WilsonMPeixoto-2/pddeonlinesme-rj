# Contrato Semântico de Dados (v2.2.1)
Projeto: PDDE Online 2026

## A Regra de Ouro da Identidade Escolar (Emenda E5 e E6)
No sistema PDDE Online, uma unidade escolar possui duas faces de identidade. O protótipo Lovable falhou ao fundi-las.

1. **DESIGNAÇÃO (`designacao`)**
   - Código administrativo numérico (ex: `04.10.001`).
   - Usado como FK, índice de upsert e vinculação contábil.
   - NUNCA exibe o nome humano nas telas principais (Escolas, Dashboard, Portal do Diretor).

2. **NOME (`nome`)**
   - O rótulo humano/oficial (ex: `EM EMA NEGRÃO DE LIMA`).
   - Usado como título principal nas telas e relatórios (Adoção mandatória no PR 3).

## Regras de Proteção de Histórico (Emenda E3)
* Fica **estritamente proibida** a deleção física (`DELETE`) de escolas e a configuração de `ON DELETE CASCADE` nas tabelas atreladas (execução financeira, pagamentos, rendimentos, documentos).
* Toda exclusão de unidade escolar será tratada via operação lógica (`UPDATE unidades_escolares SET ativo = false`).
