# Notas de Governanca — Extracao Fiscal

Atualizado em: 2026-05-16

## 1. O que esta frente representa

Esta frente representa o **PoC de extracao assistida de documentos fiscais** para a futura prestacao de contas do PDDE Online 2026. **Nao representa automacao final.**

A distincao e operacional:

- **PoC de extracao assistida** significa que o sistema **sugere** campos extraidos de documentos fiscais, com indicacao de confianca por campo. **Toda confirmacao como dado oficial passa por servidor autorizado.** A extracao reduz digitacao manual e detecta anomalias, mas nao substitui a responsabilidade do revisor.

- **Automacao final** significaria que documentos extraidos virariam dados oficiais sem revisao humana, alimentando demonstrativos e exportacoes ao FNDE/SiGPC automaticamente. **Este nao e o objetivo desta frente, agora nem no medio prazo.**

A frente esta documentalmente alocada nos Marcos 11 e 12 (Motor documental v1 / Geracao individual real) do Plano Global v4.1, mas **e prerequisito tecnico** para que esses marcos consumam dados reais de despesas, em vez de dados de execucao financeira agregada importada da BASE.

As escolhas da POC atual nao sao arquitetura institucional definitiva. Bibliotecas, OCR, Vision LLM, Document AI, provedor de processamento, modelo de worker e metodos fiscais estruturados devem ser avaliados por Tech Radar e, quando afetarem fronteiras de dados, seguranca, custo ou operacao, por ADR antes da v1 institucional.

### Estado atual da frente (2026-05-15)

| Camada | Estado | Onde |
|---|---|---|
| Mecanica de parsing (XML, PDF textual) | PoC implementado | PR #58 — `tools/fiscal-extraction/` (Codex) |
| Arquitetura conceitual | Documentada | `docs/technical/fiscal-extraction-architecture.md` (Codex) |
| Protocolo de validacao | Documentado | `docs/technical/fiscal-extraction-validation-protocol.md` (este PR) |
| Dicionario de campos | Documentado | `docs/technical/fiscal-extraction-field-dictionary.md` (este PR) |
| Protocolo de amostras | Documentado | `docs/technical/fiscal-sample-corpus-protocol.md` (este PR) |
| Tabelas Supabase | Nao criadas | Apenas conceituais nesta secao 5 |
| UI de revisao | Nao implementada | Conceitual |
| Storage para arquivos reais | Nao configurado | Conceitual |
| Auth/roles para revisores | Pendente | Marco 6B |
| Conciliacao bancaria | Fora de escopo desta frente | Frente irma futura |

## 2. Riscos administrativos

Cada risco abaixo e classificado por **probabilidade** (baixa/media/alta) sem implementacao adequada e por **impacto institucional** (baixo/medio/alto/critico).

### R1. Preencher prestacao de contas com dado nao validado

- **Probabilidade sem controle:** alta.
- **Impacto:** critico (auditoria do TCM-RJ ou FNDE pode reprovar contas).
- **Cenario:** servidor confirma campos sem ler o documento original; extracao errada vira dado oficial.
- **Trigger especifico:** UI sem visualizacao lado-a-lado do documento original; botao "confirmar tudo" sem leitura por campo critico.

### R2. Duplicidade de nota (mesmo documento lancado duas vezes)

- **Probabilidade sem controle:** alta.
- **Impacto:** alto (despesa contabilizada em dobro).
- **Cenario:** mesmo arquivo enviado em momentos diferentes; OU duas escolas enviam o mesmo documento por engano; OU mesma chave de acesso aparece em PDF e XML separados.
- **Trigger especifico:** ausencia de dedup por hash de arquivo + por chave de acesso + por (CNPJ + numero + data + valor).

### R3. Valor extraido errado em centavos

- **Probabilidade sem controle:** media.
- **Impacto:** alto (demonstrativo nao bate; conciliacao falha; auditoria abre divergencia).
- **Cenario:** parsing brasileiro de moeda (`R$ 1.234,56`) confunde milhar e decimal; OCR le `1,234.56` em PDF escaneado; arredondamento em float-point.
- **Trigger especifico:** ausencia de armazenamento em `Decimal(14,2)`; ausencia de conferencia soma_itens vs total.

### R4. CNPJ errado (digito trocado)

- **Probabilidade sem controle:** media (em XML quase zero; em OCR alta).
- **Impacto:** alto (despesa atribuida a fornecedor errado; concentracao de compras mal calculada).
- **Cenario:** OCR le `8` como `B`; troca de `0` por `O`.
- **Trigger especifico:** ausencia de validacao de digitos verificadores em todo CNPJ extraido.

### R5. Documento de fornecedor diferente do declarado

- **Probabilidade sem controle:** baixa.
- **Impacto:** medio (auditoria abre questionamento; precisa esclarecer).
- **Cenario:** escola envia nota de fornecedor A mas declara despesa contra fornecedor B; pode ser erro ou tentativa de simulacao.
- **Trigger especifico:** ausencia de conferencia entre fornecedor declarado pela escola e fornecedor extraido do documento.

### R6. OCR com erro nao detectado

- **Probabilidade sem controle:** alta para documentos escaneados.
- **Impacto:** medio a critico (depende do campo).
- **Cenario:** OCR retorna texto plausivel mas com numero errado; revisor confia na sugestao por causa de high confidence falso.
- **Trigger especifico:** ausencia de threshold mais rigoroso para campos vindos de fallback visual; ausencia de comparacao com fonte estruturada ou metodo independente quando ambos sao aplicaveis.

### R7. Falsa sensacao de automacao confiavel

- **Probabilidade sem controle:** alta com o tempo.
- **Impacto:** critico (cria normalizacao de baixa diligencia institucional).
- **Cenario:** sistema funciona bem em 95% dos casos por meses; servidor passa a clicar "confirmar" sem ler; 5% errado escapam; auditoria descobre depois.
- **Trigger especifico:** UI que nao exige conferencia ativa em campos criticos; ausencia de amostragem aleatoria de auditoria interna; ausencia de feedback ao revisor sobre correcoes posteriores.

### R8. Vazamento de dados em desenvolvimento

- **Probabilidade sem controle:** media.
- **Impacto:** alto (LGPD; perda de confianca institucional).
- **Cenario:** desenvolvedor commita inadvertidamente arquivos reais; PR ja merged precisa de rewrite history; backup desnecessario em servico de cloud nao revisado.
- **Trigger especifico:** ausencia de `.gitignore` adequado; ausencia de protocolo de amostras (corrigido por este PR + PR #58); falta de revisao em PRs de extracao.

### R9. Mudanca de regulamentacao FNDE/TCM-RJ

- **Probabilidade sem controle:** baixa no curto prazo, media no medio prazo.
- **Impacto:** medio (retrabalho).
- **Cenario:** TCM-RJ ou FNDE altera campos exigidos na prestacao; sistema precisa atualizar dicionario de campos.
- **Trigger especifico:** ausencia de processo de revisao periodica do dicionario de campos.

### R10. Transicao de NFS-e Nacional/DPS e legados municipais

- **Probabilidade sem controle:** alta para fora do Rio de Janeiro.
- **Impacto:** baixo (escola pode digitar manualmente).
- **Cenario:** escola recebe NFS-e em NFS-e Nacional/Padrao DPS, Nota Carioca legada, NFS-e Rio ou outro formato municipal; extracao assume um layout unico e falha.
- **Trigger especifico:** estrategia que tenta extrair de todo XML/PDF sem identificar primeiro padrao nacional, DPS, municipalidade, legado ou fonte oficial aplicavel.

## 3. Controles recomendados

Mapeamento direto de riscos para controles. Implementacao detalhada em `fiscal-extraction-validation-protocol.md`.

| Risco | Controle minimo | Controle reforcado |
|---|---|---|
| R1 (dado nao validado) | UI lado-a-lado documento + campos; bloqueio de "confirmar tudo" | Amostragem aleatoria de auditoria interna por gestor da CRE; treinamento periodico de revisores |
| R2 (duplicidade) | Dedup por hash SHA-256 do arquivo; dedup por chave de acesso quando presente | Dedup adicional por (CNPJ + numero + data + valor); alerta de duplicidade cross-unidade quando suspeita |
| R3 (valor errado) | Armazenamento em `Decimal(14,2)`; parser brasileiro com tratamento posicional de separadores; conferencia `soma_itens == total_value` | Conferencia opcional com extrato bancario na conciliacao |
| R4 (CNPJ errado) | Validacao de digitos verificadores (algoritmo oficial) em todo CNPJ extraido | Confirmacao via consulta SEFAZ por chave de acesso, quando disponivel |
| R5 (fornecedor diferente) | Comparacao automatica entre CNPJ declarado e CNPJ extraido com bloqueio se divergente | Comparacao de razao social com base interna de fornecedores conhecidos |
| R6 (OCR errado) | Threshold mais rigoroso para fontes visuais; nunca confiar em "alta confianca" de OCR para campos criticos | Preferir fonte estruturada; comparar metodos quando aplicavel; avaliar Document AI/Vision LLM/OCR tradicional por Tech Radar e LGPD |
| R7 (falsa sensacao) | UI exige interacao ativa em campos criticos; auditoria interna periodica | Metricas continuas de correcao manual por revisor; alerta se revisor confirma sempre sem alterar |
| R8 (vazamento) | `.gitignore` adequado; `tools/fiscal-extraction/samples/` apenas com sinteticos; `.local/fiscal-samples/` ignorado | Pre-commit hook que verifica padroes CNPJ/CPF/chave de acesso em arquivos staged; revisao humana obrigatoria em PRs da frente |
| R9 (regulamentacao) | Revisao trimestral do dicionario de campos pela equipe da 4a CRE; campo `versao_dicionario` no schema futuro | Alinhamento direto com Setor de Prestacao de Contas da CRE para mudancas regulatorias |
| R10 (NFS-e Nacional/DPS e legados) | Identificar NFS-e Nacional/DPS, Nota Carioca legada, NFS-e Rio ou outro formato antes de extrair | Priorizar padrao nacional e fontes estruturadas; manter adapter municipal apenas quando fonte oficial confirmar necessidade |

## 4. Relacao com o PDDE Online

### 4.1. Onde a extracao entra no fluxo

```txt
operador autorizado
  |
  v
upload de documento fiscal -> Storage a definir
  |
  v
extracao automatica por worker/backend a definir por ADR
  |
  v
registro em extracoes_fiscais (status=extraido | requer_revisao)
  |
  v
revisao humana em UI lado-a-lado
  |
  v
confirmacao explicita por campo critico
  |
  v
escrita em despesas_confirmadas (status=oficial)
  |
  v
trilha em audit_logs (imutavel)
  |
  v
demonstrativos, conciliacao, exportacao FNDE/SiGPC
```

### 4.2. O que NAO deve mudar por causa desta frente

- **Gerador do Demonstrativo Basico Individual** (PR #43, em producao) **continua usando `vw_unidade_detalhe`** (dados de execucao financeira agregada importada da BASE). Esta frente nao altera o gerador, nem o template, nem o fluxo de geracao atual.
- **Importacao da BASE.xlsx via script administrativo** continua sendo a fonte primaria de execucao financeira agregada por unidade ate que a extracao fiscal documento-a-documento alcance maturidade.
- **`/escolas` e `/escolas/:id`** nao precisam mudar por causa desta frente.
- **Dashboard e views fundacionais** continuam intocadas.

### 4.3. Pontos de futura integracao (apos versao institucional aprovada)

- **DocumentsPanel em `EscolaEditar.tsx`** pode ganhar nova aba "Documentos Fiscais" listando documentos enviados, com link para revisao. Nao mexer ate a frente atingir maturidade.
- **Dashboard** pode ganhar widget de "Documentos pendentes de revisao" por unidade.
- **Configuracoes/Admin** pode ganhar fluxo de upload em lote para administrativo da CRE.
- **Demonstrativos futuros** (Relacao de Bens, Termo de Doacao, Parecer) podem consumir `despesas_confirmadas` em vez de `execucao_financeira` agregada — abrindo a possibilidade de prestacoes muito mais detalhadas.

### 4.4. Prerequisitos institucionais antes de qualquer integracao

1. **Marco 6B (Auth/RLS final)** concluido — sem autenticacao por perfil, nao ha como autorizar quem revisa o que.
2. **Conciliacao bancaria** desenhada (mesmo que ainda nao implementada) — extracao fiscal sem conciliacao e auditoria parcial.
3. **Politica de retencao de arquivos** definida — minimo 5 anos apos prestacao final.
4. **LGPD/privacy review** — formal, com aprovacao da Procuradoria/CGM-RJ se aplicavel.
5. **Treinamento operacional** — revisores sabem o que confirmar e o que rejeitar.

## 5. Relacao com o Supabase futuro

Esta secao descreve **tabelas conceituais** para o esquema futuro. **Nao cria migration. Nao altera Supabase. Nao gera SQL executavel.** A migration real, quando vier, exige PR proprio com revisao humana e validacao por revisao de Auth/RLS.

### 5.1. `documentos_fiscais` (conceitual)

Tabela canonica conceitual de documentos fiscais enviados. Storage, naming e bucket definitivo dependem de ADR e revisao de LGPD; Supabase Storage e candidato natural no contexto atual, nao decisao final deste PR.

```txt
documentos_fiscais
  id: uuid PK
  unidade_id: uuid FK -> unidades_escolares.id
  exercicio: integer
  programa: enum (basico | qualidade | equidade)
  tipo_documento: enum (NF-e | NFS-e | cupom | recibo | boleto | outro)
  arquivo_path: text (referencia a Storage institucional)
  file_hash: text (SHA-256 hex, UNIQUE com unidade_id+exercicio)
  file_size_bytes: bigint
  mime_type: text
  status: enum (recebido | em_extracao | extraido | requer_revisao | confirmado | rejeitado | substituido)
  uploaded_by: uuid FK -> auth.users
  uploaded_at: timestamp
  created_at: timestamp
  updated_at: timestamp
  INDEX (unidade_id, exercicio, status)
```

### 5.2. `extracoes_fiscais` (conceitual)

Tabela de resultados de extracao por tentativa. Permite multiplas tentativas no mesmo documento (versionamento).

```txt
extracoes_fiscais
  id: uuid PK
  documento_id: uuid FK -> documentos_fiscais.id
  versao: integer (1 = primeira tentativa; >1 = nova extracao apos correcao)
  metodo: enum conceitual (ex.: xml_official | nfse_dps | dfe_lookup | pdf_text | document_ai | vision_llm | ocr_traditional | manual)
  
  document_number: text
  access_key: text
  issue_date: date
  supplier_cnpj: text (14 digitos)
  supplier_name: text
  recipient_cnpj: text (14 digitos)
  recipient_name: text
  total_value: numeric(14,2)
  
  items: jsonb (array de itens; pode ser tabela filha extracoes_fiscais_itens se complexidade exigir)
  raw_text: text (texto bruto extraido, util para auditoria; pode ser null em metodo xml)
  
  confianca: numeric(4,3)
  confianca_por_campo: jsonb (map campo -> nivel)
  warnings: text[]
  
  status: enum (extraido | requer_revisao | confirmado | rejeitado | substituido)
  confirmado_por: uuid FK -> auth.users (nullable; obrigatorio se status=confirmado)
  confirmado_em: timestamp (nullable; obrigatorio se status=confirmado)
  
  created_at: timestamp
  updated_at: timestamp
  
  INDEX (documento_id, versao) UNIQUE
  INDEX (status)
```

### 5.3. `despesas_confirmadas` (conceitual)

Tabela de despesas oficialmente confirmadas. **Imutavel apos confirmacao.** Correcoes posteriores criam novo registro com `substitui_id` referenciando o antigo.

```txt
despesas_confirmadas
  id: uuid PK
  documento_id: uuid FK -> documentos_fiscais.id
  extracao_id: uuid FK -> extracoes_fiscais.id
  unidade_id: uuid FK -> unidades_escolares.id
  exercicio: integer
  programa: enum
  
  fornecedor_cnpj: text (snapshot textual no momento da confirmacao)
  fornecedor_nome: text
  numero_documento: text
  data_emissao: date
  valor_total: numeric(14,2)
  categoria: text (rubrica de despesa; ex: "material_pedagogico", "servico_manutencao")
  
  substitui_id: uuid FK -> despesas_confirmadas.id (null se primeira versao)
  
  confirmado_por: uuid FK -> auth.users
  confirmado_em: timestamp
  
  INDEX (unidade_id, exercicio, programa)
  INDEX (fornecedor_cnpj)
  CHECK (valor_total > 0)
```

### 5.4. `audit_logs` (conceitual)

Tabela canonica de auditoria para toda mudanca relevante no sistema (nao apenas extracao fiscal; pode ser compartilhada com Fase 2B e Marco 6B).

```txt
audit_logs
  id: uuid PK
  entidade: text (ex: "documentos_fiscais", "extracoes_fiscais", "despesas_confirmadas", "unidades_escolares")
  entidade_id: uuid
  acao: enum (upload | extract | confirm | reject | edit | replace | delete)
  campo: text (nullable; preenchido em edicoes campo-a-campo)
  valor_anterior: jsonb (nullable em criacao)
  valor_novo: jsonb (nullable em delecao)
  usuario_id: uuid FK -> auth.users
  origem: text (ex: "ui_revisao", "ui_upload", "script_admin", "extracao_automatica")
  ip_origem: inet (opcional; util para auditoria de seguranca)
  timestamp: timestamp DEFAULT now()
  
  INDEX (entidade, entidade_id)
  INDEX (usuario_id, timestamp)
  INDEX (timestamp DESC)
```

### 5.5. RLS conceitual (nao implementar agora)

Apenas para registro do que sera necessario quando a versao institucional for implementada:

- `documentos_fiscais`: read para usuario com perfil que tem vinculo com `unidade_id`; insert para usuarios com perfil `operador_unidade` (sua unidade) ou `admin_cre`; update apenas via funcoes especificas; delete proibido para todos exceto admin com motivo registrado.
- `extracoes_fiscais`: read alinhado com `documentos_fiscais`; insert apenas via servico de extracao (service_role ou Edge Function dedicada); update de `status` para `confirmado`/`rejeitado` apenas para perfis com permissao de revisao.
- `despesas_confirmadas`: read alinhado com `documentos_fiscais`; insert apenas via funcao acionada pela confirmacao da extracao; update proibido (substituicao via nova insercao com `substitui_id`); delete proibido.
- `audit_logs`: read para admin/auditor; insert via triggers e funcoes; update e delete proibidos para todos.

### 5.6. Decisao sobre quem cria isso

Quando esta frente avancar para implementacao institucional:

1. **PR de migration** deve ser pequeno e dedicado (uma migration por tabela ou conjunto coeso).
2. **Revisao humana obrigatoria** conforme `AGENTS.md` (Auth, RLS, roles, policies).
3. **Validacao de types** com `npm run supa:types` (linked) apos cada migration.
4. **Smoke read-only** antes de habilitar qualquer write em producao.
5. **Senha service_role** deve ser rotacionada antes da primeira gravacao real.

## 5.7. Tech Radar e ADR antes da v1

Antes da v1 institucional, o projeto deve avaliar em Tech Radar:

- NFS-e Nacional / Padrao DPS como alvo principal de NFS-e;
- Nota Carioca, NFS-e Rio e demais formatos municipais como legado/transicao;
- XML oficial como fonte preferencial;
- DFe, SEFAZ, distribuicao, consulta por chave e APIs terceirizadas;
- bibliotecas fiscais especializadas versus parsing XML manual;
- PDF textual, Vision LLM, Document AI, OCR tradicional e extracao manual assistida;
- confidence ponderada e metricas por campo;
- batch versus revisao unitaria.

Devem virar ADR antes de implementacao real:

- decisao de processador fiscal (worker/backend/job/servico externo);
- politica de envio de documentos fiscais a servicos externos, considerando LGPD, custo e retencao;
- modelo de Storage, versionamento, hash e retencao;
- Auth/RLS/Marco 6B para upload, revisao, confirmacao e auditoria;
- schema final e trilha imutavel de auditoria.

## 6. Decisao recomendada

A frente de extracao fiscal **so deve ser integrada ao fluxo oficial** quando todos os criterios abaixo forem atendidos. Antes disso, manter como PoC controlado em `tools/fiscal-extraction/` com documentacao de suporte (este conjunto de docs).

### 6.1. Pre-requisitos tecnicos

- [ ] PoC atinge metricas minimas da secao 10 do protocolo de validacao em corpus de >= 20 amostras reais anonimizadas.
- [ ] Fontes estruturadas priorizadas: XML oficial, NFS-e Nacional/DPS, DFe/consulta por chave/API confiavel avaliadas antes de fallback visual.
- [ ] Captura via chave de acesso, DFe, consulta fiscal ou API terceirizada avaliada como factivel ou descartada com justificativa.
- [ ] Estrategia de PDF textual, Vision LLM, Document AI e OCR tradicional definida por Tech Radar/ADR, com LGPD avaliada.
- [ ] Schema conceitual da secao 5 revisado e aprovado.

### 6.2. Pre-requisitos institucionais

- [ ] Marco 6B (Auth/RLS final) concluido.
- [ ] Politica de privacidade revisada para tratamento de CNPJ, razao social e itens (com Procuradoria/CGM se aplicavel).
- [ ] Politica de retencao de 5 anos formalizada.
- [ ] Treinamento basico para revisores planejado.
- [ ] Setor de Prestacao de Contas da 4a CRE consultado sobre formato esperado de exportacao para SiGPC/FNDE.

### 6.3. Pre-requisitos de UI e UX

- [ ] Mockup de UI de revisao lado-a-lado aprovado.
- [ ] Workflow de aprovacao (operador -> CRE -> SME se aplicavel) desenhado.
- [ ] Atalhos de teclado e ergonomia validados com pelo menos 1 revisor real.

### 6.4. Pre-requisitos de governanca contínua

- [ ] Metricas de qualidade do extrator com dashboard interno planejado (taxa de correcao por campo, taxa de bloqueio).
- [ ] Amostragem aleatoria de auditoria interna definida (ex.: 5% dos confirmados auditados pelo gestor da CRE).
- [ ] Processo de feedback do revisor para o time de desenvolvimento desenhado.

### 6.5. Quando avancar

A decisao de avancar para implementacao institucional deve ser tomada **explicitamente** apos:

1. PR atual + PR #58 do Codex serem mergeados.
2. PoC tecnico ser exercitado com pelo menos 1 ciclo de iteracao (medir, ajustar, remedir).
3. Conversa institucional com a 4a CRE sobre prioridade vs outras frentes (Fase 2B, Marco 6B, Marco 9C, etc.).

Ate la, a frente **permanece como PoC**. Demonstrativo Basico continua usando dados agregados da BASE. Auditoria oficial continua usando processo atual.

### 6.6. O que NAO recomendar

- Nao recomendar ligacao direta extracao -> Demonstrativo oficial em nenhuma circunstancia ate todos os criterios acima serem atendidos.
- Nao recomendar OCR como base unica; fontes estruturadas e PDF textual devem vir antes de fallback visual.
- Nao recomendar IA generativa, Vision LLM ou Document AI para confirmacao autonoma de campos criticos. Uso futuro so como fallback assistido, com revisao humana reforcada, LGPD avaliada e metodo auditavel.
- Nao recomendar pular Marco 6B "porque a frente de extracao e prioritaria" - sem auth/RLS, nao ha como autorizar revisores; isso e nao-negociavel.

## 7. Politica de revisao destas notas

Estas notas devem ser revisadas:

- Apos cada ciclo de iteracao do PoC (atualizar metricas, riscos descobertos);
- Quando Marco 6B for concluido (atualizar prerequisitos institucionais);
- Quando regulamentacao do FNDE/TCM-RJ mudar de forma relevante para extracao fiscal;
- Antes de qualquer PR que proponha integracao com fluxo oficial.

Pequenos ajustes de wording podem entrar junto ao proximo PR funcional. Mudanca de criterio de avanco (secao 6) exige PR documental dedicado.
