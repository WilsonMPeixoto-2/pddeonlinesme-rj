# Protocolo de Corpus de Amostras para Extracao Fiscal

Atualizado em: 2026-05-16

## Finalidade

Definir como montar e manter um conjunto seguro de amostras documentais para desenvolver, testar e medir a extracao fiscal **sem vazar dados reais** de fornecedores, escolas, alunos ou prestacao de contas.

Este protocolo complementa:

- `docs/technical/fiscal-extraction-validation-protocol.md` (criterios de aceite, niveis de confianca, regras de bloqueio);
- `docs/technical/fiscal-extraction-field-dictionary.md` (campos esperados);
- `docs/technical/fiscal-extraction-architecture.md` (Codex; arquitetura e fluxos).

## 1. Regra de ouro

> **Documentos fiscais reais nunca devem ser commitados ao repositorio publico.**

Esta regra vale para:

- PDFs reais (NF-e, NFS-e, cupom, boleto, recibo);
- XMLs reais de NF-e ou NFS-e;
- Imagens ou fotos de notas/cupons;
- Extratos bancarios;
- Comprovantes de pagamento;
- Planilhas de prestacao de contas reais;
- Capturas de tela contendo dados fiscais reais (mesmo parcialmente visiveis).

Vazamento de qualquer um destes documentos pode:

- expor PII de fornecedores MEI (nome do empresario, CPF mascarado nem sempre suficiente);
- expor relacoes comerciais de unidades escolares com fornecedores;
- expor valores de execucao financeira antes de prestacao oficial;
- violar a Lei Geral de Protecao de Dados (LGPD) para dados pessoais embutidos;
- comprometer a auditoria oficial caso versoes preliminares vazem.

## 2. Pasta local permitida

A pasta para amostras reais locais (uso privado em desenvolvimento) e:

```
.local/fiscal-samples/
```

Esta pasta:

- **e ignorada pelo Git** por meio das regras adicionadas em `.gitignore` no PR #58 (`*.local`, `.local/`, `.local/fiscal-samples/`, `*.local.pdf`, `*.local.xml`, `*.local.jpg`, `*.local.jpeg`, `*.local.png`);
- nao tem versionamento; e responsabilidade do desenvolvedor manter backup pessoal se desejar;
- nao deve ser sincronizada com servicos de cloud nao revisados (OneDrive corporativo gerenciado pode ser aceitavel; pastas pessoais em servicos publicos nao);
- nao deve ser compartilhada via Slack/Teams/email sem autorizacao.

A pasta `tools/fiscal-extraction/samples/` (no PR #58 do Codex) e **diferente**: ela contem apenas amostras **sinteticas** versionadas com o codigo. Nao misturar os dois conjuntos.

Todos os exemplos versionados devem declarar explicitamente que nomes, CNPJs, chaves, datas, valores e descricoes sao ficticios. Mesmo quando um CNPJ sintetico valida pelo algoritmo, ele nao deve ser tratado como escola, CEC, fornecedor ou entidade real.

## 3. Categorias minimas de amostras

Para que o PoC e a versao institucional cubram a variedade real de documentos fiscais que escolas da 4a CRE recebem, o corpus deve conter pelo menos uma amostra de cada categoria abaixo. Idealmente 2-3 amostras por categoria para detectar variacao intra-categoria.

Para NFS-e, o alvo futuro principal e NFS-e Nacional / Padrao DPS. Nota Carioca, NFS-e Rio e outros formatos municipais devem ser tratados como legado, transicao ou caso confirmado por fonte oficial. O corpus precisa admitir multiplos formatos durante esse periodo, sem assumir que um layout municipal especifico sera a arquitetura definitiva.

| # | Categoria | Descricao | Por que e necessaria |
|--:|---|---|---|
| 1 | XML de NF-e (modelo 55) | Mercadoria/produto, com chave de acesso e protocolo de autorizacao | Fonte preferencial; valida o caminho XML estruturado |
| 2 | PDF digital de NF-e (DANFE) | DANFE gerado com texto selecionavel | Caminho mais comum; valida extracao PyMuPDF/pdfplumber |
| 3 | XML de NFS-e / DPS | NFS-e Nacional / Padrao DPS quando disponivel; legado municipal apenas quando confirmado | Servicos sao parte significativa das despesas escolares; valida caminho estruturado preferencial |
| 4 | PDF de NFS-e | DANFE-NFS-e digital, incluindo transicao entre padrao nacional e legados municipais | Layouts variam; testa fallback textual sem definir municipio como padrao futuro |
| 5 | PDF escaneado de NF-e/NFS-e | Documento que veio escaneado, sem camada de texto | Caso real comum quando escola recebe nota em papel; exige OCR |
| 6 | Imagem/foto de nota (JPG/PNG) | Foto de celular de um cupom ou DANFE | Caso real quando nao ha PDF disponivel; pior qualidade |
| 7 | Cupom fiscal simples | Cupom de mercado/papelaria sem chave de acesso | Caso de baixa estrutura; teste de heuristica textual |
| 8 | Recibo simples | Recibo manual ou digital sem layout fiscal estruturado | Pior caso; testa bloqueio por ambiguidade |
| 9 | Documento com tabela de itens densa | NF-e com 10+ itens em layout tabular | Teste de pdfplumber em tabelas |
| 10 | Documento de baixa qualidade | Imagem borrada, PDF rotacionado, scan com sombras | Teste de bloqueio por qualidade da fonte |

Categorias **opcionais** para fases posteriores:

- Boleto bancario (pagamento, nao despesa fiscal direta — pode aparecer junto com NF).
- Extrato bancario (para conciliacao futura, fora do escopo da extracao fiscal stricto sensu).
- Documento com duplicidade artificial (mesmo conteudo com nome de arquivo diferente, para testar dedup por hash).

## 4. Quantidade recomendada

| Fase | Minimo | Ideal |
|---|---|---|
| **PoC tecnico inicial** (mecanica de parsing) | 10 documentos | 20-30 documentos |
| **PoC com dados reais anonimizados** (medir acuracia real) | 20 documentos por categoria principal | 50+ por categoria principal |
| **Avaliacao pre-institucional** (decisao go/no-go) | 100 documentos cobrindo todas as categorias da secao 3 | 200+ documentos com distribuicao realista |

Distribuicao por categoria sugerida para o PoC inicial (20 documentos):

- 5x XML NF-e
- 5x PDF digital NF-e (DANFE)
- 3x PDF/XML NFS-e, priorizando NFS-e Nacional/DPS e mantendo legado municipal apenas como transicao identificada
- 3x PDF escaneado
- 2x imagem
- 1x cupom simples
- 1x recibo simples

Esta distribuicao reflete uma hipotese inicial para desenvolvimento, nao uma verdade estatistica consolidada. Deve ser ajustada conforme amostragem real disponivel e conforme a transicao entre NFS-e Nacional/DPS e formatos municipais legados.

## 5. Manifesto local de amostras

Para cada arquivo em `.local/fiscal-samples/`, o desenvolvedor deve manter um manifesto local em:

```
.local/fiscal-samples/manifest.local.json
```

Este manifesto:

- **e ignorado pelo Git** (extensao `.local.json` cai na regra `*.local.json` ou pode ser adicionada se nao casar; verificar `.gitignore` antes de criar);
- registra o que cada amostra contem, **sem incluir o conteudo sensivel**;
- serve como gabarito para medir acuracia da extracao;
- e exclusivo para uso privado durante desenvolvimento;
- nao deve ser compartilhado.

### Esquema do manifesto

```jsonc
{
  "version": "1.0",
  "updated_at": "2026-05-15T14:30:00-03:00",
  "samples": [
    {
      "file_name": "nfe-001.local.xml",
      "document_kind": "nfe_xml",
      "category": "xml_nfe_modelo_55",
      "expected_supplier_cnpj": "11222333000181",
      "expected_supplier_name_partial": "ALFA*PEDAGOGICOS",
      "expected_recipient_cnpj": "04252011000110",
      "expected_document_number": "1234",
      "expected_issue_date": "2026-05-15",
      "expected_access_key": "35260511222333000181550010000012341123456789",
      "expected_total_value": "1234.56",
      "expected_has_items": true,
      "expected_item_count": 2,
      "anonymization_applied": false,
      "source": "fornecedor_real_documento_real",
      "notes": "DANFE eletronico padrao; layout SEFAZ-SP"
    },
    {
      "file_name": "danfe-borrado-002.local.pdf",
      "document_kind": "nfe_pdf_scanned",
      "category": "pdf_escaneado",
      "expected_supplier_cnpj": "REDACTED",
      "expected_supplier_name_partial": "REDACTED",
      "expected_recipient_cnpj": "REDACTED",
      "expected_document_number": "REDACTED",
      "expected_issue_date": "REDACTED",
      "expected_total_value": "REDACTED",
      "expected_has_items": null,
      "anonymization_applied": true,
      "source": "amostra_anonimizada_para_compartilhamento_futuro",
      "notes": "Scan rotacionado 7 graus; sombra horizontal na parte superior; usar para testar bloqueio por qualidade"
    }
  ]
}
```

### Campos do manifesto

- `file_name`: nome do arquivo na pasta `.local/fiscal-samples/`.
- `document_kind`: identificador curto (`nfe_xml`, `nfe_pdf`, `nfse_xml`, `nfse_pdf`, `cupom`, `recibo`, `imagem_jpg`, `pdf_escaneado`).
- `category`: corresponde a categoria da secao 3.
- `expected_*`: gabarito para comparar com o que a extracao produz. Use `REDACTED` para amostras anonimizadas que serao posteriormente compartilhadas em PRs (se for o caso futuro).
- `expected_supplier_name_partial`: padrao com `*` como wildcard, para evitar registrar a razao social completa quando ela e PII (ex: `JOAO*ME` em vez de `JOAO DA SILVA ME`).
- `anonymization_applied`: booleano indicando se o arquivo passou pelo processo de anonimizacao da secao 6.
- `source`: descricao curta da origem da amostra (`amostra_sintetica`, `fornecedor_real_documento_real`, `amostra_anonimizada_para_compartilhamento_futuro`).
- `notes`: observacoes para o desenvolvedor (caracteristicas do layout, problemas conhecidos).

## 6. Criterios de anonimizacao

Caso seja necessario evoluir uma amostra real para conjunto compartilhavel (ex.: contribuir com um teste publico no PoC), a amostra deve passar por anonimizacao **antes** de sair de `.local/fiscal-samples/`.

### 6.1. O que apagar ou mascarar

- Nomes reais de fornecedores: substituir por nomes sinteticos do tipo `ALFA PEDAGOGICOS LTDA`, `BETA SERVICOS DE LIMPEZA EIRELI`.
- Nomes reais de escolas: substituir por nomes ficticios do tipo `ESCOLA MUNICIPAL ALFA`, `ESCOLA MUNICIPAL BETA`.
- CNPJs reais: substituir por CNPJs **sinteticos validos** (passam pelo algoritmo de digitos verificadores mas nao correspondem a empresas reais conhecidas). Para gerar: usar geradores de CNPJ valido sintetico amplamente disponiveis ou calcular manualmente com os digitos verificadores oficiais.
- Numero da nota fiscal real: substituir por `1234`, `5678`, etc.
- Chave de acesso real: substituir por chave **sintetica valida** (com a estrutura SEFAZ correta apos substituicao dos CNPJ e numero embutidos).
- Datas reais: substituir por datas sinteticas dentro de faixa razoavel (`2026-05-15`, `2026-04-10`).
- Valores reais: substituir por valores sinteticos plausiveis para o tipo de despesa.
- Enderecos completos: substituir por enderecos genericos (`Rua Alfa, 123 - Centro`).
- Telefones, emails, websites do fornecedor: substituir ou redatar (`(00) 0000-0000`, `contato@fornecedorsintetico.exemplo`).
- Dados pessoais embutidos (MEI com nome do empresario): substituir nome.
- Codigos de barras, QR codes que codifiquem dados sensiveis: regerar com dados sinteticos correspondentes OU borrar e marcar como `[QR REDACTED]`.

### 6.2. O que pode manter

- Estrutura visual do layout original (posicao de campos, fontes, separadores).
- Codigos CFOP, CSOSN, CST (sao publicos, nao sensiveis).
- Padrao do municipio para NFS-e.
- Aparencia de qualidade (sombra, rotacao, baixa resolucao) que se quer testar.

### 6.3. Verificacao pos-anonimizacao

Antes de mover uma amostra anonimizada para um conjunto compartilhavel:

1. Buscar no documento (texto extraido, OCR) por padroes que costumam revelar dados:
   - CPF (`\d{3}\.?\d{3}\.?\d{3}-?\d{2}`);
   - Telefones (`\(\d{2}\)\s*\d{4,5}-?\d{4}`);
   - Emails (`[\w.]+@[\w.]+`);
   - Enderecos com numero de imovel especifico.
2. Conferir manualmente metadados do arquivo: `pdfinfo` (PyMuPDF) pode revelar autor, criador, datas; remover quando relevante.
3. Conferir nomes de arquivo: nao incluir nome original na anonimizacao.
4. Se o documento for imagem, conferir EXIF (rotacao, modelo de cellular, coordenadas GPS): remover ou normalizar.

### 6.4. Quando NUNCA tentar anonimizar

- Quando o documento contem dados pessoais sensiveis (saude, religiao, opcao sexual, dados de menores de idade que nao aparecem normalmente em nota fiscal mas podem aparecer em recibos especificos): nao usar como amostra mesmo apos tentativa de anonimizacao.
- Quando o documento ja foi compartilhado em fluxo oficial com agencia reguladora: anonimizacao para uso de desenvolvimento e admissivel privadamente, mas qualquer compartilhamento posterior exige autorizacao formal.

## 7. Criterios de avaliacao do corpus

Para que o corpus cumpra seu papel de medir a qualidade da extracao, deve permitir calcular as metricas definidas em `fiscal-extraction-validation-protocol.md` secao 10.

### 7.1. Cobertura de categorias

Antes de declarar PoC completo, o corpus deve conter:

- Pelo menos 1 amostra de cada categoria 1-8 da secao 3.
- Pelo menos 1 amostra que dispara cada regra de bloqueio da secao 7 do protocolo de validacao (CNPJ invalido, valor ausente, duplicidade, etc.).
- Pelo menos 1 amostra "limpa" por categoria (sem warnings esperados) para servir de baseline.

### 7.2. Acuracia por campo

Para cada amostra, comparar `expected_*` no manifesto com o que a extracao produziu. Computar:

- `acerto_supplier_cnpj` (binario).
- `acerto_recipient_cnpj` (binario).
- `acerto_document_number` (binario).
- `acerto_issue_date` (binario).
- `acerto_total_value` (binario em centavos).
- `acerto_access_key` (binario, quando aplicavel).
- `acerto_supplier_name` (similaridade Jaccard >= 0,90).
- `acerto_recipient_name` (similaridade Jaccard >= 0,90).
- `taxa_warning` (numero medio de warnings por documento).
- `taxa_bloqueio` (% de documentos marcados como `requer_revisao`).

### 7.3. Falhas por layout

Documentar falhas observadas em formato curto:

- categoria do documento;
- campo que falhou;
- causa provavel (OCR ruim, layout incomum, label ausente, etc.);
- prioridade de correcao (alta/media/baixa).

Este registro permite priorizar melhorias do extrator entre iteracoes.

### 7.4. Iteracao

A medicao de qualidade do PoC deve ser:

1. Rodar a extracao em todo o corpus.
2. Comparar com manifesto.
3. Registrar metricas e falhas.
4. Decidir se ajusta heuristicas, se adiciona OCR/IA fallback, ou se conclui que aquele tipo de documento e melhor revisado manualmente.
5. Repetir.

A iteracao termina quando as metricas da secao 10 do protocolo de validacao sao atingidas OU quando se decide explicitamente que o ganho marginal de uma proxima iteracao nao justifica o esforco.

## 8. Politica de revisao deste protocolo

Pequenas alteracoes (acrescentar categoria, ajustar quantidade recomendada, refinar criterios de anonimizacao) podem entrar junto ao proximo PR funcional.

Mudanca de regra de seguranca (ex.: permitir versionar amostras reais com alguma condicao) exige PR documental dedicado com revisao humana **obrigatoria** e justificativa institucional.
