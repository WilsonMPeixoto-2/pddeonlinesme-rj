# PDDE Online 2026 — Plano Global v4.2

Atualização estratégica após PRs #57–#71, modernização da stack e incorporação do Radar de Inteligência Institucional.

| Campo | Informação |
|---|---|
| Projeto | PDDE Online 2026 |
| Unidade | GAD · 4ª CRE · SME-RJ |
| Natureza | Plano operacional-estratégico e diretriz de execução |
| Versão | v4.2 · Maio/2026 |
| Substitui | `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` (v4.1; mantido como arquivado, não revogado) |
| Anexo obrigatório | `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` |

> A versão 4.2 **atualiza** o Plano Global v4.1 — não o revoga. A estrutura de 15 marcos permanece. O que muda é status, ordem de prioridade e incorporação do Radar como diretriz transversal.

## 1. Síntese executiva

O projeto deixou de ser apenas protótipo visual em busca de backend. Após PRs #57–#71, passou a ter:

- Demonstrativo Básico individual robustecido (hardening do motor + audits sintéticos);
- Edição cadastral mínima com RPC transacional (atomicidade `unidades_escolares` + `contas_bancarias`);
- Stack modernizada (React 19, Vite 7, Vitest 4, jsdom 29);
- `npm audit`: 0 vulnerabilities (xlsx removido, exceljs consolidado);
- POC fiscal isolada com governança e validators;
- Diretriz transversal de inteligência institucional formalizada.

A Supabase Foundation v1 **não é mais frente aberta** — é base operacional consolidada.

A Fase 2B foi implementada e endurecida em código, com migration RPC aplicada em produção; falta smoke UI operacional e atualização de continuidade.

O Dashboard deve evoluir para **Painel Executivo-Operacional GAD**, com indicadores reais, ações executivas e demonstração visual de valor institucional.

O lote dos 163 Demonstrativos deixa de ser hipótese opcional distante e passa a ser **Ação Executiva de Alto Valor**, com pré-checagem, progresso, ZIP, relatório e histórico documental.

A frente fiscal deve ser reposicionada como **Aquisição Fiscal Multicanal** (XML > chave de acesso > QR code > URL oficial > código de barras > PDF textual > OCR > digitação assistida), priorizando fontes estruturadas antes de OCR/Vision.

Toda tarefa futura aplica o **Radar Transversal de Inteligência Institucional**: valor público, fluxo real, solução moderna, acesso, auditoria, acessibilidade, evidência e comunicação de valor.

## 2. Fontes e critérios usados na revisão

- Código-fonte e metadados de PRs no GitHub (#57–#71)
- Documentos internos: Plano Global v4.1, Diagnóstico estrutural, Relatórios de funcionalidades, Radar de Inteligência Institucional
- Referências externas: GOV.UK Service Standard, GOV.UK Design Principles, WCAG 2.2, Supabase RLS docs, Cloud Run Jobs, Google Document AI processors

Critério de revisão: diferenciar fato verificado no código, relato de PR, pendência operacional, hipótese estratégica e recomendação futura.

## 3. Estado real do projeto após PRs #57–#71

| Frente | Estado após revisão | Decisão v4.2 |
|---|---|---|
| Motor documental / Demonstrativo Básico | Robustecido com materialização de fórmulas, remoção de BASE, testes anti cache cruzado | Marco 11/12 **parcialmente concluído** para Demonstrativo Básico; expansão documental continua como frente |
| Fiscal | POC Python isolada, protocolo de validação, validators testados, ADR preliminar em draft | Manter POC/roadmap; reposicionar como **Aquisição Fiscal Multicanal** antes de v1 institucional |
| Cadastro / Fase 2B | Edição cadastral mínima implementada, optimistic update, UI polida, RPC atômica SECURITY INVOKER aplicada em prod | **Fechar operacionalmente** com smoke UI e atualização de continuidade |
| Stack / segurança | React 19, Vite 7, Vitest 4, jsdom 29, xlsx removido, ExcelJS consolidado, 0 vulnerabilities | Manter base; evitar novas majors sem frente própria |
| Governança | AGENTS.md + current-state desatualizados após PR #71 | Atualizar continuidade neste PR documental v4.2, sem espiral |
| Visual / UX | Polimento de diálogo cadastral, skeleton de escolas, Light/Dark preservados | Evoluir de dashboard genérico para painel executivo-operacional e design system operacional |

## 4. Evoluções dos PRs #57–#71

| PR | Contribuição | Impacto estratégico |
|---:|---|---|
| #57 | Hardening do Demonstrativo e contrato técnico da Fase 2B | Reduziu risco documental; criou base para edição cadastral controlada |
| #58 | POC fiscal Python isolada para XML/PDF/texto | Abriu frente de automação fiscal sem contaminar app principal |
| #59 | Governança e validação da extração fiscal | Critérios de confiança, campos e riscos administrativos |
| #61 | Testes para validators fiscais | Protege regras críticas de CNPJ, chave NF-e, valor, data e status |
| #62 | Alinhamento fiscal com arquitetura 2026 | Impediu engessamento em POC; priorizou fontes estruturadas |
| #63 | Edição cadastral mínima | Primeira escrita real autenticada no sistema; sai do painel para sistema de gestão |
| #65–#68 | Atualizações seguras, React 19, Vite 7, Vitest 4, jsdom 29 | Modernização da base técnica e redução de risco |
| #69 | Remoção de xlsx e migração para ExcelJS | Eliminou vulnerabilidade HIGH; reduziu bundle inicial em 21% |
| #70 | Polimento visual do diálogo cadastral e skeleton de escolas | Melhorou percepção de qualidade e clareza operacional |
| #71 | RPC transacional para cadastro com defesa em profundidade | Eliminou risco de estado parcial no update unidade + conta bancária |

## 5. Diretriz-mãe v4.2

> **Toda funcionalidade relevante deve entregar valor operacional E valor institucional visível.** Não basta funcionar: precisa reduzir trabalho, orientar ação, gerar evidência, evitar erro, respeitar perfis, adotar solução moderna e poder ser apresentada como modernização administrativa.

| Dimensão | Pergunta obrigatória | Efeito esperado |
|---|---|---|
| Valor institucional | A Alta Administração percebe o ganho em poucos segundos? | Tela ou função demonstrável em reunião, relatório ou print |
| Trabalho real da GAD | Reduz retrabalho, planilha paralela ou busca manual? | Menos repetição e mais priorização |
| Solução moderna | Há alternativa mais segura, estruturada ou compatível com 2026? | Evita arquitetura pobre ou defasada |
| Organização da informação | O indicador tem caminho para detalhe e ação? | Dashboard vira comando, não vitrine decorativa |
| Acesso e rastreabilidade | Quem vê, edita, gera, baixa e audita? | RLS, guards, logs, histórico e governança proporcional |
| Acessibilidade e visual | É bonito, legível, acessível e institucional? | Ferramenta apresentável sem perder sobriedade pública |

Detalhe operacional do Radar está em `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

## 6. Plano Global v4.2 — mapa marco a marco

| Marco | Nome v4.2 | Status v4.2 | Decisão atualizada |
|---:|---|---|---|
| 0 | Governança, continuidade e radar institucional | Reabrir pontualmente | Atualizar AGENTS, current-state, HANDOFF e Plano para PR #57–#71 e radar transversal |
| 1 | Referência visual institucional | **Concluído**, com evolução controlada | Manter visual aprovado; permitir refinamentos com valor institucional e acessibilidade |
| 2 | Saneamento e dívida técnica operacional | Contínuo | Eliminar resíduos que confundem usuário ou agente; evitar documentação em loop |
| 3 | Design system operacional | Parcial | Consolidar padrões, estados, cards, tabelas, skeletons, microcopy e acessibilidade |
| 4 | Gate técnico permanente | Ativo | `npm test`, `tsc`, `lint`, `build`, `audit` e smoke conforme tipo de mudança |
| 5 | Arquitetura e contratos antes de novas frentes | Reavaliar | Backend/monorepo só com necessidade comprovada; Supabase direto permanece quando seguro |
| 6A | Supabase Foundation | **Concluído** | Base consolidada — não reabrir |
| 6B | Auth/RLS/roles/auditoria/storage | Parcial; **prioritário para expansão** | Marco 6B sobe em importância porque sistema já escreve dados |
| 7 | Monorepo | Pendente condicionado | Não iniciar por inércia; avaliar após contratos do motor, importador e jobs |
| 8 | Backend/API/workers | Pendente condicionado | Criar apenas para operações sensíveis, longas ou com service_role/storage/filas |
| 9A | `/escolas` e `/escolas/:id` por views | **Concluído** | — |
| 9B | **Painel Executivo-Operacional GAD** | **Próxima frente funcional recomendada** | Substitui ideia de dashboard real genérico; foco em valor, pendências e ações |
| 9C | Decisão Supabase direto vs API/backend | Pendente | Classificar fluxos por risco |
| 10A | Carga administrativa inicial da BASE | **Concluído** | — |
| 10B | Importador institucional via interface | Parcial | UI deve ter preview, diff, hash, logs e confirmação |
| 11 | Motor documental v1 / Document Workbench | **Parcial** para Demonstrativo | Evoluir para pré-checagem, histórico e outros documentos |
| 12 | Geração individual real | **Parcial** | Demonstrativo Básico real; demais documentos e histórico ainda pendentes |
| 13 | Portal do Diretor mobile-first | Pendente | Depende de Marco 6B; deve ser experiência própria, restrita e simples |
| 14 | Hardening, acessibilidade e observabilidade | Contínuo | Adicionar WCAG, performance, logs, auditoria, SLOs e smoke |
| 15 | Geração em lote/ZIP/Jobs | **Reclassificado** | De opcional distante para **Ação Executiva de Alto Valor**, com v0 local e possível worker futuro |

## 7. Sequência operacional recomendada

1. Fechar operacionalmente o PR #71: migration aplicada ✓, types regenerados ✓, smoke headless ✓, **smoke UI por revisor humano pendente**.
2. Mergear este PR documental v4.2 (atualiza Plano, AGENTS, current-state, HANDOFF; insere Radar).
3. Implementar **Painel Executivo-Operacional GAD v1**: indicadores reais, ações estratégicas, pendências, atalhos para detalhe e card destacado da geração dos 163 Demonstrativos.
4. Implementar **geração em lote v0** dos 163 Demonstrativos: pré-checagem, processamento controlado (browser-side com batches), ZIP, relatório de falhas, benchmark, limites.
5. Criar camada de **histórico documental** (`document_generation_runs` ou similar): usuário, data, status, total, sucessos, falhas, hash, último download.
6. Avançar **Marco 6B**: perfis, guards, RLS final, audit_logs e storage privado antes de Portal do Diretor e uso institucional ampliado.
7. Projetar **Importador Institucional da BASE** com dry-run, diff, validação, hash, relatório de inconsistências e confirmação.
8. Reformular frente fiscal como **Aquisição Fiscal Multicanal**, começando por spike de chave/QR/link/XML antes de OCR ou Vision.
9. Só depois reavaliar backend/worker/Cloud Run conforme evidência de gargalo real.

## 8. Próximas frentes prioritárias detalhadas

### 8.1. Fechamento operacional da Fase 2B

- Aplicar migration da RPC no Supabase remoto: **feito em 16/05/2026 via `supabase db push --linked`**
- Regenerar `types.ts` contra projeto linked: **feito; manual override para params nullable preservado**
- Executar smoke headless da RPC com usuário admin/operador: **feito; retornou `unidade_id` correto em no-op**
- Executar **smoke UI** (revisor humano): editar diretor/endereço, validar optimistic update, recarregar página e confirmar persistência — **pendente**
- Atualizar continuidade para retirar "Fase 2B" da próxima prioridade antiga: **feito neste PR v4.2**

### 8.2. Painel Executivo-Operacional GAD v1

- Reposicionar a tela inicial como **comando central**, não apenas dashboard.
- Hero executivo com 163 unidades, exercício, programa, total disponível, cadastros completos, pendências.
- **Cards de ação executiva**: Gerar 163 Demonstrativos · Exportar Consolidado · Ver Pendências · Importar/Atualizar BASE.
- Cada indicador com caminho para detalhe: lista filtrada, escola, documento, relatório ou ação.
- Visual: institucional premium, Light Mode apresentável, espaçamento generoso, poucos KPIs, animações sutis.
- Renomeação: menu lateral `Dashboard` → `Painel`; título da página `Painel Executivo-Operacional · GAD · 4ª CRE`.
- Insights derivados de dados reais: concentração de reprogramado (1 unidade pode ter 80%+ do total), distribuição (% sem repasse vs com repasse), distribuição geográfica (sub-zonas 04.10/04.11/04.30/04.31).

### 8.3. Geração em lote v0

- Usar gerador individual existente (`generateDemonstrativoBasico`) como núcleo.
- Processar as 163 unidades em batches controlados (8 paralelas no browser inicialmente).
- Gerar ZIP com JSZip e download com file-saver; sem nova dependência inicialmente.
- **Pré-checagem**: contar unidades aptas vs sem dados antes de iniciar; pedir confirmação ao usuário.
- Emitir relatório de geração: total, sucesso, falhas, tempo, unidade, erro, arquivo.
- **Histórico persistido** em `document_generation_runs` (ou similar) com usuário, timestamp, contagens, status e erros.
- Benchmark de tempo/memória no v0 antes de decidir por worker/Cloud Run.
- Não prometer robustez institucional sem histórico, auditoria e fallback.

### 8.4. Importador Institucional da BASE (Marco 10B)

- Substituir upload simples por fluxo com **preview**, **dry-run** e **confirmação**.
- Mostrar **diff** entre base atual e nova: unidades novas, alteradas, removidas e campos modificados.
- Gerar relatório de erros bloqueantes e avisos não bloqueantes.
- Registrar **hash do arquivo**, usuário, data, contagem e status.
- **Nunca usar service_role no browser**; operações sensíveis devem ir para função/backend com controle adequado.

### 8.5. Aquisição Fiscal Multicanal (reposiciona frente fiscal)

- Reformular extração fiscal como **aquisição**: primeiro identificar o melhor caminho de obtenção dos dados.
- **Ordem de prioridade**: XML > chave de acesso > QR Code > código de barras > link oficial > DPS/NFS-e Nacional > DFe/SEFAZ (se viável) > PDF textual > OCR/Vision > digitação assistida.
- Manter **revisão humana obrigatória** para dados fiscais sensíveis.
- Separar POC, validação, aquisição e gravação institucional.
- Avaliar `nfelib`, fontes oficiais NFS-e Nacional e serviços Document AI/Textract **apenas após critérios de custo, privacidade e governança**.
- Detalhe arquitetural completo em ideia salva: ver `reference_pdde_fiscal_acquisition_layer_idea` (memória) e ADR #64 (DRAFT).

## 9. Critérios de aceite institucional v4.2

| Critério | Pergunta de aceite | Evidência mínima |
|---|---|---|
| Operacional | A GAD ganhou tempo, clareza ou controle? | Fluxo mais curto, menos cliques, menor retrabalho ou fila de pendências |
| Institucional | A Alta Administração percebe valor? | Indicador, print, relatório, card de impacto ou ação executiva visível |
| Técnico | A solução é estável e moderna? | Testes, build, audit, uso de stack atual e ausência de dependência vulnerável |
| Dados | A fonte é confiável e rastreável? | Origem, validação, hash/log, erro/warning e caminho para detalhe |
| Segurança | A ação respeita papéis e RLS? | Guards, policies, permissões, logs e ausência de secrets no frontend |
| UX | O usuário entende o estado e a próxima ação? | Loading, erro, vazio, sucesso, filtros, breadcrumbs e microcopy |
| Acessibilidade | A interface funciona para todos? | Contraste, foco, labels, teclado, reduced motion e legibilidade |

## 10. Riscos atualizados e controles

| Risco | Nível | Controle v4.2 |
|---|---|---|
| Documentação induzir agente ao estado antigo | Alto | Atualizar Plano v4.2, AGENTS, current-state e HANDOFF após PR #71 (este PR) |
| Geração em lote travar o navegador | Médio/Alto | Benchmark v0, progresso, cancelamento/limite e avaliação de worker |
| Métrica decorativa sem ação | Médio | Exigir caminho para detalhe em todo indicador |
| Dados mock parecerem reais | Alto em apresentação | Badge de demonstração e substituição progressiva por views reais |
| Edição sem histórico institucional | Médio | `audit_logs` no Marco 6B antes de expansão de usuários |
| Portal Diretor expor dados de outra escola | Alto | Diretor-escola link + RLS + guards antes de funcionalizar |
| Upload/importação com erro silencioso | Alto | Dry-run, validação, relatório, hash e confirmação humana |
| Adoção de tecnologia nova por entusiasmo | Médio | Spike, decisão, custo/benefício e classificação implementar/próximo/backlog/descartar |

## 11. Política de uso por agentes (Codex / Claude Code / outros)

Antes de qualquer tarefa relevante, o agente deve:

1. Ler **este Plano v4.2** + **Radar** (`docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`) + `AGENTS.md` + `.continuity/current-state.json` + `docs/HANDOFF.md`.
2. Verificar diretamente o estado real do código no GitHub (`gh api repos/.../branches/main`).
3. Declarar marco do Plano Global v4.2 ao qual a tarefa pertence.
4. Aplicar as **8 perguntas obrigatórias do Radar §3.1** antes de propor implementação.
5. Definir escopo fechado: arquivos permitidos, arquivos proibidos, validações, ponto de parada.
6. Atualizar `docs/HANDOFF.md` ao final de tarefas relevantes (sem espiral documental).

## 12. Veredito final v4.2

O PDDE Online 2026 deixa de ser apenas protótipo em busca de backend. Passa a ser plataforma administrativa leve, com banco próprio, documentos gerados, escrita cadastral controlada, stack moderna e diretriz explícita de inteligência institucional.

O próximo avanço deve **fechar operacionalmente a Fase 2B** (smoke UI) e **transformar o Dashboard em Painel Executivo-Operacional GAD**, preparando a geração em lote dos 163 Demonstrativos como Ação Executiva de Alto Valor.

A versão v4.1 permanece preservada como referência histórica em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` — não foi revogada, apenas atualizada por este documento.
