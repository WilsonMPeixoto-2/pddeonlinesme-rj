# Protocolo de Validacao da Extracao Fiscal

Atualizado em: 2026-05-16

## 1. Finalidade

Definir como avaliar se uma extracao fiscal pode ser usada como **dado assistido** na prestacao de contas do PDDE Online 2026.

Este documento e o gate de qualidade da frente de extracao fiscal. Ele e complementar a:

- `docs/technical/fiscal-extraction-architecture.md` (Codex), que descreve **componentes e fluxos** da POC tecnica;
- `docs/technical/fiscal-extraction-field-dictionary.md`, que descreve **cada campo individual** com tipo, validacao e risco;
- `docs/technical/fiscal-sample-corpus-protocol.md`, que descreve **como montar o conjunto de amostras** sem vazar dados reais;
- `docs/reports/fiscal-extraction-governance-notes.md`, que descreve **riscos e controles institucionais**.

Este protocolo nao cria infraestrutura, nao altera Supabase, nao altera UI, nao altera Auth/RLS, nao altera Vercel e nao toca o gerador do Demonstrativo Basico.

### 1.1. Escopo arquitetural

O PoC fiscal atual nao consolida arquitetura institucional definitiva. Bibliotecas, provedores, heuristicas, workers e formatos intermediarios usados em `tools/fiscal-extraction/` continuam substituiveis ate avaliacao posterior por Tech Radar e, quando houver impacto de arquitetura, por ADR.

O objetivo deste PR documental e definir a regua de validacao, governanca e aceite da frente fiscal. Ele nao escolhe definitivamente ferramentas, nuvem, motor de OCR, provedor de Document AI, bibliotecas fiscais especializadas ou modelo de banco.

## 2. Regra central

> Extracao automatica **nunca** vira dado oficial sem revisao humana.

Em prestacao de contas publica do PDDE, todo campo critico (CNPJ, numero da nota, data de emissao, chave de acesso, valor total) precisa de **confirmacao explicita** por um servidor autorizado antes de alimentar qualquer registro tratado como oficial.

Esta regra precede toda decisao tecnica subsequente. Se uma futura implementacao quebrar esta regra, ela e nao-conforme com este protocolo, independentemente da acuracia tecnica que apresente.

## 3. Fluxo de validacao

```txt
arquivo fiscal
  -> extracao automatica
  -> campos sugeridos (com confidence por campo)
  -> revisao humana
  -> confirmacao explicita
  -> dado oficial (rastreavel, auditavel, imutavel)
```

Pontos obrigatorios do fluxo:

1. Toda extracao gera **campos sugeridos**, nao dados oficiais.
2. Cada campo carrega seu proprio nivel de confianca.
3. A revisao humana ocorre por **operador autorizado** com vinculo a unidade ou perfil administrativo equivalente.
4. A confirmacao gera um **registro imutavel** com timestamp, usuario e estado anterior.
5. Apenas dados confirmados podem alimentar `despesas`, demonstrativos, conciliacoes ou exportacoes oficiais (SiGPC, FNDE).

## 4. Niveis de status

Toda extracao deve transitar entre status explicitos. Status sugerido para a futura tabela de extracoes:

| Status | Descricao | Pode virar oficial? |
|---|---|---|
| `extraido` | Extracao concluida; campos sugeridos disponiveis | Nao |
| `requer_revisao` | Pelo menos um campo critico esta bloqueado ou em baixa confianca | Nao |
| `confirmado` | Servidor revisou e confirmou todos os campos criticos | Sim |
| `rejeitado` | Documento ilegivel, duplicado, fora de escopo ou recusado pelo revisor | Nao |
| `substituido` | Foi substituido por uma nova extracao do mesmo documento (versao mais recente) | Nao; ver versao corrente |

Transicoes proibidas:

- `extraido -> confirmado` direto, sem passar por revisao humana.
- `confirmado -> extraido` (uma vez confirmado, e imutavel; correcoes geram nova versao com status `substituido` para a anterior).
- `rejeitado -> confirmado` sem nova extracao.

## 5. Criterios de acuracia por campo

Avaliacao do PoC e versoes futuras deve medir cada campo separadamente, nao acuracia global do documento.

| Campo | Tolerancia | Justificativa |
|---|---|---|
| `supplier_cnpj` (CNPJ do fornecedor) | **Correspondencia exata** com digitos verificadores validos | Identifica entidade; um digito errado vira outra empresa |
| `recipient_cnpj` (CNPJ do destinatario, quando existir) | **Correspondencia exata** com digitos verificadores validos | Deve bater com CNPJ da unidade escolar destinataria |
| `document_number` (numero da nota) | **Correspondencia exata** | Controle de duplicidade depende disso |
| `issue_date` (data de emissao) | **Correspondencia exata** | Conferencia com periodo da prestacao; janela fiscal e estrita |
| `total_value` (valor total) | **Correspondencia exata em centavos** | Diferenca de 1 centavo ja indica erro de parsing |
| `access_key` (chave de acesso 44 digitos, quando existir) | **Correspondencia exata** | Rastreabilidade SEFAZ; tambem usada para detectar duplicidade |
| `supplier_name` (razao social do emitente) | **Variacao textual pequena admitida** | Acentuacao, abreviacao, maiusculas/minusculas podem variar |
| `recipient_name` (razao social do destinatario) | **Variacao textual pequena admitida** | Mesmo criterio acima |
| `items[*].description` (descricao do item) | **Parcial admitida no PoC** | Itens variam muito; mapeamento de classificacao e trabalho posterior |
| `items[*].total_value` (valor por item) | **Correspondencia exata** quando declarada | Soma dos itens deve bater com `total_value` (regra de consistencia) |

Para campos com tolerancia "exata", a metrica de avaliacao e binaria (acertou/errou). Para campos com tolerancia textual, usar distancia de Levenshtein normalizada ou similaridade de tokens, com threshold a definir no PoC empirico (sugestao inicial: >= 0,90 de similaridade Jaccard sobre tokens normalizados).

## 6. Niveis de confianca

A extracao deve atribuir um nivel de confianca **por campo**, nao apenas global. Recomenda-se a seguinte classificacao:

| Nivel | Threshold sugerido | Permite confirmacao automatica? | Comportamento esperado na UI futura |
|---|---|---|---|
| **alta** | >= 0,95 | Nao para campos criticos; sim apenas para campos auxiliares | Campo pre-preenchido; revisor confirma com 1 clique |
| **media** | 0,70 - 0,94 | Nao | Campo pre-preenchido com destaque visual; revisor confere ativamente |
| **baixa** | < 0,70 | Nao | Campo bloqueado para confirmacao automatica; revisor preenche manualmente conferindo o original |
| **bloqueado** | qualquer | Nao | Marcado explicitamente como invalido por regra de bloqueio (ver secao 7) |

Os thresholds sao iniciais. O PoC deve medir empiricamente em amostras reais (anonimizadas) e ajustar antes de qualquer integracao com fluxo oficial.

A pontuacao por campo deve considerar:

- presenca do valor (campo nao-vazio);
- validade estrutural (formato, comprimento, digitos verificadores);
- coerencia cruzada com outros campos (ex.: chave de acesso codifica CNPJ do emitente, data e numero);
- metodo e confiabilidade da fonte. A ordem arquitetural inicial e:
  1. XML oficial enviado diretamente;
  2. XML/documento fiscal obtido por fonte estruturada confiavel;
  3. NFS-e Nacional / Padrao DPS;
  4. chave de acesso, DFe, consulta fiscal ou API terceirizada, conforme viabilidade juridica e tecnica;
  5. PDF textual;
  6. Vision LLM, Document AI ou OCR moderno como fallback;
  7. OCR tradicional apenas quando fizer sentido tecnico e economico;
- presenca de warnings emitidos pelo validador.

Confianca **global** do documento, se reportada, deve ser a **media ponderada** dos campos criticos, nao a media simples.

## 7. Criterios de bloqueio

A extracao deve ser marcada como **baixa confianca** ou **bloqueada para confirmacao automatica** quando qualquer das condicoes abaixo for satisfeita:

### 7.1. Bloqueio por validacao estrutural

- CNPJ do fornecedor ou do destinatario com digitos verificadores invalidos.
- CNPJ com 14 digitos iguais (`00000000000000`, `11111111111111` etc.).
- Numero da nota ausente ou nao-numerico (quando o tipo de documento exige numero).
- Data de emissao ausente, em formato nao reconhecido ou claramente fora de faixa (ex.: ano < 2020 ou ano > ano corrente + 1).
- Valor total ausente, zero, negativo ou nao parseavel.
- Chave de acesso com comprimento diferente de 44 digitos quando declarada.

### 7.2. Bloqueio por inconsistencia

- Multiplos valores totais conflitantes no mesmo documento (ex.: `vNF` no XML difere da soma dos itens).
- Chave de acesso presente mas que nao codifica o CNPJ do emitente extraido (verificacao posicional dos digitos 7-20 da chave).
- Data de emissao no XML difere da data extraida do PDF associado.
- CNPJ do destinatario nao corresponde ao CNPJ de nenhuma unidade escolar da 4a CRE (validacao cruzada com cadastro).

### 7.3. Bloqueio por qualidade da fonte

- Documento ilegivel (OCR retorna texto vazio, abaixo de N caracteres ou com taxa de caracteres nao-imprimiveis acima de threshold).
- Imagem com resolucao abaixo de N DPI estimado.
- PDF com camada de texto ausente E imagem ilegivel para OCR.

### 7.4. Bloqueio por ambiguidade

- Fornecedor e destinatario invertidos suspeitos (texto desorganizado, sem labels claros).
- Multiplos CNPJs no documento sem identificacao clara de papel.
- Tipo de documento nao identificavel (nao e NF-e, NFS-e, cupom, recibo, nem boleto reconhecivel).

### 7.5. Bloqueio por duplicidade

- Documento ja extraido anteriormente para a mesma unidade no mesmo exercicio, com a mesma chave de acesso OU mesmo (CNPJ emitente + numero + data + valor).
- Hash SHA-256 do arquivo bate com um arquivo ja registrado em `documentos_fiscais`.

## 8. Criterios de aceite para o PoC

O PoC tecnico em `tools/fiscal-extraction/` (Codex, PR #58) deve cumprir, antes de qualquer evolucao para producao:

| Criterio | Como medir |
|---|---|
| Extrai CNPJ, numero, data e valor total corretamente em amostras XML sinteticas | 100% de acerto em `synthetic_nfe.xml` (ja medido em PR #58) |
| Extrai os mesmos campos em amostras textuais sinteticas | 100% de acerto em `synthetic_nf_text.txt` (ja medido em PR #58) |
| Registra warnings quando campo essencial faltar | Validar via `validate_result()` nos testes unitarios |
| Nao promete acerto total | README e relatorio devem listar limitacoes explicitas (ja feito em `docs/reports/fiscal-extraction-poc.md`) |
| Nao grava em banco de dados | Codex confirmou em PR #58: nenhuma chamada Supabase no codigo |
| Nao alimenta o Demonstrativo oficial | Codex confirmou em PR #58: gerador do Demonstrativo nao foi tocado |
| Distingue formalmente origens da POC (`xml`, `pdf_text`, `manual_text`, reservando OCR/imagem para futuro) | CLI aceita extensoes `.xml`, `.pdf`, `.txt` separadamente e o modelo registra `source_type` granular |
| Tem testes automatizados isolados | `pytest tools/fiscal-extraction/tests` deve passar (6 testes verificados em PR #58) |

## 9. Criterios de aceite para versao institucional futura

Antes de qualquer integracao com prestacao de contas oficial, a versao institucional deve cumprir:

### 9.1. Governanca de dados

- Revisao humana obrigatoria por campo critico, com confirmacao explicita registrada com timestamp e identidade do revisor.
- Trilha de auditoria imutavel: toda transicao de status, toda correcao manual, toda confirmacao deve ser registrada em `audit_logs` (tabela conceitual descrita em `docs/reports/fiscal-extraction-governance-notes.md`).
- Hash SHA-256 do arquivo original calculado no upload e armazenado em `documentos_fiscais.file_hash`; arquivos identicos nao podem ser reenviados sem motivo registrado.
- Soft-delete com motivo, nunca hard-delete; politica de retencao minima de 5 anos apos prestacao final (alinhado com exigencia institucional do PDDE).

### 9.2. Validacao cruzada

- Comparacao automatica com cadastro de unidades para `recipient_cnpj`.
- Deteccao de duplicidade por chave de acesso, por hash de arquivo e por combinacao (CNPJ emitente + numero + data + valor).
- Vinculo obrigatorio com unidade escolar, exercicio e programa antes de qualquer confirmacao.
- Conciliacao com extrato bancario antes de marcar uma despesa como liquidada (movimentacao com data, valor e fornecedor correspondentes).

### 9.3. Apresentacao da revisao

- UI de revisao deve mostrar o documento original (PDF/imagem renderizada) lado a lado com os campos extraidos.
- Cada campo deve mostrar valor sugerido, nivel de confianca e historico de correcoes anteriores (se houver).
- Atalhos de teclado para confirmacao rapida em campos de alta confianca, mas sem permitir "confirmar tudo" sem leitura nos campos criticos.
- Bloqueio de submissao quando algum campo critico permanecer em status `requer_revisao`.

### 9.4. Logs e correcoes

- Toda correcao manual deve registrar valor original (sugerido pela extracao), valor confirmado pelo revisor e diferenca.
- Series temporais de correcoes por campo devem alimentar metricas de qualidade da extracao para ajuste de thresholds e prioridade de melhorias.

### 9.5. Conformidade institucional

- Politica de privacidade revisada para CNPJ, razao social, valores e itens (dados de fornecedor podem incluir PII em casos de MEI).
- Alinhamento com formato de exportacao final (SiGPC/FNDE) verificado antes da implementacao do export.
- Revisao humana obrigatoria para regras documentais oficiais (mantida do princípio geral do projeto, conforme `AGENTS.md`).

### 9.6. Avaliacao tecnica antes da v1 institucional

Antes da v1 institucional, escolhas feitas no PoC devem ser reavaliadas como decisao tecnica, nao herdadas automaticamente. Devem entrar em Tech Radar:

- NFS-e Nacional / Padrao DPS como alvo principal de NFS-e, com periodo de transicao para formatos municipais legados;
- Nota Carioca / NFS-e municipal do Rio como legado ou caso confirmado por fonte oficial, nao como padrao futuro assumido;
- DFe, SEFAZ, distribuicao, consulta por chave e APIs terceirizadas;
- bibliotecas fiscais especializadas versus parsing XML manual;
- XML oficial como fonte preferencial;
- Vision LLM, Document AI, OCR tradicional e extracao textual;
- armazenamento de XML oficial e politica de retencao;
- confidence ponderada por campo;
- processamento em lote versus revisao unitaria.

Devem virar ADR antes de implementacao institucional:

- modelo de arquitetura do processador fiscal (worker, job, backend dedicado ou servico equivalente);
- fronteiras de dados e LGPD para envio de documentos fiscais a servicos externos;
- estrategia de Auth/RLS/Marco 6B para upload, revisao e confirmacao;
- modelo de trilha de auditoria e imutabilidade dos dados confirmados;
- criterio formal para quando um documento pode sair de `requer_revisao`.

## 10. Metricas minimas de avaliacao

Para que o PoC justifique evolucao para versao institucional, deve produzir as seguintes metricas em um conjunto de pelo menos 20 amostras (sinteticas no PoC inicial; reais anonimizadas em fase posterior):

| Metrica | Definicao | Threshold sugerido para avancar |
|---|---|---|
| `taxa_extracao_completa` | % de documentos com todos os campos criticos extraidos | >= 80% |
| `acuracia_cnpj` | % de CNPJs (emitente + destinatario) corretos | >= 95% |
| `acuracia_numero` | % de numeros de documento corretos | >= 95% |
| `acuracia_valor` | % de valores totais corretos em centavos | >= 90% |
| `taxa_falso_positivo_confianca_alta` | % de campos marcados como alta confianca que estavam errados | <= 2% |
| `taxa_bloqueio` | % de documentos que cairiam em `requer_revisao` por regras de bloqueio | aceitavel ate ~30% no PoC (sinaliza prudencia, nao falha) |
| `taxa_duplicidade_detectada` | % de duplicidades genuinas detectadas em conjunto controlado | >= 99% |

Abaixo destes thresholds, a recomendacao e iterar no extrator (regras, heuristicas, eventualmente OCR ou IA fallback) antes de propor integracao oficial.

## 11. Decisao de avanco (go / no-go)

Apos o PoC, a decisao de avanco para fase institucional deve responder explicitamente:

1. **Acuracia atinge thresholds da secao 10?** Se nao, iterar.
2. **Casos bloqueantes sao trataveis por revisao humana razoavel?** Se uma unidade precisar revisar mais de ~30% dos campos extraidos manualmente, o sistema agrega pouco valor; reconsiderar abordagem.
3. **Fontes estruturadas oficiais foram priorizadas antes de PDF/OCR?** XML oficial, NFS-e Nacional/DPS, DFe/consulta fiscal e APIs confiaveis devem ser avaliados antes de ampliar parsing visual.
4. **Captura via chave de acesso, DFe, consulta fiscal ou API terceirizada e factivel?** Se sim, ela pode substituir parte do esforco de OCR e melhorar as metricas; se nao, deve haver justificativa documentada.
5. **Existe vinculo claro com unidade, exercicio e programa?** Sem isso, a extracao nao tem destino.
6. **A trilha de auditoria esta desenhada antes da implementacao?** Sem isso, qualquer extracao confirmada vira divida tecnica institucional.
7. **A revisao humana obrigatoria pode ser operada pela equipe real da 4a CRE?** Carga de revisao deve ser sustentavel.

Apenas com **sim explicito** nestas 7 perguntas a frente avanca para implementacao de UI, Storage e Postgres.

## 12. Relacao com o restante do projeto

Esta frente nao bloqueia e nao depende de:

- Fase 2B (edicao cadastral minima) - independente; contrato em `docs/technical/fase-2b-edicao-cadastral-contrato.md`.
- Marco 6B (Auth/RLS final) - **e prerequisito** para qualquer fluxo de upload real, mas nao para o PoC tecnico local.
- Marco 10B (importador institucional) - frente irma; pode compartilhar componentes de validacao Zod.
- Marcos 11+12 (motor documental) - consome dados confirmados pela extracao; e cliente, nao prerequisito.

O Demonstrativo Basico Individual (PR #43) **nao deve** consumir dados extraidos automaticamente sem revisao humana. Esta restricao permanece valida ate haver implementacao institucional completa conforme secao 9.

## 13. Politica de revisao deste protocolo

Este protocolo deve ser revisado quando:

- O PoC concluir e tiver metricas reais para calibrar thresholds das secoes 6, 7 e 10.
- A frente avancar para versao institucional, exigindo definicoes adicionais sobre roles, policies e formato de export.
- Mudanca regulatoria do FNDE ou TCM-RJ alterar exigencias de prestacao de contas.

Pequenos ajustes de wording sem mudanca de criterio podem ser feitos junto ao proximo PR funcional. Mudanca de threshold, regra de bloqueio ou criterio de aceite exige PR documental dedicado.
