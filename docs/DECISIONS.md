# Decisões vigentes — PDDE Online 2026

> **Fonte canônica das decisões de negócio, dados, UX, segurança e governança do projeto.**

Este documento registra decisões que continuam válidas. Para estado operacional corrente, consulte `.continuity/current-state.json` e `docs/HANDOFF.md`. Para saber qual documento prevalece em caso de conflito, consulte `docs/README.md`.

Decisões históricas que não precisam orientar novas tarefas podem permanecer em `docs/DECISIONS_LOG.md` ou no histórico Git.

---

## 2026-09-18 — Ordem de pagamento não equivale a crédito bancário

**Contexto:** foi recebida evidência externa de 52 unidades do PDDE Básico — Primeira Infância — P2 com valor informado e ordem de pagamento em 14/09/2026, sem data distinta de crédito bancário.

**Decisão:** a interface pode publicar e detalhar essa evidência como **ordem de pagamento emitida** ou **pagamento informado**, com identificação da unidade, valor total, custeio, capital e data da ordem. O rótulo **Pagamento identificado** exige `data_pagamento` conhecida.

**Consequência:** KPIs e cartões gerais de pagamento confirmado não somam evidências que tenham valor informado, mas não tenham data de crédito. O 2º ciclo possui drill-down próprio e pode aparecer no Painel como informação secundária, preservando a 1ª parcela paga como recorte financeiro principal.

**Restrição:** ordem emitida não altera automaticamente `recebido`, saldo disponível, execução financeira, Demonstrativo Básico ou qualquer cálculo que pressuponha dinheiro creditado em conta.

**Referência:** PR #173 e evidência externa versionada de 14/09/2026.

---

## 2026-09-11 — Governança documental e precedência obrigatória

**Contexto:** documentação de maio/junho e handoffs anteriores continuavam se apresentando como estado atual depois dos PRs #129–#132.

**Decisão:** adotar `docs/README.md` como porta de entrada obrigatória e esta ordem de precedência:

1. código, schema/migrations, banco verificado, CI e deployment real;
2. `docs/DECISIONS.md`;
3. `.continuity/current-state.json` e `docs/HANDOFF.md`;
4. documentação técnica do domínio;
5. planos, specs, handoffs e relatórios históricos.

**Consequência:** documentos históricos podem continuar no repositório sem concorrer com a verdade operacional atual.

**Restrição:** não criar novas fontes paralelas de “decisões atuais” ou “estado atual”.

---

## 2026-09-11 — Dados → análise → escola → ação → evidência

**Contexto:** o produto deixou de ser apenas um dashboard e passou a integrar dados financeiros, carteira de escolas, documentos e fluxos de análise.

**Decisão:** a arquitetura de informação do PDDE Online deve seguir a narrativa operacional:

> **Dados → análise → escola → ação → evidência**

**Consequência:** indicadores e agregados relevantes devem ter caminho para detalhe, filtro, escola ou ação operacional. Telas não devem funcionar como vitrines decorativas sem consequência prática.

**Referências:** PRs #128–#132 e `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

---

## 2026-09-11 — Publicar somente dimensões financeiras maduras

**Contexto:** o `pdde-repasse-conciliador` passou a fornecer conjuntos financeiros mais amplos, mas nem toda dimensão possui a mesma cobertura ou maturidade semântica.

**Decisão:** o PDDE Online só promove para a superfície operacional dimensões que cumpram contrato explícito de maturidade e publicação.

Na V1, as cinco dimensões formalizadas são:

- `bank_accounts`;
- `scheduled_repasses`;
- `pdde_basic_first_installment`;
- `pdde_basic_first_installment_breakdown`;
- `pdde_basic_second_installment_programmed`.

**Consequência:** saldo atual, movimentos bancários, crédito localizado e conciliação documento × débito permanecem fora da interface até possuírem contrato próprio e cobertura suficiente.

**Restrição:** dado tecnicamente coletado não é automaticamente dado publicável.

**Referência:** PR #129 e `docs/technical/financial-publication-contract-v1.md`.

---

## 2026-09-11 — Ausência de informação não é zero

**Decisão:** `NULL`/ausência deve permanecer ausência. Zero só representa zero quando a fonte o informa explicitamente.

**Consequência:** a interface usa `—` ou estado equivalente para ausência de dado e não fabrica totais, composição custeio/capital ou situação financeira por preenchimento artificial.

**Aplicação:** financeiro, documentos, importações e qualquer outro domínio em que ausência e zero tenham significados diferentes.

---

## 2026-09-11 — Não iniciar exposição institucional com dados incompletos

**Contexto:** o objetivo institucional é demonstrar controle e confiabilidade. Expor dimensões parciais como se fossem retrato da rede comprometeria essa finalidade.

**Decisão:** a interface inicial deve priorizar informações cuja cobertura e semântica estejam completas para o universo apresentado.

**Consequência:** dimensões ainda em formação podem existir no motor ou na camada de auditoria sem aparecer como KPI principal ou informação conclusiva.

**Restrição:** não preencher lacunas por inferência apenas para completar a interface.

---

## 2026-09-11 — 1ª parcela paga do PDDE Básico como recorte financeiro principal

**Contexto:** o total global de pagamentos podia misturar universos com maturidade diferente.

**Decisão:** enquanto for o recorte integralmente validado, o maior KPI financeiro do Painel utiliza a **1ª parcela paga do PDDE Básico em 2026**, incluindo PDDE Básico e Primeira Infância conforme o contrato operacional.

**Consequência:** data, cobertura e composição custeio/capital do hero devem pertencer ao mesmo universo do valor principal.

**Restrição:** pagamentos parciais de outros programas não contaminam o KPI principal.

**Referência:** PR #130.

---

## 2026-09-11 — Hierarquia financeira e múltiplas contas

**Decisão:** a organização financeira operacional segue:

`escola → programa → ação → parcela → conta`

Uma escola pode possuir múltiplas contas dentro do mesmo programa.

**Consequência:** o modelo e a interface não podem reduzir a relação escola/programa a uma conta única. O atributo de conta principal existe apenas para compatibilidade com fluxos legados que ainda necessitam dele.

**Referências:** PRs #127–#129 e `docs/technical/integracao-financeira-pdde-2026-v1.md`.

---

## 2026-09-11 — Proveniência técnica fora da superfície operacional comum

**Decisão:** workflow run, artifact id, hashes, parser, dataset técnico e metodologia de coleta ficam na camada de auditoria, não na interface cotidiana da GAD.

**Consequência:** a superfície operacional prioriza nomes oficiais, valores, datas, contas, situação e ações úteis.

**Restrição:** esconder metadado técnico da tela não significa descartá-lo da auditoria.

---

## 2026-09-11 — Publicação financeira transacional, idempotente e protegida contra regressão

**Decisão:** a promoção de snapshot financeiro ocorre por uma única operação transacional no Supabase, com:

- validação do destino e da fonte;
- correspondência das 163 escolas;
- validação de duplicidades e vínculos bancários;
- cálculo de maturidade por dimensão;
- proteção contra regressão de cobertura;
- registro de execução/proveniência;
- idempotência por workflow/artifact.

**Consequência:** qualquer invariável bloqueante desfaz a publicação inteira.

**Referência:** PR #129.

---

## 2026-09-18 — Automação financeira ativa por padrão com kill-switch explícito

**Contexto:** a PR #174 alterou o workflow de sincronização para que `repository_dispatch` e o fallback diário sejam elegíveis por padrão. A variável `PDDE_FINANCIAL_SYNC_ENABLED=false` passou a ser o kill-switch explícito.

**Decisão:** o job automático usa a condição `vars.PDDE_FINANCIAL_SYNC_ENABLED != 'false'`. A publicação real continua condicionada aos secrets `PDDE_SUPABASE_URL` e `PDDE_SUPABASE_SERVICE_ROLE_KEY`, à validação do destino, da proveniência, da maturidade e das demais invariáveis financeiras.

**Consequência:** ausência da variável não desativa mais a automação. Uma execução só pode ser descrita como publicada/sincronizada depois de evidência real do workflow e do Supabase; configuração ativa não equivale a publicação comprovada.

**Restrição:** nunca substituir credencial de backend por chave `anon`, ignorar os gates ou afirmar publicação pós-ativação sem verificar `integracoes_financeiras_runs` e os dados promovidos.

**Referência:** PR #174 e `docs/technical/financial-publication-contract-v1.md`.

---

## 2026-09-11 — Busca global deve representar somente o produto real

**Decisão:** `Ctrl/Cmd+K` funciona como localizador operacional para áreas reais e unidades escolares.

**Consequência:** páginas demo, ações “Em breve” e pseudoatalhos não implementados não podem ser anunciados na paleta.

A busca por escola pode usar designação, nome, diretor, INEP e CNPJ, sem carregar dados financeiros/bancários para esse fim.

**Referência:** PR #131.

---

## 2026-09-11 — Preservar contexto entre carteira e ficha da escola

**Contexto:** filtros usados para priorizar escolas eram perdidos ao abrir uma unidade e retornar para a carteira.

**Decisão:** `q` e `status` da carteira são representados na URL e transportados para o detalhe por `return` interno validado.

**Consequência:** breadcrumb e retorno da ficha restauram o mesmo recorte operacional. Digitação/filtros e retorno explícito usam `replace` quando necessário para não poluir o histórico do navegador.

**Restrição:** `return` só aceita a própria carteira (`/escolas` ou `/escolas?...`), rejeitando URL externa, rota filha ou caminho ambíguo.

**Referência:** PR #132.

---

## 2026-09-11 — Indicador relevante precisa de caminho para detalhe

**Decisão:** KPIs, gráficos, cards e resumos relevantes devem, quando tecnicamente aplicável, conduzir ao conjunto de registros, filtro, escola ou ação que explica o indicador.

**Consequência:** visualização agregada deixa de ser fim em si mesma e vira instrumento de priorização da GAD.

**Referência:** Radar de Inteligência Institucional e evolução de Painel/Repasses.

---

## 2026-09-11 — Design institucional não deve reproduzir template genérico de IA

**Decisão:** a interface deve ser moderna, sóbria e original, com hierarquia coerente com a relevância administrativa da informação. Evitar excesso de cards, glows, métricas decorativas e composições genéricas que prejudiquem navegação ou prioridade visual.

**Consequência:** estética é subordinada à clareza, ação, acessibilidade e identidade institucional.

**Referência:** `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

---

## 2026-05-26 — Otimizações de build, zero-latency e governança cadastral

**Decisão:** adotar divisão de bundle para bibliotecas pesadas, prefetching seletivo via React Query e validação cadastral estrita com Zod.

**Consequência:** bibliotecas pesadas devem continuar preferencialmente carregadas sob demanda quando isso trouxer ganho real sem instabilidade.

**Nota de evolução:** decisões de performance devem ser verificadas contra o código atual; tentativas posteriores de code splitting por rota já exigiram rollback. Não tratar números de bundle de maio como baseline atual.

---

## 2026-05-07 — Plano Global e Radar como referência estratégica

**Decisão:** o Plano Global v4.2 e o Radar de Inteligência Institucional estruturam a visão estratégica e os critérios transversais do projeto.

**Consequência:** o Plano continua como baseline de marcos; o estado corrente não deve ser lido de seus status históricos, e sim pelo roteiro de `docs/README.md`.

---

## 2026-05-07 — Backlog adaptativo não autoriza implementação

**Decisão:** backlog registra oportunidades, não autorização de execução.

**Consequência:** toda nova frente exige verificação do estado real, escopo explícito, decisão adequada e PR próprio.

---

## 2026-05-07 — Demonstrativo Básico individual via MEMÓRIA

**Decisão:** preencher a aba `MEMÓRIA` diretamente com dados estruturados, evitando dependência de `BASE`/`XLOOKUP` no arquivo individual.

**Restrição:** arquivo individual não deve depender da aba `BASE`, fórmulas `XLOOKUP`, referências `BASE!` ou `BASE[...]`.

---

## 2026-05-08 — Template público sem dados reais consolidados

**Decisão:** templates publicados em `public/` contêm estrutura e layout, nunca dados reais consolidados das unidades.

**Consequência:** dados reais permanecem no Supabase e são injetados pelo gerador.

---

## 2026-05-07 — ExcelJS para documentos oficiais

**Decisão:** usar `exceljs` no Demonstrativo Básico por necessidade de preservar estrutura, fórmulas, bordas e mesclagens.

**Consequência:** carregamento deve ser sob demanda quando possível para não inflar o bundle inicial.

---

## 2026-05-11 — DocumentsPanel integrado ao gerador real

**Decisão:** geração documental usa hook de dados + gerador isolado + download, sem acoplar regra de geração ao componente visual.

**Consequência:** novos tipos documentais devem seguir separação equivalente.

---

## 2026-05-11 — Tabela `/escolas` com semântica de tabela preservada

**Decisão:** evitar animações/estruturas que quebrem semântica e alinhamento de tabela.

**Consequência:** qualquer animação em linhas deve ser validada visualmente e com acessibilidade antes do merge.

---

## 2026-05-11 — Admin bypass de ruleset é excepcional

**Decisão:** bypass administrativo só pode ser usado de forma excepcional quando checks técnicos e validação operacional estiverem documentados.

**Consequência:** bypass não substitui revisão de código nem CI.

---

## 2026-05-11 — Código e ambiente real prevalecem sobre ferramentas

**Decisão:** nenhuma ferramenta, memória, relatório ou handoff é fonte definitiva de estado funcional.

**Consequência:** código, diff, testes, banco e deployment devem ser consultados quando a decisão depender deles.

---

## 2026-05-11 — Ferramentas por escopo, sem hierarquia fixa

**Decisão:** Codex, Claude Code, Copilot, Cursor, Antigravity ou outras ferramentas podem liderar conforme capacidade e escopo.

**Restrição:** revisão humana permanece obrigatória em segurança, Auth/RLS, secrets, regras financeiras, templates oficiais e decisões arquiteturais.


---

## 2026-09-21 — Snapshot validado é a referência corrente e persistência não pode ocultar fato financeiro novo

**Contexto:** a coleta integral validada do motor passou a informar o 2º ciclo para as 163 unidades da 4ª CRE, totalizando R$ 765.215,00, enquanto a superfície operacional podia continuar exibindo retrato anterior por atraso ou falha na persistência do Supabase. A divergência demonstrou que “coletar”, “persistir” e “mostrar” são etapas diferentes e que sucesso técnico intermediário não equivale a informação tempestiva para o fiscal.

**Decisão:** para o exercício de 2026, o último snapshot validado e publicado pelo `pdde-repasse-conciliador` é a referência corrente de monitoramento. O Supabase permanece a camada relacional, histórica e auditável, mas atraso de persistência não pode impedir a visualização de um fato financeiro já validado.

A cadeia operacional obrigatória passa a ser:

`coleta → validação → snapshot → persistência → view operacional → interface`.

A publicação só é considerada concluída quando há **read-after-write** da mesma view usada pelo frontend e a proveniência, a cobertura, os valores e as datas coincidem semanticamente com o snapshot.

**Tempestividade:** o motor mantém coleta integral diária; o frontend revalida os dados financeiros periodicamente e ao recuperar foco. A meta para convergência da persistência é de até **15 minutos** depois da publicação do snapshot. Atraso acima desse limite é incidente de frescor visível.

**Semântica obrigatória:** `pagamento informado`, `ordem de pagamento` e `crédito bancário confirmado` são evidências distintas. Uma não pode ser promovida artificialmente à outra. Falha de atualização, fonte indisponível ou persistência atrasada nunca podem ser exibidas como zero.

**Maturidade:** fica criada a dimensão `pdde_basic_second_installment_payment_informed`, separada da dimensão de 2ª parcela programada e de futura maturidade para confirmação bancária independente.

**Consequência:** novos fatos financeiros validados devem aparecer no layout mesmo durante atraso de persistência; quando motor e Supabase divergirem, a interface sinaliza o estado de frescor em vez de ocultar o delta.

**Referência:** incidente do 2º ciclo de 21/09/2026 e contrato de publicação financeira por dimensão.
