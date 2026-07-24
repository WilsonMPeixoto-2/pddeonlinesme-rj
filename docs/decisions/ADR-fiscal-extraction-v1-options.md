# ADR Fiscal Extraction v1 — Opcoes Arquiteturais

**Status:** Proposto. Nao decidido. Decisao final exige spikes empiricos e revisao humana institucional.

**Autor:** Claude Opus 4.7 (Claude Code), revisao humana pendente.

**Data:** 2026-05-16

**Repositorio:** WilsonMPeixoto-2/pddeonlinesme-rj

**Branch base:** `main` em `cf80fa3d` (apos merge de PR #61).

## Por que este ADR existe

A frente de extracao fiscal do PDDE Online 2026 entregou em main:

- PoC tecnica Python em `tools/fiscal-extraction/` (PR #58)
- Protocolo de validacao, dicionario de campos, corpus protocol, governance notes (PR #59)
- Amendment alinhando docs com politica 2026 (PR #62)
- Testes unitarios dos validators (PR #61)

Tres pontos da governanca documental publicada **explicitamente exigem decisao arquitetural antes da v1 institucional**:

1. `docs/technical/fiscal-extraction-validation-protocol.md` §1.1: "PoC nao consolida arquitetura institucional definitiva... substituiveis ate avaliacao posterior por Tech Radar e, quando houver impacto de arquitetura, por ADR."
2. `docs/technical/fiscal-extraction-field-dictionary.md` §"Convencoes": "podem ser substituidos ou complementados apos Tech Radar/ADR."
3. `docs/reports/fiscal-extraction-governance-notes.md` §1: "Bibliotecas, OCR, Vision LLM, Document AI, provedor de processamento, modelo de worker e metodos fiscais estruturados devem ser avaliados por Tech Radar e, quando afetarem fronteiras de dados, seguranca, custo ou operacao, por ADR antes da v1 institucional."

Este ADR enderecca as **tres decisoes arquiteturais primarias** identificadas como bloqueadoras para v1 institucional. Outras decisoes (conciliacao bancaria, governance de IA, NFS-e Nacional/DPS, conformidade LGPD especifica, integracao com SiGPC/FNDE) ficam mapeadas como decisoes futuras com criterios de gatilho explicitos.

---

## Decisao 1: Stack tecnologica da v1 fiscal

### 1.1. Problema

O PoC atual e Python (PyMuPDF, pdfplumber, Pydantic, xmltodict, lxml, typer, pytest). O resto do projeto e TypeScript (React 18, Vite, Supabase JS, Tanstack Query, Zod 4). Ate v1 institucional, e preciso decidir se a logica de extracao fiscal permanece em Python como servico backend ou se sera portada para TypeScript para consistencia de stack.

A decisao impacta diretamente:
- Onde o codigo roda em producao (worker Python em Cloud Run/Modal/etc. vs Edge Function/Background Job Vercel em TS);
- Custo de deploy e operacao;
- Curva de aprendizado para a equipe da 4a CRE/SME-RJ;
- Quantos testes do PR #61 sobrevivem para a v1.

### 1.2. Alternativas avaliadas

**A1. Manter Python isolado como servico backend.** Cloud Run, Modal, ou Background Job de provedor externo executa o codigo do PoC adaptado. Front TS chama via HTTP/REST/RPC.

- Pros: aproveita PoC atual; PyMuPDF e ecossistema fiscal Python sao maduros; `nfelib` e libs especializadas brasileiras (avaliacao futura) sao quase exclusivamente Python; Pydantic ja faz validacao estrutural.
- Contras: adiciona segundo cloud provider (GCP/Modal/etc. alem de Vercel + Supabase); IAM, billing, monitoring duplicados; secrets sync; cold start em alguns provedores; latencia para usuario.
- Custo aproximado: $5-30/mes em Cloud Run para volume <10k docs/mes da 4a CRE; +$0 se aproveitar tier gratuito; complexidade operacional moderada.

**A2. Portar para TypeScript.** Reescrever `tools/fiscal-extraction/` em TS usando libs equivalentes: `fast-xml-parser` (XML), `pdf-parse`/`pdfjs-dist`/`unpdf` (PDF digital), `tesseract.js` ou serviceless (OCR), `zod` (validacao em substituicao a Pydantic).

- Pros: stack unificada; deploy em Vercel Background Jobs ou Edge Functions sem novo cloud; equipe lida com 1 linguagem; testes ficam em Vitest junto com o resto.
- Contras: PoC atual descartada (~1000 linhas Python + 186 linhas de testes); bibliotecas TS para parsing fiscal brasileiro especifico (NF-e modelo 55) sao menos maduras que `nfelib`; OCR via `tesseract.js` (WASM) tem performance ~3x pior que Tesseract nativo.
- Custo aproximado: 2-3 semanas de portacao + retestes; $0 adicional de infraestrutura.

**A3. Hibrido: TypeScript no frontend e camada fina, Python como worker pesado.** UI de revisao, validacao leve e fluxo de confirmacao em TS; parsing pesado e OCR isolados em servico Python invocado por job assincrono.

- Pros: melhor dos dois mundos para pontos de forte ganho de cada linguagem; cobre o "OCR pesado deve ficar fora do front" do `docs/technical/fiscal-extraction-architecture.md`; mantem PoC atual.
- Contras: duas codebases para manter; deploy/CI/CD mais complexo; coordenacao de tipos entre Pydantic e Zod (manualmente ou via codegen tipo `datamodel-code-generator`).
- Custo aproximado: setup inicial mais alto; operacao em regime moderadamente mais cara que A1; manutencao de longo prazo mais cara que A2.

### 1.3. Direcao preliminar recomendada

Sem decisao final ate spike empirico. Direcao **A3 (hibrido)** parece mais alinhada com o estado atual:
- preserva PoC ja validado em main;
- nao for ca portagem cega para TS antes de saber o que de fato vai virar producao;
- respeita principio "OCR pesado fora do front" ja documentado;
- mantem espaco para adotar libs fiscais Python especializadas (NF-e parsing schema-validated).

Mas A2 (TS) ganha forca **se**:
- volume real for muito menor que estimado (<2k docs/mes total na 4a CRE);
- equipe nao quiser operar Python em producao;
- bibliotecas TS para parsing fiscal brasileiro amadurecerem.

### 1.4. Consequencias

Adotando A3:
- Marco 6B (Auth/RLS final) precisa contemplar autenticacao entre frontend TS e servico Python (JWT do Supabase encaminhado, ou service-to-service via API key);
- Decisao de provedor para o worker Python fica pendente (Cloud Run, Modal, Vercel Background Jobs, Supabase Edge Functions com Python via Deno+Pyodide se viavel);
- ~1000 linhas Python do PoC continuam validas;
- Testes do PR #61 (Python pytest) continuam validos.

Adotando A2:
- PoC atual e descartada;
- Equipe e responsavel por reescrita;
- Stack unificada simplifica operacao mas reduz acesso a libs fiscais Python especializadas.

### 1.5. Criterios para transformar em "Aceito"

- Spike `spike/fiscal-stack-deploy-comparison` executado: deploy do PoC atual em pelo menos 2 alternativas (ex: Cloud Run + Vercel Background Job) com medicao de cold start, custo per invocation, latencia P95;
- Avaliacao da maturidade de `nfelib` (e equivalentes) versus `fast-xml-parser` + helpers manuais para validacao schema NF-e;
- Decisao institucional sobre suporte operacional: equipe da 4a CRE pode/quer manter Python em producao?
- Volume real estimado para 12 meses apos Marco 6B.

---

## Decisao 2: Fonte primaria do documento fiscal

### 2.1. Problema

A POC parseia XML enviado pelo usuario e texto extraido de PDF. Para v1 institucional, e preciso decidir **qual e a fonte primaria oficial** dos documentos fiscais que alimentam a prestacao de contas. A decisao afeta confiabilidade, custo, complexidade legal, e custo per documento.

### 2.2. Alternativas avaliadas

**B1. XML/PDF enviado pelo operador escolar.** Status quo do PoC. Operador faz upload via UI; sistema parseia.

- Pros: zero dependencia de servico externo; zero custo per documento; nenhuma autorizacao especial; funciona offline.
- Contras: depende de coleta manual do XML pelo operador (NF-e modelo 55 vem por email do emissor, mas operador precisa buscar); cupons/recibos sem XML viram OCR; risco de upload de arquivo errado ou intencionalmente alterado.
- Custo: $0 per documento. Custo operacional alto (trabalho do operador para buscar XML).

**B2. Consulta SEFAZ por chave de acesso (DFe).** Operador informa a chave de acesso (44 digitos, presente no DANFE como QR code ou texto). Sistema consulta SEFAZ ou API terceirizada e recebe XML oficial autoritativo.

- Pros: XML schema-validated direto da fonte oficial; sem dependencia de coleta manual do operador; nao depende de OCR para campos criticos; rastreabilidade total.
- Contras: SEFAZ exige certificado digital A1/A3 do destinatario (= escola, nao 4a CRE) para distribuicao DFe oficial; alternativa "consulta publica por chave" tem rate limit agressivo e nao retorna XML completo; APIs terceirizadas (ex: Migrate, NFE.io, FocusNFe, Tecnospeed) cobram por consulta mas resolvem certificado e rate limit.
- Custo: certificado digital A1 ~R$ 200/ano por unidade escolar (163 unidades = ~R$ 32k/ano); OU APIs terceirizadas $0,02-0,10 per consulta com volume.
- Risco juridico/operacional: quem custodia certificado digital da escola? Quem responde por consulta indevida? Auditoria de uso?

**B3. Combinacao B1 + B2.** Operador faz upload normal; sistema tambem aceita "informar so a chave" como fallback para coleta facilitada.

- Pros: aproveita o melhor de ambos; B2 como opcional, B1 como default.
- Contras: duas codepaths para manter; UI mais complexa; politica de "quando usar B2" precisa ser explicita.

**B4. NFS-e Nacional / Padrao DPS por API.** Para servicos (NFS-e), a partir de 2026 ha o padrao nacional unificado de DPS-NFSe substituindo a fragmentacao municipal. Tem API oficial de consulta.

- Pros: padrao nacional unificado; alvo correto para servicos (escolas pagam servicos: manutencao, transporte de evento, etc.);
- Contras: nao cobre NF-e (mercadoria); NFS-e antiga (Nota Carioca por exemplo) precisa de adaptador legado por periodo de transicao; documentacao oficial pode mudar.
- Custo: a confirmar via documentacao oficial e spike.

### 2.3. Direcao preliminar recomendada

Sem decisao final ate spike empirico. Direcao preliminar:
- **Curto prazo (v1 inicial):** B1 (upload manual) como fonte primaria, NF-e XML modelo 55 como tipo principal;
- **Medio prazo (v1.x):** adicionar B2 como opcional (operador informa chave, sistema busca via API terceirizada), apenas se spike provar custo aceitavel e politica institucional aprovar custodia de certificado/uso de servico externo;
- **Medio prazo (v1.x):** adicionar B4 (NFS-e Nacional DPS) para cobrir notas de servico;
- **Sempre:** OCR/Vision como fallback para documentos sem XML estruturado disponivel.

### 2.4. Consequencias

Adotando direcao preliminar:
- Operador continua sendo responsavel pela coleta inicial do XML, com sistema fornecendo extracao assistida;
- Politica institucional pode evoluir para B2 com custos aprovados;
- Sistema arquiteturalmente preparado para multiplas fontes, nao apenas upload.

### 2.5. Criterios para transformar em "Aceito"

- Spike `spike/sefaz-dfe-access-key-resolution` executado: avaliar custo, latencia e cobertura de pelo menos 2 APIs terceirizadas (Migrate, NFE.io, FocusNFe, Tecnospeed) para consulta DFe;
- Documentacao oficial NFS-e Nacional/DPS confirmada (URL oficial, schema, autenticacao);
- Decisao institucional sobre custodia de certificado A1/A3 da escola: PDDE Online custodia? Operador da escola custodia? Terceiro?
- Avaliacao LGPD da consulta a APIs terceirizadas: tratamento de dados pessoais transferidos para terceiro;
- Estimativa de custo total para a 4a CRE em volume real.

---

## Decisao 3: Estrategia OCR / Vision / Document AI

### 3.1. Problema

Para documentos que nao possuem XML estruturado (cupom fiscal, recibo simples, DANFE escaneado sem XML disponivel, foto de nota tirada por celular), e necessario extrair campos por leitura visual. A POC atual nao implementou OCR. Antes da v1 institucional, e preciso decidir a estrategia.

A escolha impacta:
- Acuracia de extracao (varia de ~70% Tesseract local a ~95% Document AI/Vision LLM);
- Custo per documento ($0 local a $0,01-0,15 por documento em servicos cloud);
- Latencia de processamento;
- LGPD/governanca de envio de documento fiscal para servico externo.

### 3.2. Alternativas avaliadas

**C1. Tesseract local.** OCR open-source rodando no proprio worker. Adequado para PDF escaneado limpo; falha em foto de celular, sombras, rotacao.

- Pros: zero custo per documento; zero dependencia externa; LGPD favoravel (documento nao sai do PDDE Online);
- Contras: acuracia limitada (~70-80% em DANFE escaneado tipico); falha total em documentos de baixa qualidade; CNPJ pode confundir `8` com `B`, `0` com `O`; valores com virgula vs ponto sao frageis.

**C2. Google Document AI - Invoice Parser ou Custom Document Extractor.** Servico cloud da Google especializado em extracao de invoice/fatura. Tem modelo pre-treinado para invoice generico (nao especifico para NF-e brasileira) e suporte para custom processor treinado.

- Pros: acuracia alta (~90-95% em invoice generico; >95% com custom training); modelo evolui sem manutencao local; latencia previsivel;
- Contras: dependencia GCP; custo $1,50 per 1000 paginas no Invoice Parser, $30 per 1000 paginas no Custom Document Extractor; documento fiscal vai para servidor Google (LGPD: tratamento por operador estrangeiro = avaliacao especifica de adequacao);
- Custo estimado para 4a CRE (10k docs/ano = ~10k paginas/ano): $15-300/ano dependendo do modelo.

**C3. AWS Textract ou Azure Document Intelligence.** Equivalentes da AWS e Microsoft. Mesma classe de produto.

- Pros: opcoes adicionais; podem ser melhores em formularios brasileiros (Azure tem "prebuilt-invoice"); evitam concentracao em Google.
- Contras: similar a C2 em LGPD/custo; ainda dependencia externa.
- Custo: comparavel a C2.

**C4. Vision LLM (Claude/GPT/Gemini multimodal).** Em 2026, modelos multimodais leem campos de invoice com acuracia >95% inclusive em documentos baixa qualidade. Operacao por API.

- Pros: acuracia maxima na classe; capacidade de "raciocinar" sobre campos ambiguos (ex: distinguir emitente vs destinatario por layout); poucas linhas de codigo de integracao;
- Contras: custo per documento mais alto (~$0,05-0,15); dependencia de provedor LLM; risco de alucinacao (LLM pode "inventar" CNPJ plausivel mas errado se o documento estiver ilegivel); LGPD: documento vai para servidor estrangeiro;
- Risco regulatorio: Lei 14.711/2023 e PL 2338/2023 sobre uso de IA na administracao publica BRA exigem transparencia sobre uso de IA e responsabilidade humana sobre decisao. Aplicacao em prestacao de contas publica exige cuidado adicional.

**C5. Hibrido: Tesseract local + Document AI/Vision como fallback.** Pipeline tenta Tesseract; se confidence < threshold, escala para servico externo.

- Pros: minimiza custo por documento; LGPD-friendly como default; escalada controlada;
- Contras: pipeline mais complexo; calibrar threshold exige spike empirico.

### 3.3. Direcao preliminar recomendada

Sem decisao final ate spike empirico. Direcao preliminar:
- **v1 inicial:** **postergar OCR** completamente. Aceitar apenas XML e PDF textual selecionavel. Documentos sem XML ficam para revisao manual (operador digita).
- **v1.x:** adicionar **C5 (hibrido)** com Tesseract local como default e provedor cloud como fallback configuravel apos avaliacao LGPD e custo institucional aprovados.
- **Sempre:** revisao humana obrigatoria em qualquer caso, independente do metodo (politica ja documentada em `validation-protocol.md` §2).

Justificativa para postergar OCR:
- 4a CRE provavelmente recebe maioria de NF-e modelo 55 emitidas eletronicamente (com XML disponivel);
- Cupom fiscal e recibo manual sao minoria do volume;
- Operador digitando manualmente 5-10% dos documentos e operacionalmente aceitavel para PoC institucional;
- Postergar OCR economiza decisao LGPD complexa para v1.x;
- Reduz risco de "falsa confianca em OCR alto-acerto" (R6 e R7 do `governance-notes.md`).

### 3.4. Consequencias

Adotando postergacao:
- v1 inicial nao processa documentos sem XML/texto;
- UI deve permitir entrada manual completa como fallback (operador preenche todos os campos);
- v1.x recebe spike OCR como tarefa explicita.

Adotando C5 desde v1:
- Spike LGPD/custos antes de codigo;
- Threshold de fallback calibrado em amostras anonimizadas;
- Politica de "documento fiscal pode sair do PDDE Online?" aprovada pelo Setor Juridico/Procuradoria da SME-RJ ou equivalente.

### 3.5. Criterios para transformar em "Aceito"

- Spike `spike/fiscal-vision-document-ai-evaluation` executado: comparar acuracia, custo e latencia de Tesseract, Document AI, Vision LLM em 20+ documentos anonimizados reais;
- Avaliacao LGPD/Lei 14.711 para envio de documento fiscal a servico externo;
- Estimativa de % real do volume que cairia em OCR (documentos sem XML disponivel);
- Decisao institucional sobre uso de IA generativa em fluxo de prestacao de contas (alinhada com regulamentacao 2026).

---

## Decisoes futuras nao cobertas neste ADR

Identificadas como necessarias para v1 institucional **mas fora do escopo deste documento** (cada uma exige ADR proprio quando o tema avancar):

| Tema | Por que e relevante | ADR esperado |
|---|---|---|
| Conciliacao bancaria / Open Banking | Sem conciliacao, extracao fiscal permite "nota fantasma" — despesa declarada sem ter sido paga; Bloqueador real para v1 institucional. APIs Open Finance ou agregadores (Pluggy/Belvo) exigem autorizacao do titular da conta da escola (= diretor/tesoureiro). | `ADR-fiscal-bank-reconciliation.md` |
| NFS-e Nacional DPS adoption | Padrao DPS 2026 substitui Nota Carioca e ISSNet municipais; alvo correto para servicos. Documentacao oficial precisa ser consultada antes de integracao. | `ADR-nfse-national-dps.md` |
| Workflow de aprovacao institucional | Escola -> 4a CRE -> SME -> FNDE; trilha de aprovacao, identidade do aprovador, motivos de rejeicao; sem isso, sistema vira CRUD bonito sem governanca real. | `ADR-fiscal-approval-workflow.md` |
| Export FNDE / SiGPC | Formato final de entrega ao FNDE define schema da `despesas_confirmadas`; sem mapeamento, ha risco de armazenar dados que nao exportam. | `ADR-fiscal-fnde-export.md` |
| Mobile UX / fotografia de nota | Operadores escolares provavelmente fotografam notas com celular; UX mobile-first afeta decisao OCR (qualidade da imagem) e UI de revisao. | `ADR-fiscal-mobile-ux.md` |
| Politica de retencao e LGPD para documentos fiscais | Documentos podem conter CPF (MEI), endereco residencial (MEI), valores; retencao legal de 5 anos pos-prestacao vs LGPD; classificacao de dados pessoais. | `ADR-fiscal-data-retention-lgpd.md` |
| Governanca de uso de IA na administracao publica | Lei 14.711/2023 e PL 2338/2023; transparencia, supervisao humana, registro de uso; especifico para administracao publica brasileira. | `ADR-public-ai-governance-pdde.md` |

## Pre-requisitos para v1 institucional (independente das 3 decisoes acima)

| Pre-requisito | Estado em 2026-05-16 | Bloqueador? |
|---|---|---|
| Marco 6B (Auth/RLS final + roles + guards) | Pendente conforme `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` §6B | **SIM** — sem Auth/roles nao ha como autorizar revisor |
| LGPD/privacy review formal | Nao iniciado | **SIM** — antes de envio de qualquer documento real a servico externo |
| Treinamento operacional de revisores | Nao planejado | Recomendado — sem treinamento, R7 (falsa confianca) materializa |
| Politica de retencao de 5 anos | Nao formalizada | **SIM** — antes de armazenamento real |
| Conversa institucional sobre prioridade da frente | Nao documentada | Recomendado — alocacao de tempo da equipe |

## Politica de evolucao deste ADR

- Adicionar uma decisao nova exige PR documental dedicado.
- Promover uma decisao de "Proposto" para "Aceito" exige: spike concluido, criterios da secao 1.5/2.5/3.5 cumpridos, revisao humana institucional.
- Substituir uma decisao "Aceita" exige novo ADR substituindo o anterior, com motivo explicito no commit.
- Anotacoes pontuais (correcao de URL, typo, nova fonte tecnica) podem entrar junto ao proximo PR documental fiscal.

## Restricao final

Este ADR e **preliminar**. Nenhuma das tres decisoes esta "Aceita". O documento orienta proximos spikes e mantem a frente fiscal **substituivel ate decisao formal**. Codigo da POC continua valido como spike controlado.

Nao mergear este ADR como decisao definitiva. Mergear como **registro de opcoes em aberto** para a frente.
