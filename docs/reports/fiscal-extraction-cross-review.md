# Revisao Cruzada — PR #58 (POC Tecnica) vs PR #59 (Governanca)

Atualizado em: 2026-05-15

## Origem e fonte de verdade

Este parecer foi produzido lendo diretamente:

- PR #58 (`spike/fiscal-document-extraction-poc`, HEAD `eb2b8b0`): arquivos lidos via `git show origin/spike/fiscal-document-extraction-poc:<path>` para nao misturar branches.
- PR #59 (`docs/fiscal-extraction-validation-protocol`, HEAD `37460e2`): arquivos lidos do working tree do clone limpo apos checkout de `main`.
- `main` em `7baac702` (merge PR #57) — base comum dos dois PRs.

Estado em 2026-05-15: ambos os PRs estao DRAFT, ambos `mergeable: clean`, CI do PR #58 verde (`Vercel: success`, `CI: success`). Nenhum merge realizado.

---

## 1. Resumo executivo

**PR #58 e PR #59 sao coerentes e complementares.**

- **Sem conflito de escopo.** Os arquivos sao disjuntos por construcao. PR #58 cria `tools/fiscal-extraction/**` + 2 docs em `docs/technical/` + `docs/reports/` (`fiscal-extraction-architecture.md`, `fiscal-extraction-poc.md`) + alterou `.gitignore`. PR #59 cria 4 docs novos em `docs/technical/` + `docs/reports/` com nomes distintos (`fiscal-extraction-validation-protocol.md`, `fiscal-extraction-field-dictionary.md`, `fiscal-sample-corpus-protocol.md`, `fiscal-extraction-governance-notes.md`). Verificado via `git ls-tree -r origin/spike/fiscal-document-extraction-poc -- docs/`: nenhum dos 4 arquivos do PR #59 aparece em PR #58.

- **Convergencia central**: ambos reforcam, em multiplos pontos, a regra de **revisao humana obrigatoria** antes de qualquer dado fiscal virar oficial.

- **Nenhum dos dois exige ajuste como bloqueador antes de merge.** Ambos podem entrar como estao na qualidade de spike + governanca. Sao identificados 12 pontos de evolucao, todos da classe "recomendado antes de v1 institucional" ou "backlog futuro" — nenhum bloqueador critico.

- **Ordem recomendada**: mergear PR #58 antes de PR #59 (justificativa em secao 7).

---

## 2. Matriz de correspondencia entre modelo tecnico e dicionario de campos

Cruzamento entre o modelo Pydantic em `tools/fiscal-extraction/src/fiscal_extraction/models.py` (PR #58) e a tabela de 20 campos em `docs/technical/fiscal-extraction-field-dictionary.md` (PR #59).

| # | Campo no dicionario (PR #59) | Existe no Pydantic (PR #58)? | Nome no modelo | Tipo no modelo | Obrigatorio agora (PoC)? | Lacuna | Recomendacao |
|--:|---|---|---|---|---|---|---|
| 1 | `document_type` | Sim | `FiscalExtractionResult.document_type` | `str \| None` | Sim (NF-e ao menos) | Pydantic aceita qualquer string; nao restringe ao enum do dicionario | Em v1, trocar para `Literal["NF-e", "NFS-e", "cupom", "recibo", "boleto", "outro"]` |
| 2 | `document_number` | Sim | `.document_number` | `str \| None` | Sim | Pydantic aceita string livre, mas regex `DOCUMENT_NUMBER_PATTERN` so casa `\d{1,12}` — alfanumerico de recibo manual nao seria capturado | Backlog: ampliar regex para recibos quando essa categoria entrar |
| 3 | `access_key` | Sim | `.access_key` | `str \| None` | Sim quando presente | Sem validacao posicional (digitos 7-20 codificarem CNPJ emitente; digito verificador 44) | **Recomendado**: adicionar validador posicional em `validators.py` |
| 4 | `issue_date` | Sim | `.issue_date` | `date \| None` | Sim | Sem validacao de faixa (`2020 <= ano <= corrente+1`) | **Recomendado**: adicionar checagem de faixa em `validators.py` |
| 5 | `supplier_cnpj` | Sim (aninhado) | `.supplier.cnpj` | `str \| None` (14 digitos apos `normalize_cnpj`) | Sim | Algoritmo de DV ja implementado em `is_valid_cnpj`; rejeita 14 iguais ✓ | Convergente |
| 6 | `supplier_name` | Sim (aninhado) | `.supplier.name` | `str \| None` | Sim | Sem normalizacao para uppercase + trim | Backlog: normalizar antes de comparar com base interna |
| 7 | `recipient_cnpj` | Sim (aninhado) | `.recipient.cnpj` | `str \| None` (14 digitos apos `normalize_cnpj`) | Quando presente | Validacao DV idem ✓; **sem cruzamento com base de unidades escolares** (so possivel em fase institucional com banco) | Convergente para PoC; v1 precisa do cruzamento com `unidades_escolares.cnpj` |
| 8 | `recipient_name` | Sim (aninhado) | `.recipient.name` | `str \| None` | Quando presente | Sem comparacao com `unidades_escolares.designacao/nome` | Convergente para PoC; v1 precisa do cruzamento |
| 9 | `total_value` | Sim | `.total_value` | `Decimal \| None` | Sim | Decimal preserva precisao ✓; **nao ha conferencia `soma_itens == total_value`** | **Recomendado**: adicionar regra de coerencia em `validators.py` |
| 10 | `item_description` | Sim (lista) | `.items[].description` | `str \| None` | Parcial admitida | Convergente | OK |
| 11 | `item_quantity` | Sim (lista) | `.items[].quantity` | `Decimal \| None` | Quando presente | Convergente | OK |
| 12 | `item_unit_value` | Sim (lista) | `.items[].unit_value` | `Decimal \| None` | Quando presente | Convergente | OK |
| 13 | `item_total_value` | Sim (lista) | `.items[].total_value` | `Decimal \| None` | Quando presente | **Sem checagem `quantity * unit_value ~= total_value` (tolerancia de centavos)** | Backlog: regra de coerencia |
| 14 | `source_file` | Sim | `.source_file` | `str \| None` | Sim | Convergente | OK |
| 15 | `extraction_method` | Parcial | `.source_type` | `Literal["xml", "pdf", "text", "unknown"]` | Sim | **Granularidade menor** que a do dicionario, que usa `["xml", "pdf_text_pymupdf", "pdf_text_pdfplumber", "ocr_tesseract", "manual", "sefaz_lookup"]` | **Recomendado**: refinar Literal antes da v1 institucional, especialmente quando OCR entrar (auditoria de qualidade por metodo) |
| 16 | `confidence` | Sim | `.confidence` | `float [0,1]` (Pydantic `Field(ge=0, le=1)`) | Sim | Calculo atual e simples fracao de 6 campos presentes (presenca-baseado, granularidade 1/6); dicionario descreve "media ponderada dos campos criticos" considerando validade estrutural, coerencia cruzada e metodo | Convergente para v0; v1 deve usar formula ponderada |
| 17 | `warnings` | Sim | `.warnings` | `list[str]` | Sim | Convergente ✓ | OK |
| 18 | `reviewed_by` | Nao (proposital) | — | — | Nao (institucional) | Corretamente fora do PoC | Aguardar Marco 6B |
| 19 | `reviewed_at` | Nao (proposital) | — | — | Nao (institucional) | Corretamente fora do PoC | Aguardar Marco 6B |
| 20 | `status` | Nao (proposital) | — | — | Nao (institucional) | Corretamente fora do PoC | Aguardar Marco 6B |

### Campos do Pydantic que faltam no dicionario top-20

| Campo Pydantic | Status no dicionario | Observacao |
|---|---|---|
| `FiscalItem.code` (cProd da NF-e) | **Nao aparece** entre os campos 10-13 | Lacuna pequena no dicionario; recomendado acrescentar como campo `item_code` |
| `FiscalExtractionResult.raw_text` | **Coberto em `governance-notes.md` §5.2** (schema conceitual de `extracoes_fiscais.raw_text: text`) mas nao aparece na tabela top-20 do dicionario | Lacuna formal; recomendado acrescentar como campo derivado ou na tabela "Campos derivados" do dicionario |

### Resumo da matriz

- **17 campos com correspondencia direta ou aninhada** entre o modelo Pydantic e o dicionario.
- **3 campos institucionais** (`reviewed_by`, `reviewed_at`, `status`) corretamente fora do PoC.
- **1 campo com granularidade reduzida** no Pydantic (`source_type`) — recomendado refinar antes de v1.
- **2 campos do Pydantic ausentes no dicionario top-20** (`item_code`, `raw_text`) — lacunas pequenas no PR #59.
- **Nenhum conflito de tipo** entre os dois PRs.

---

## 3. Matriz de validacao por campo critico

Para cada campo critico (CNPJ emitente, CNPJ destinatario, numero, data, valor, chave, razao social, itens):

### 3.1. CNPJ do emitente (`supplier.cnpj`)

| Aspecto | PR #58 (codigo real) | PR #59 (governanca) | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `normalize_cnpj(emit.get("CNPJ"))` em `extract_xml.py:104` — pega exatamente `emit/CNPJ` | Especifica `supplier_cnpj` (14 digitos sem formatacao) | Sem lacuna | — |
| Extracao texto | `cnpjs[0]` (primeiro CNPJ que casa `CNPJ_PATTERN` no documento) — `extract_pdf_text.py:108` | Mesma regra textual implicita | **Suposicao posicional**: o primeiro CNPJ sempre e o emitente. Se layout inverter ou houver CNPJ de transportador no topo, quebra | **Media** — coberto por warning em `validators.py` (CNPJ invalido), mas nao bloqueia explicitamente |
| Normalizacao | 14 digitos com `re.sub(r"\D+", "", value)` em `normalize.py:13` | "Normalizar **sempre** para 14 digitos (somente numeros) no banco" (dicionario §"CNPJ") | Convergente | — |
| Validacao DV | `is_valid_cnpj` com algoritmo oficial em `normalize.py:24-37`; rejeita 14 iguais | "Algoritmo oficial de digitos verificadores; rejeitar 14 digitos iguais" | Convergente ✓ | — |
| Bloqueio em UI | N/A (PoC nao tem UI) | "Bloqueado para confirmacao automatica se CNPJ invalido" (§7.1) | Sem lacuna — `validators.py` adiciona `"emitente: CNPJ invalido"` em `warnings`; UI futura le warnings | — |

### 3.2. CNPJ do destinatario (`recipient.cnpj`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `normalize_cnpj(dest.get("CNPJ"))` em `extract_xml.py:105` | Idem `supplier_cnpj` + "validacao cruzada obrigatoria com unidades escolares cadastradas" | Cruzamento com cadastro de unidades **nao implementado** (depende de banco) | **Media** — esperado para PoC; **bloqueador** para v1 institucional |
| Extracao texto | `cnpjs[1] if len(cnpjs) > 1 else None` em `extract_pdf_text.py:113` | Idem | **Suposicao posicional**: o segundo CNPJ sempre e o destinatario | **Media** — mesma fragilidade do emitente |
| Validacao DV | Idem ✓ | Idem ✓ | Convergente | — |

### 3.3. Numero da nota (`document_number`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `ide.get("nNF")` em `extract_xml.py:102` (string direto do XML) | "Correspondencia exata" | Convergente | — |
| Extracao texto | Regex `DOCUMENT_NUMBER_PATTERN` aceita apenas `\d{1,12}` apos labels (`nota fiscal`, `nf-e`, `numero`, etc.) | Aceita `^[0-9]{1,12}$` para NF-e/NFS-e, **mas permite alfanumerico em recibos manuais** | Regex atual nao captura numero alfanumerico de recibo (ex: "RC-0042") | **Baixa** — recibos manuais fora do escopo da v0 do PoC; backlog |
| Strip de zeros | `number_match.group(1).lstrip("0")` em `extract_pdf_text.py:88` | "Preservar zeros a esquerda quando aplicavel" | **Divergencia minor**: PoC remove zeros a esquerda; dicionario diz preservar | **Baixa** — em NF-e o `nNF` ja vem sem zeros; relevante so para recibos com numeracao manual padded |

### 3.4. Data de emissao (`issue_date`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `normalize_date(ide.get("dhEmi") or ide.get("dEmi"))` em `extract_xml.py:103` | Convergente | — | — |
| Extracao texto | Regex `DATE_PATTERN` aceita `DD/MM/YYYY` ou ISO 8601; passa para `normalize_date` (dateutil dayfirst=True) | Convergente | — | — |
| Validacao de faixa | **Nao implementada** | "Faixa: `2020-01-01 <= data <= ano_corrente + 1`; alerta se data > hoje; alerta se data < inicio do exercicio em revisao" (§4) | Validador em `validators.py` so reporta data ausente, nao data fora de faixa | **Recomendada** — adicionar em `validators.py` antes da v1; defesa contra OCR que reporta `19/05/1925` ou ano corrente +5 |

### 3.5. Valor total (`total_value`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Tipo armazenado | `Decimal \| None` em `models.py:38` | `Decimal(14,2)` no banco; "evitar `float`/`number` puro por perda de precisao" | Convergente ✓ | — |
| Parser brasileiro | `parse_money_br` em `normalize.py:40-74` faz deteccao **posicional** de milhar vs decimal (compara `rfind(",")` vs `rfind(".")` para decidir) | "Tratar separadamente milhar e decimal por posicao" | Convergente ✓ | — |
| Cobertura de formatos | Testes confirmam `R$ 1.234,56`, `1.234,56`, `1234,56`, `1234.56` em `test_normalize.py:26-30` | Idem | Convergente ✓ | — |
| Coerencia com itens | **Nao implementada**: parser nao valida `sum(items.total_value) ~= total_value` | "Coerencia com soma dos itens (tolerancia <= R$ 0,02 por arredondamento)" (§9) | Sem checagem | **Recomendada** — defesa simples e barata; detecta erro de OCR em qualquer um dos lados |
| Reject de valor zero/negativo | **Nao implementado**: `validators.py` so reporta `valor total ausente` | "`> 0`; alerta se diferir do extrato bancario na conciliacao" (§7.1, §9) | Sem checagem | **Recomendada** — adicionar `if result.total_value is not None and result.total_value <= 0: warning("valor total nao positivo")` |

### 3.6. Chave de acesso (`access_key`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `protNFe/infProt/chNFe`, com fallback para `infNFe@Id` (prefixo `NFe` removido) em `extract_xml.py:78-82` | Convergente | — | — |
| Extracao texto | Regex `ACCESS_KEY_PATTERN` casa 44 digitos com separadores variados, depois normaliza via `only_digits` | Convergente | — | — |
| Validacao de comprimento | Implicita: `if len(candidate) == 44` em `extract_pdf_text.py:81` | "Comprimento diferente de 44 digitos quando declarada" → bloqueio (§7.1) | Convergente ✓ | — |
| Validacao posicional | **Nao implementada**: PoC nao verifica que digitos 7-20 da chave == `supplier_cnpj` | Dicionario §3 especifica: "digitos 7-20 codificam CNPJ do emitente"; e §7.2 §"Bloqueio por inconsistencia": "Chave de acesso presente mas que nao codifica o CNPJ do emitente extraido" | **Recomendada** — adicionar validador. Em XML pode parecer redundante (XML estruturado e confiavel), mas defesa critica contra OCR de chave em DANFE escaneado. Custo de implementacao: ~10 linhas em `validators.py` |
| Digito verificador (44o) | **Nao implementado**: PoC nao calcula DV oficial da chave | Dicionario §3: "digito verificador final calculado" | **Recomendada** — algoritmo oficial e modulo 11 dos 43 primeiros digitos |

### 3.7. Razao social (emitente/destinatario)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | `emit.get("xNome")` / `dest.get("xNome")` direto em `extract_xml.py:104-105` | Convergente | — | — |
| Extracao texto | `_find_party_name(cleaned, labels)` — busca label (`emitente`/`fornecedor` ou `destinatario`) e captura `(?:razao social\|raz[aã]o social\|nome)\s*:\s*(.+)` nas 4 linhas seguintes em `extract_pdf_text.py:42-50` | "Variacao textual pequena admitida; similaridade Jaccard >= 0.90 sobre tokens normalizados" | Heuristica frágil quando labels nao estao no padrao "Razao Social:" (ex: cupom com `Empresa: ...`) | **Baixa** — convergente para layouts NF-e padronizados; backlog para variacao de layout |
| Normalizacao | Nao normaliza (preserva como vem) | "Normalizado em uppercase + trim" no banco | Convergente para snapshot; v1 deve normalizar antes de comparar com base interna | **Baixa** |
| Validacao | `validators.py` so reporta `nome ausente` | Idem + "comparar com cadastro" | Convergente para PoC | — |

### 3.8. Itens (`items[*]`)

| Aspecto | PR #58 | PR #59 | Lacuna | Severidade |
|---|---|---|---|---|
| Extracao XML | Itera `det[]/prod` capturando `cProd, xProd, qCom, vUnCom, vProd` em `extract_xml.py:84-95` | Cobre `item_description, item_quantity, item_unit_value, item_total_value` mas **nao lista `item_code` (cProd) no top-20** | **Lacuna no PR #59**: `item_code` deveria estar no dicionario | **Baixa** — facil correcao no PR #59 |
| Extracao texto | `items=[]` sempre em `extract_pdf_text.py:115` (nao parseia itens em texto) | "Pode ser parcial na POC" (§5) | Convergente — admitido pelo protocolo | — |
| Coerencia | Sem checagem `qty * unit ~= total` por item | "`quantity * unit_value ~= item_total_value` (tolerancia de centavos)" (§12) | **Recomendada** — defesa contra OCR de itens | **Baixa** — esperado em v1 |

---

## 4. Avaliacao de confidence/status

### 4.1. Calculo de `confidence` no PR #58

O calculo e identico em `extract_xml.py:52-61` e `extract_pdf_text.py:62-70`:

```python
def _confidence(result):
    checks = [
        result.document_number,
        result.access_key,
        result.issue_date,
        result.supplier and result.supplier.cnpj,
        result.recipient and result.recipient.cnpj,
        result.total_value is not None,
    ]
    return round(sum(1 for check in checks if check) / len(checks), 2)
```

Caracteristicas:

- **Presenca-baseado**: conta quantos dos 6 campos criticos estao preenchidos.
- **Granularidade fixa**: `0.00 / 0.17 / 0.33 / 0.50 / 0.67 / 0.83 / 1.00` (multiplos de 1/6).
- **Identico para XML e texto**: nao distingue qualidade da fonte.
- **Nao considera validade estrutural**: um CNPJ presente mas com DV invalido conta como "1 ponto" no confidence, embora `validators.py` emita warning.

### 4.2. Tiers do PR #59

O protocolo em `fiscal-extraction-validation-protocol.md` §6 define:

| Nivel | Threshold sugerido |
|---|---|
| alta | `>= 0.95` |
| media | `0.70 - 0.94` |
| baixa | `< 0.70` |
| bloqueado | qualquer + regra de bloqueio da §7 |

Caracteristicas:

- **Tiers descritivos**, nao apenas numero.
- **Confidence por campo**, alem do global.
- **Considera metodo de extracao**: XML > PDF textual > OCR.
- **Considera validade estrutural**: campo presente mas invalido nao pesa o mesmo que presente e valido.

### 4.3. Mapeamento confidence (PoC) -> tier (governanca)

| Valor PoC | Tier PR #59 | Coerencia |
|---|---|---|
| `1.00` (6/6 presentes) | alta | ✓ — assumindo que validators nao adicionou warning critico |
| `0.83` (5/6 presentes) | media | ✓ — exige conferencia ativa |
| `0.67` (4/6 presentes) | baixa | ✓ — bloqueia confirmacao automatica |
| `0.50` ou menor | baixa + provavel bloqueio | ✓ — aciona regra de bloqueio |

**Divergencia**: confidence do PoC com valor `1.00` em XML sintetico nao significa "alta confianca em sentido institucional", porque:

1. PoC nao verifica coerencia chave↔CNPJ;
2. PoC nao verifica soma itens == total;
3. PoC nao verifica faixa de data;
4. PoC nao verifica destinatario contra cadastro de unidades.

O teste `test_extract_xml.py:24` valida que confidence == 1.0 para o sample sintetico, o que e correto **para a definicao atual** mas seria insuficiente em v1.

### 4.4. Status

O Pydantic do PR #58 **nao tem campo `status`**. O protocolo do PR #59 §4 define enum de 5 estados (`extraido`, `requer_revisao`, `confirmado`, `rejeitado`, `substituido`) e transicoes proibidas.

**Convergencia correta**: status pertence ao schema institucional (`extracoes_fiscais.status`), nao ao modelo de extracao stricto sensu. PoC entrega o resultado da extracao; a tabela `extracoes_fiscais` (conceitual) carrega o status. **Sem lacuna; design correto**.

### 4.5. Recomendacao para confidence

**Sem mudanca obrigatoria no PoC.** Em v1 institucional, o calculo deve evoluir para:

```python
confidence = weighted_average([
    field_validity("document_number") * 1.0,
    field_validity("access_key") * 1.2 if method == "xml" else 0.8,
    field_validity("issue_date") * 1.0,
    field_validity("supplier_cnpj_with_dv_check") * 1.5,
    field_validity("recipient_cnpj_with_dv_check") * 1.5,
    field_validity("total_value_with_items_coherence") * 1.2,
])
```

Onde `field_validity` retorna 0 (ausente), 0.5 (presente mas com warning estrutural) ou 1.0 (presente e valido).

---

## 5. Avaliacao de amostras

### 5.1. Inventario do `tools/fiscal-extraction/samples/`

| Arquivo | Tamanho | Conteudo |
|---|--:|---|
| `synthetic_nfe.xml` | 53 linhas, 1389 bytes | NF-e modelo 55, namespace `portalfiscal.inf.br/nfe`, com `ide`, `emit`, `dest`, 2 `det/prod`, `total/ICMSTot/vNF`, `protNFe/infProt/chNFe` |
| `synthetic_nf_text.txt` | 19 linhas, 540 bytes | Texto livre simulando DANFE |
| `README.md` | 5 linhas, 248 bytes | "This folder contains only synthetic data" + apontamento para `.local/fiscal-samples/` |

### 5.2. Verificacao "sintetico nao parece real"

CNPJs usados:

- **Emitente**: `11.222.333/0001-81` (so digitos: `11222333000181`)
  - Validacao DV: passa pelo algoritmo oficial (confirmado em `test_normalize.py:20`).
  - Padrao visual: sequencia obvia `11.222.333` — improvavel ser CNPJ comercial real, mas **nao verificavel sem consulta a Receita Federal**.
- **Destinatario**: `04.252.011/0001-10` (so digitos: `04252011000110`)
  - Validacao DV: passa (confirmado em `test_normalize.py:21`).
  - Padrao visual: `04.252.011` parece mais "natural" que `11.222.333` — preocupacao reforcada do ChatGPT.

Razao social: `"ALFA MATERIAIS PEDAGOGICOS LTDA"` e `"ESCOLA MUNICIPAL TESTE PDDE"` — claramente ficticios pelo uso de `ALFA` (placeholder fonetico/grego comum) e `TESTE PDDE`. **Risco baixo de confusao com entidades reais**.

Numero da nota: `1234` — claramente placeholder.

Data: `2026-05-15` — coerente com a sessao de desenvolvimento (2026-05-15 e a data atual da producao deste documento).

Chave de acesso: `35260511222333000181550010000012341123456789`. Estrutura:
- UF: `35` (Sao Paulo) — coerente com regiao do emitente
- AAMM: `2605` (Maio 2026) — coerente com `dhEmi`
- CNPJ: `11222333000181` (digitos 7-20) — bate com `emit/CNPJ` ✓
- Modelo: `55` — coerente com `<mod>55</mod>`
- Serie: `001` (digitos 23-25)
- nNF: `000001234` (digitos 26-34) — bate com `nNF` ✓
- tpEmis + cNF + cDV: `1123456789` (digitos 35-44)

A chave foi construida de forma **estruturalmente consistente** com os outros campos. Isso e bom para o teste, mas significa que **o digito verificador 44 (`9`) provavelmente nao fecha o calculo oficial** — nao foi auditado.

### 5.3. Coerencia com o protocolo do PR #59

O `fiscal-sample-corpus-protocol.md` define:

| Criterio do protocolo | Estado em `tools/fiscal-extraction/samples/` | Coerencia |
|---|---|---|
| "Documentos fiscais reais nunca devem ser commitados" | Apenas 2 samples sinteticos comitados | ✓ |
| `tools/fiscal-extraction/samples/` apenas com sinteticos | Confirmado | ✓ |
| `.local/fiscal-samples/` ignorado para reais | Adicionado em `.gitignore` do PR #58 (regras `.local/`, `.local/fiscal-samples/`, `*.local.pdf`, etc.) | ✓ |
| README declara que e sintetico | `samples/README.md` declara "synthetic data" e aponta para `.local/fiscal-samples/` | ✓ |
| Cobertura de 10 categorias da §3 do protocolo | Apenas 2 categorias cobertas (XML NF-e, texto simulado) | **Esperado**: PoC inicial; resto e backlog |
| Manifesto local `manifest.local.json` | Nao existe (e nao precisa existir — e arquivo local privado) | ✓ |
| Disclaimer explicito "CNPJs sao sinteticos e validam apenas algoritmicamente" | **Nao consta no `samples/README.md`** | **Lacuna pequena** |

### 5.4. Risco de parecer dado real

| Item | Risco | Mitigacao |
|---|---|---|
| `11.222.333/0001-81` | Baixo (padrao obvio) | Manter |
| `04.252.011/0001-10` | Baixo-medio (padrao mais natural) | Considerar substituir por `99.999.999/9999-?` ou similar mais obviamente placeholder em proxima iteracao |
| `ALFA MATERIAIS PEDAGOGICOS LTDA` | Muito baixo (nome generico) | Manter |
| `ESCOLA MUNICIPAL TESTE PDDE` | Muito baixo (contem "TESTE") | Manter |
| Chave de acesso `35260511...456789` | Estruturalmente consistente mas placeholder | Manter; documentar que DV nao foi auditado |

### 5.5. Recomendacao para amostras

**Recomendado antes de v1**: acrescentar 1 paragrafo no `tools/fiscal-extraction/samples/README.md`:

> All CNPJs in these samples are synthetic. They algorithmically validate per official DV calculation but do not correspond to any real entity. Names (ALFA MATERIAIS PEDAGOGICOS LTDA, ESCOLA MUNICIPAL TESTE PDDE) are explicitly fictional placeholders.

**Sem mudanca obrigatoria no codigo.**

---

## 6. Avaliacao de seguranca e escopo

### 6.1. PR #58 nao grava em Supabase

Verificado via `git ls-tree -r origin/spike/fiscal-document-extraction-poc`:

- Nenhum arquivo em `src/integrations/supabase/`
- Nenhuma import de `@supabase/supabase-js` ou `supabase` Python client em `tools/fiscal-extraction/`
- Nenhuma referencia a `SUPABASE_URL`, `SUPABASE_KEY`, `service_role` em codigo PoC
- Migrations em `supabase/migrations/` permanecem intocadas (mesmas 8 migrations da `main`)

✓ Confirmado.

### 6.2. PR #59 nao cria migration

Verificado via `git diff --stat` no commit `37460e2`:

- 4 arquivos modificados: todos em `docs/`
- Zero arquivos em `supabase/`
- Zero arquivos em `src/`

✓ Confirmado.

### 6.3. Nenhum dos dois altera o Demonstrativo

Verificado:

- PR #58 nao toca `src/lib/demonstrativo/` (qualquer arquivo)
- PR #58 nao toca `src/components/DocumentsPanel*` (qualquer arquivo)
- PR #58 nao toca `public/templates/` (qualquer arquivo)
- PR #59 idem (apenas 4 arquivos em `docs/`)

✓ Confirmado. O gerador do Demonstrativo Basico Individual (PR #43, em producao) permanece intocado.

### 6.4. Nenhum contem documento fiscal real

- PR #58 commita apenas 2 samples em `tools/fiscal-extraction/samples/`, ambos sinteticos
- PR #59 nao commita nenhum sample (apenas docs)
- Nenhum PDF/XML/imagem em qualquer dos PRs

✓ Confirmado.

### 6.5. Nenhum dispensa revisao humana

Pontos onde os dois PRs reforcam revisao humana:

| Local | Texto |
|---|---|
| PR #58 `architecture.md` §"Human validation is mandatory" | "Extracted data must be treated as suggestions... cannot become official records without explicit review and correction by a responsible user" |
| PR #58 `architecture.md` §"Future acceptance criteria" | "no automatic write to Demonstrativo without confirmed data" |
| PR #58 `README.md` §"Scope" | "All extracted values are suggestions that require human review before any official accounting use" |
| PR #58 `poc.md` §"Explicit non-integration" | Lista 7 sistemas com os quais NAO integra |
| PR #59 `validation-protocol.md` §2 "Regra central" | "Extracao automatica **nunca** vira dado oficial sem revisao humana" |
| PR #59 `validation-protocol.md` §4 | Transicao `extraido -> confirmado` direto **proibida** |
| PR #59 `field-dictionary.md` campos 18-20 | `reviewed_by` + `reviewed_at` + `status` obrigatorios para confirmacao |
| PR #59 `governance-notes.md` §2 R1, R7 | "Preencher prestacao com dado nao validado" e "Falsa sensacao de automacao confiavel" listados como riscos criticos |
| PR #59 `governance-notes.md` §6.6 | "Nao recomendar ligacao direta extracao -> Demonstrativo oficial em nenhuma circunstancia" |

✓ Convergencia em 9 pontos cruzados.

---

## 7. Ordem de merge recomendada

### Cenarios avaliados

**Cenario A: PR #58 antes de PR #59**

- Vantagem: PoC tecnica entra como spike isolado (`tools/fiscal-extraction/`); governanca chega em seguida para guiar a evolucao para v1.
- Historico Git fica natural: implementacao -> governanca.
- Sem conflito git verificado.
- CI do PR #58 ja esta verde; CI do PR #59 e PR-only-docs (sem build necessario).

**Cenario B: PR #59 antes de PR #58**

- Vantagem: governanca como contrato; PoC entra como implementacao da v0 do contrato.
- Historico Git mais "top-down": criterio -> implementacao.
- Sem conflito git verificado.

**Cenario C: Ambos sem ordem definida**

- Funciona porque arquivos sao disjuntos.
- Mas qualquer ordem cria uma narrativa Git; melhor escolher explicitamente.

**Cenario D: Manter os dois em DRAFT ate ajustes pequenos**

- Vantagem: permite acrescentar disclaimer no `samples/README.md` (PR #58) e `item_code`/`raw_text` no dicionario (PR #59) antes de sair de draft.
- Custo: 2 commits adicionais; nenhum bloqueador real.

### Recomendacao

**Cenario A**: mergear PR #58 primeiro, depois PR #59.

Justificativas:

1. PR #58 e cronologicamente o spike inicial; PR #59 nasceu como complemento de governanca. Historico Git refletindo essa cronologia e mais legivel.
2. PR #58 ja tem CI verde e checks operacionais completos (Vercel preview Ready, pytest, npm test, tsc, lint, build). PR #59 e PR documental sem build.
3. PR #59 referencia PR #58 explicitamente (em `field-dictionary.md` §"Relacao com Pydantic models do PoC"). Mergeando PR #58 primeiro, as referencias ja apontam para `main`.
4. Os ajustes recomendados (disclaimer + 2 campos) podem entrar em 1 unico PR documental pequeno **depois** dos dois — seguindo a politica de [[feedback_no_parallel_hygiene_before_functional_pr]] do projeto.

Se preferencia for Cenario D, o disclaimer e os 2 campos podem ser adicionados em commits separados antes do merge de cada PR — mas isso atrasa entrega sem ganho operacional.

---

## 8. Lista de ajustes recomendados

### 8.1. Bloqueadores antes de merge

**Nenhum.**

Nenhum ajuste detectado eleva-se a bloqueador. Ambos os PRs cumprem:
- Escopo declarado
- Restricoes (sem Supabase, sem UI, sem Demonstrativo, sem documentos reais)
- Validacao humana obrigatoria reforcada
- CI verde no PR #58; PR #59 documental nao exige build

### 8.2. Recomendados antes de sair de DRAFT (ajustes pequenos)

| # | PR | Mudanca | Local | Esforco |
|--:|---|---|---|---|
| 1 | #58 | Acrescentar disclaimer "all CNPJs synthetic; validate algorithmically but do not correspond to real entities" | `tools/fiscal-extraction/samples/README.md` | 3 linhas |
| 2 | #59 | Acrescentar campo `item_code` (cProd da NF-e) ao top-20 do dicionario | `docs/technical/fiscal-extraction-field-dictionary.md` | 1 linha de tabela |
| 3 | #59 | Acrescentar `raw_text` ao top-20 OU mover explicitamente para "Campos derivados" com nota de cobertura no schema | `docs/technical/fiscal-extraction-field-dictionary.md` | 1 linha de tabela |
| 4 | #58 | Documentar limitacao do `source_type` Literal e roadmap de granularidade ( `pdf_text_pymupdf`, `pdf_text_pdfplumber`, `ocr_tesseract`, `manual`, `sefaz_lookup`) | `docs/technical/fiscal-extraction-architecture.md` §"Future acceptance criteria" | 5 linhas |

Estes 4 ajustes podem entrar em **1 unico PR documental pequeno** (ex.: `docs/fiscal-extraction-followup`) apos os dois PRs principais serem mergeados, em vez de modificar #58 e #59 in-flight.

### 8.3. Backlog futuro (v1 institucional)

| # | Tema | Onde aplicar | Severidade |
|--:|---|---|---|
| 1 | Validador posicional da chave de acesso (digitos 7-20 == supplier_cnpj) | `tools/fiscal-extraction/src/fiscal_extraction/validators.py` | Recomendada |
| 2 | Validador de digito verificador (44o) da chave de acesso | `validators.py` | Recomendada |
| 3 | Validador de faixa de data (`2020 <= ano <= corrente+1`) | `validators.py` | Recomendada |
| 4 | Validador de coerencia `sum(items.total_value) ~= total_value` | `validators.py` | Recomendada |
| 5 | Validador de coerencia `item.quantity * item.unit_value ~= item.total_value` | `validators.py` | Backlog |
| 6 | Rejeicao de `total_value <= 0` | `validators.py` | Recomendada |
| 7 | Refinar `source_type` em Literal granular | `tools/fiscal-extraction/src/fiscal_extraction/models.py` | Recomendada para v1 |
| 8 | Suporte a numero alfanumerico de nota (recibos manuais) | `extract_pdf_text.py` regex `DOCUMENT_NUMBER_PATTERN` | Backlog |
| 9 | Implementar OCR (Tesseract ou similar) | Novo modulo `extract_ocr.py` | Marco futuro |
| 10 | Consulta SEFAZ por chave de acesso | Novo modulo `sefaz_lookup.py` | Marco futuro |
| 11 | Parser de itens em texto livre | `extract_pdf_text.py` | Backlog |
| 12 | Calculo de confidence ponderado por metodo e validade estrutural | `_confidence` em `extract_xml.py` / `extract_pdf_text.py` | Recomendada para v1 |
| 13 | Cruzamento `recipient_cnpj` contra `unidades_escolares.cnpj` | Logica institucional, fora do PoC | Bloqueador para v1 institucional |
| 14 | Cobertura de NFS-e municipal (Nota Carioca para RJ-RJ) | Novo modulo `extract_nfse_*.py` | Marco futuro |
| 15 | Conector com Supabase Storage para upload de arquivos | Novo modulo + Edge Function | Bloqueador para v1 institucional |
| 16 | UI de revisao lado-a-lado | `src/components/DocumentsFiscaisPanel.tsx` (a criar) | Marco futuro |

---

## 9. Parecer final

### Classificacao

**APTO PARA MERGE COMO SPIKE COM AJUSTES MENORES (opcional).**

### Justificativa

PR #58 e PR #59 sao tecnicamente coerentes, escopalmente disjuntos, e arquiteturalmente complementares. Ambos:

- Respeitam o escopo declarado;
- Nao tocam codigo funcional do PDDE Online (Demonstrativo, Supabase, UI, Auth/RLS, Vercel);
- Nao commitam documentos fiscais reais;
- Nao dispensam revisao humana;
- Reforcam, em multiplos pontos cruzados, a regra "extracao automatica nunca vira dado oficial sem revisao humana";
- Tem CI verde (PR #58) ou nao precisam de CI (PR #59 documental).

Os 4 ajustes "recomendados antes de sair de DRAFT" sao todos da classe **cosmetica/documental** — nao corrigem defeito atual, apenas melhoram clareza para auditoria futura. Podem ser feitos em PR documental separado, posterior, sem bloquear o merge dos dois PRs principais.

Os 16 itens do backlog futuro pertencem a **evolucao para v1 institucional** e nao devem atrasar a entrega do spike. O spike (PR #58) cumpre seu papel: prova capacidade tecnica local de extrair NF-e XML e DANFE-textual com confidence > 0.8 em amostras sinteticas, com warnings estruturados, isolamento completo do sistema principal e testes automatizados verdes.

### Restricoes do parecer

Este parecer e **valido para os HEADs verificados**:

- PR #58 HEAD: `eb2b8b0812c3fabd5c2a52bf9c43969d6f319feb`
- PR #59 HEAD: `37460e2`
- `main` HEAD: `7baac7029b4be06f8613c360bde092b8a4417597`

Caso qualquer um dos PRs receba force-push ou commit adicional apos esta data, o parecer precisa ser refeito.

### Decisao recomendada

1. Mergear PR #58 primeiro (admin bypass do Ruleset, conforme procedimento do PR #43 documentado em `docs/DECISIONS.md` 2026-05-11).
2. Mergear PR #59 em seguida.
3. (Opcional) Abrir PR documental `docs/fiscal-extraction-followup` com os 4 ajustes da §8.2.
4. **Nao** iniciar implementacao de v1 institucional antes de:
   - Marco 6B (Auth/RLS final) concluido;
   - PoC empirico com 20+ amostras reais anonimizadas executado;
   - Politica de retencao de 5 anos formalizada;
   - Decisao institucional explicita de priorizar extracao fiscal sobre outras frentes (Fase 2B, Marco 9C, etc.).

---

## Politica de revisao deste parecer

Este parecer e snapshot. Deve ser revisado quando:

- PR #58 ou PR #59 receberem ajustes apos os HEADs verificados;
- PoC empirico for executado com amostras reais e produzir metricas concretas;
- Mudanca regulatoria FNDE/TCM-RJ alterar exigencias de prestacao de contas.
