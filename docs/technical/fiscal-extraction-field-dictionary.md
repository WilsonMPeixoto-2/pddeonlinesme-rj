# Dicionario de Campos da Extracao Fiscal

Atualizado em: 2026-05-16

## Finalidade

Este documento define o **conjunto canonico de campos** que a extracao fiscal deve produzir e como cada um deve ser validado, com risco associado em caso de erro e destino provavel no banco de dados.

E complementar a:

- `docs/technical/fiscal-extraction-validation-protocol.md` (criterios de aceite, niveis de confianca, regras de bloqueio);
- `docs/technical/fiscal-extraction-architecture.md` (componentes e fluxos da POC);
- O contrato Pydantic da POC em `tools/fiscal-extraction/src/fiscal_extraction/models.py`.

## Convencoes

- **Tipo de dado** segue convencao TypeScript/Postgres: `string`, `number`, `Decimal`, `date`, `timestamp`, `uuid`, `boolean`, `enum`, `string[]`.
- **Obrigatorio no PoC** indica se o campo precisa ser produzido pela POC tecnica (`tools/fiscal-extraction/`) para que ela cumpra criterio de aceite.
- **Obrigatorio na versao institucional** indica se o campo precisa estar presente para que uma extracao possa ser confirmada como dado oficial.
- **Risco** descreve o impacto institucional/operacional se o campo for extraido errado e confirmado sem revisao adequada.
- **Destino futuro** indica em qual tabela conceitual o campo deve aparecer no esquema institucional (definicao conceitual; nao cria migration).
- **Exemplo sintetico** usa dados ficticios. CNPJs podem validar pelo algoritmo oficial para exercitar validadores, mas nao devem representar escola, CEC, fornecedor ou entidade real.

Este dicionario define um alvo conceitual evolutivo. Ele nao congela as escolhas da POC: `source_type`, `extraction_method`, modelos Pydantic, bibliotecas e provedores podem ser substituidos ou complementados apos Tech Radar/ADR.

## Tabela de campos

| # | Campo | Descricao | Exemplo sintetico | Tipo | Obrig. PoC | Obrig. institucional | Regra de validacao | Risco se extraido errado | Destino futuro no banco |
|--:|---|---|---|---|---|---|---|---|---|
| 1 | `document_type` | Tipo de documento fiscal | `"NF-e"` | enum: `NF-e` \| `NFS-e` \| `cupom` \| `recibo` \| `boleto` \| `outro` | Sim (pelo menos `NF-e` no PoC) | Sim | Aceitar apenas valores do enum; rejeitar `null` se for confirmar como oficial | Classificacao errada pode aplicar regra de duplicidade errada ou conciliacao errada | `documentos_fiscais.tipo_documento` |
| 2 | `document_number` | Numero da nota/cupom/recibo | `"1234"` | `string` (preservar zeros a esquerda quando aplicavel) | Sim | Sim quando o tipo exigir | `^[0-9]{1,12}$` para NF-e/NFS-e; permitir alfanumerico em recibos manuais; campo obrigatorio se nao for recibo simples | Duplicidade nao detectada; nota errada lancada como diferente | `documentos_fiscais.numero_documento` |
| 3 | `access_key` | Chave de acesso da NF-e (44 digitos) | `"35260511222333000181550010000012341123456789"` | `string` (exatos 44 digitos) | Sim quando presente no documento | Sim para NF-e modelo 55 | `^[0-9]{44}$`; digitos 7-20 codificam CNPJ do emitente; digito verificador final calculado | Rastreabilidade SEFAZ perdida; nao detecta duplicidade; consulta SEFAZ futura impossivel | `documentos_fiscais.chave_acesso` (UNIQUE com `unidade_id`+`exercicio`) |
| 4 | `issue_date` | Data de emissao do documento | `"2026-05-15"` | `date` (ISO 8601, somente data; horario fica em `issue_datetime` quando disponivel) | Sim | Sim | Faixa: `2020-01-01 <= data <= ano_corrente + 1`; alerta se data > hoje; alerta se data < inicio do exercicio em revisao | Periodo fiscal errado; despesa imputada em exercicio errado; auditoria comprometida | `documentos_fiscais.data_emissao` |
| 5 | `supplier_cnpj` | CNPJ do fornecedor/emitente | `"11222333000181"` | `string` (14 digitos, sem formatacao) | Sim | Sim | Algoritmo oficial de digitos verificadores; rejeitar 14 digitos iguais; rejeitar comprimento != 14 | Fornecedor errado; concentracao de compras mal calculada; risco fiscal | `documentos_fiscais.fornecedor_cnpj` (FK conceitual a `fornecedores` ou armazenado direto) |
| 6 | `supplier_name` | Razao social do fornecedor | `"ALFA MATERIAIS PEDAGOGICOS LTDA"` | `string` (1-255 chars, normalizado em uppercase + trim) | Sim | Sim | Nao-vazio apos trim; alerta se diferir muito do que esta cadastrado para o mesmo CNPJ | Identificacao confusa; auditoria dificultada | `documentos_fiscais.fornecedor_nome` (snapshot textual no momento da extracao) |
| 7 | `recipient_cnpj` | CNPJ do destinatario | `"04252011000110"` | `string` (14 digitos) | Quando presente no documento | Sim | Mesmas regras do `supplier_cnpj`; **validacao cruzada obrigatoria**: deve corresponder ao CNPJ de alguma unidade escolar cadastrada na 4a CRE | Despesa atribuida a unidade errada; relatorio consolidado errado | `documentos_fiscais.destinatario_cnpj` |
| 8 | `recipient_name` | Razao social do destinatario | `"ESCOLA MUNICIPAL TESTE PDDE"` | `string` (1-255 chars) | Quando presente | Recomendado | Nao-vazio; comparar com `unidades_escolares.designacao` ou `nome` (similaridade) | Confusao entre unidades com nomes parecidos | `documentos_fiscais.destinatario_nome` |
| 9 | `total_value` | Valor total do documento | `1234.56` (centavos: 123456) | `Decimal(14,2)` | Sim | Sim | `> 0`; coerencia com soma dos itens (tolerancia <= R$ 0,02 por arredondamento); alerta se diferir do extrato bancario na conciliacao | Valor errado na prestacao; demonstrativo errado; risco institucional alto | `documentos_fiscais.valor_total` + `despesas_confirmadas.valor` (apos confirmacao) |
| 10 | `item_description` | Descricao textual do item | `"Caderno universitario"` | `string` (1-255 chars) | Parcial admitida no PoC | Recomendado | Nao-vazio quando item declarado; sem caracteres de controle | Classificacao de despesa errada; rubrica de demonstrativo errada | `documentos_fiscais_itens.descricao` |
| 11 | `item_code` | Codigo do item no documento, quando existir | `"001"` ou `"7890000000000"` | `string` | Nao | Recomendado | Preservar como texto; nao assumir semantica sem identificar padrao do emissor | Perda de rastreabilidade da itemizacao; comparacao de itens fica mais fraca | `documentos_fiscais_itens.codigo` |
| 12 | `item_quantity` | Quantidade do item | `10.0000` | `Decimal(14,4)` | Quando presente no documento | Recomendado | `> 0` | Estoque/conferencia errada; auditoria dificultada | `documentos_fiscais_itens.quantidade` |
| 13 | `item_unit_value` | Valor unitario do item | `12.3450` | `Decimal(14,4)` | Quando presente | Recomendado | `> 0`; `quantity * unit_value ~= item_total_value` (tolerancia de centavos) | Inconsistencia entre quantidade e total | `documentos_fiscais_itens.valor_unitario` |
| 14 | `item_total_value` | Valor total do item (qtd * unit) | `123.45` | `Decimal(14,2)` | Quando presente | Recomendado | `> 0`; coerencia com unit*qtd; soma dos `item_total_value` ~= `total_value` documento | Valor de itemizacao errado | `documentos_fiscais_itens.valor_total` |
| 15 | `source_file` | Caminho/identificador do arquivo de origem | `"tools/fiscal-extraction/samples/synthetic_nfe.xml"` (no PoC) ou `"documentos_fiscais/<unidade_id>/<exercicio>/<file_hash>.xml"` (no Storage institucional) | `string` | Sim | Sim | Caminho deve existir; no Storage institucional, deve seguir convencao `documentos_fiscais/<unidade_id>/<exercicio>/<file_hash>.<ext>` | Rastreabilidade do arquivo original perdida | `documentos_fiscais.arquivo_path` (referencia ao Storage institucional definido por ADR) |
| 16 | `raw_text` | Texto bruto extraido do documento, quando houver camada textual ou OCR | `"NOTA FISCAL ELETRONICA..."` | `text` | Sim para PDF/TXT; opcional para XML | Recomendado com politica de retencao | Pode ser `null` em XML oficial; quando armazenado, deve respeitar LGPD e retencao | Auditoria da extracao fica limitada; risco de armazenar PII sem necessidade | `extracoes_fiscais.raw_text` |
| 17 | `extraction_method` | Metodo usado para extrair os dados | `"xml_official"` \| `"nfse_dps"` \| `"dfe_lookup"` \| `"pdf_text"` \| `"document_ai"` \| `"vision_llm"` \| `"ocr_traditional"` \| `"manual"` | enum conceitual | Sim | Sim | Valores finais devem ser definidos por Tech Radar/ADR; rejeitar `null` na versao institucional | Auditoria de qualidade impossivel; nao consegue priorizar melhorias por metodo | `extracoes_fiscais.metodo` |
| 18 | `confidence` | Confianca global da extracao (media ponderada dos campos criticos) | `0.92` | `Decimal(4,3)` ou `float [0,1]` | Sim | Sim | `0 <= confidence <= 1`; campos com tolerancia exata pesam mais que descricoes textuais; nao decide confirmacao sem humano | Threshold de confirmacao automatica errado; falsa sensacao de qualidade | `extracoes_fiscais.confianca` |
| 19 | `warnings` | Lista de alertas emitidos pela validacao | `["destinatario: CNPJ ausente", "valor total ausente"]` | `string[]` (cada item ate 200 chars) | Sim | Sim | Strings nao-vazias; sem duplicatas; ordenadas alfabeticamente; warnings criticos bloqueiam confirmacao automatica | Bloqueios silenciosos; revisor nao ve motivo da baixa confianca | `extracoes_fiscais.warnings` (jsonb ou text[]) |
| 20 | `reviewed_by` | Identificador do servidor que confirmou a extracao | `"auth.users.id::uuid"` (exemplo: `"a3f1c2d4-..."`) | `uuid` (FK conceitual a `auth.users`) | Nao (apenas institucional) | Sim quando `status = confirmado` | Deve corresponder a usuario com perfil autorizado para a unidade em questao | Confirmacao anonima; auditoria invalida; conformidade comprometida | `extracoes_fiscais.confirmado_por` |
| 21 | `reviewed_at` | Timestamp da confirmacao | `"2026-05-15T14:30:00-03:00"` | `timestamp with time zone` | Nao | Sim quando `status = confirmado` | `reviewed_at >= created_at`; nao pode ser futuro | Trilha temporal invalida; auditoria comprometida | `extracoes_fiscais.confirmado_em` |
| 22 | `status` | Estado atual da extracao | `"extraido"` | enum institucional: `extraido` \| `requer_revisao` \| `confirmado` \| `rejeitado` \| `substituido` | Sim (subset `extraido` e `requer_revisao`) | Sim | Transicoes conforme protocolo (ver `fiscal-extraction-validation-protocol.md` secao 4); transicoes invalidas devem falhar atomicamente | Confirmacao indevida; rejeicao silenciosa; perda de versionamento | `extracoes_fiscais.status` |

## Campos derivados (calculados, nao extraidos)

Estes campos nao saem da extracao mas devem existir no esquema futuro para integridade:

| Campo | Descricao | Exemplo | Tipo | Origem |
|---|---|---|---|---|
| `file_hash` | SHA-256 do arquivo binario original | `"a3f1...e2d4"` (64 hex chars) | `string(64)` | Calculado no upload, imutavel |
| `file_size_bytes` | Tamanho em bytes do arquivo original | `45678` | `bigint` | Calculado no upload |
| `mime_type` | Tipo MIME detectado | `"application/xml"` | `string` | Detectado no upload |
| `unidade_id` | Vinculo com a unidade escolar destinataria | `"3f2a..."` | `uuid` | Atribuido manualmente OU inferido por `recipient_cnpj` |
| `exercicio` | Ano fiscal da prestacao | `2026` | `integer` | Atribuido manualmente; deve ser coerente com `issue_date` |
| `programa` | Codigo do programa PDDE | `"basico"` \| `"qualidade"` \| `"equidade"` | enum | Atribuido manualmente |
| `created_at` | Timestamp de criacao do registro | `"2026-05-15T10:00:00-03:00"` | `timestamp with time zone` | Sistema |
| `updated_at` | Timestamp da ultima atualizacao | `"2026-05-15T14:30:00-03:00"` | `timestamp with time zone` | Sistema |

## Campos sensiveis e regras especiais

### CNPJ

- Em prestacao de contas publica, CNPJ e dado **publico** (artigo 8 da LAI), mas a base de fornecedores deve ser protegida contra extracao em massa para evitar perfilagem comercial.
- Normalizar **sempre** para 14 digitos (somente numeros) no banco; formatar apenas na UI.
- MEI: CNPJ valido mas pode coincidir com PII do empresario individual; tratar com mesma diligencia que dados pessoais.

### Razao social

- Snapshot textual no momento da extracao. Razao social atualizada da Receita Federal pode divergir do que esta no documento (mudanca de razao social do fornecedor). Manter o que estava no documento original; nao "atualizar" retroativamente.

### Valor

- Sempre armazenar em `Decimal(14,2)` ou usar `bigint` em centavos (evitar `float`/`number` puro por perda de precisao).
- Conversao de string em parsing brasileiro (`R$ 1.234,56`) e ponto fragil; tratar separadamente milhar e decimal por posicao.

### Chave de acesso

- Estrutura SEFAZ: 2 UF + 4 AAMM + 14 CNPJ + 2 modelo + 3 serie + 9 numero + 1 tipo emissao + 8 codigo numerico + 1 digito verificador = 44 digitos.
- Validacao posicional: digitos 7-20 devem ser igual a `supplier_cnpj` (14 digitos); digitos 25-34 devem ser igual a `document_number` (9 digitos com zero-padding); digito 44 deve fechar o calculo de verificacao oficial.
- Quando chave existe, e a fonte de verdade do documento; campos extraidos do PDF/texto que conflitem com ela devem ser corrigidos pela chave, nao o contrario.

## Campos NAO incluidos intencionalmente nesta versao

Os campos abaixo podem ser uteis no futuro mas nao fazem parte do dicionario minimo desta frente:

- `serie` da nota (parte da chave; redundante se chave existir).
- `protocolo_autorizacao` da SEFAZ (relevante apenas quando consulta SEFAZ for implementada).
- `cfop` (codigo fiscal de operacao) — relevante para classificacao tributaria, fora do escopo do PDDE.
- `icms`, `pis`, `cofins`, etc. — tributos detalhados; nao usados na prestacao de contas PDDE escolar.
- `desconto`, `frete`, `seguro`, `outras_despesas` — sub-totais; somam ao `total_value`; tratar apenas se a regra do programa exigir.
- `forma_pagamento` — recomendavel mas pertence a conciliacao bancaria, nao a extracao fiscal.
- Dados de transporte (transportador, placa do veiculo) — fora do escopo.

A futura introducao de qualquer campo aqui exige PR documental atualizando este dicionario.

## Relacao com Pydantic models do PoC

O contrato Pydantic em `tools/fiscal-extraction/src/fiscal_extraction/models.py` (PR #58) define:

```python
class FiscalExtractionResult(BaseModel):
    source_file: str | None
    source_type: Literal["xml", "pdf_text", "pdf_ocr", "image_ocr", "manual_text", "unknown"]
    document_type: str | None
    document_number: str | None
    access_key: str | None
    issue_date: date | None
    supplier: FiscalParty | None
    recipient: FiscalParty | None
    total_value: Decimal | None
    items: list[FiscalItem]
    raw_text: str | None
    confidence: float
    warnings: list[str]
    status: Literal["extraido", "requer_revisao"]
```

Este dicionario e um **superconjunto** do modelo Pydantic. A POC atual cobre um subconjunto tecnico dos campos canonicos, incluindo `raw_text`, `warnings`, `confidence` e o status minimo de extracao. Campos de revisao humana (`reviewed_by`, `reviewed_at`) permanecem fase institucional e nao devem aparecer como confirmacao no PoC.

O campo `source_type` da POC classifica a origem em granularidade operacional (`xml`, `pdf_text`, `pdf_ocr`, `image_ocr`, `manual_text`, `unknown`). O campo conceitual `extraction_method` deve ser mais auditavel na versao institucional e diferenciar fonte oficial, NFS-e Nacional/DPS, DFe/consulta, extracao textual, Document AI, Vision LLM, OCR tradicional e entrada manual. A lista final de metodos depende de Tech Radar/ADR.

O enum institucional de `status` continua com cinco estados. A POC deve retornar apenas `extraido` ou `requer_revisao`; `confirmado`, `rejeitado` e `substituido` dependem de revisao humana, Auth/RLS, trilha de auditoria e schema institucional futuro.

## Politica de revisao

Adicionar campo, mudar tipo, mudar regra de validacao ou mudar destino futuro exige PR documental dedicado atualizando este arquivo + atualizando `fiscal-extraction-validation-protocol.md` se afetar criterios de aceite.

Pequenos ajustes de redacao podem entrar junto ao proximo PR funcional.
