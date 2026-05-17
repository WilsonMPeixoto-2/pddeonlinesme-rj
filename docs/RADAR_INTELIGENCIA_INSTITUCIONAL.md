# Radar de Inteligência Institucional — PDDE Online 2026

Diretriz transversal para produto, arquitetura, UX, dados, automação e valorização institucional.

| Campo | Informação |
|---|---|
| Projeto | PDDE Online 2026 |
| Unidade de contexto | GAD · 4ª Coordenadoria Regional de Educação · SME-RJ |
| Natureza | Diretriz técnico-institucional |
| Aplicação | Todas as tarefas futuras: código, layout, dados, documentos, acesso, automações e revisões |
| Versão | Maio/2026 |
| Relação | Anexo obrigatório do Plano Global v4.2 (`docs/PLANO_GLOBAL_V4_2.md`) |

## Nota de uso

Este documento não substitui o Plano Global. Ele cria uma camada **transversal** de inteligência institucional: cada marco do Plano continua válido como norte, mas **toda tarefa** deve ser planejada, implementada e revisada buscando a solução mais moderna, segura, útil, visualmente qualificada e institucionalmente valorizável.

**Fórmula de trabalho:**
- **Plano Global** = o que precisa ser feito
- **Radar de Inteligência Institucional** = como fazer da melhor forma, com foco em valor público, eficiência, rastreabilidade, experiência de uso e visibilidade institucional

## 1. Fundamento

O PDDE Online 2026 deve ser compreendido como **serviço digital administrativo em construção**, não apenas um conjunto de telas, tabelas e geradores de documentos. Toda funcionalidade deve responder simultaneamente a três perguntas:

1. Que problema operacional resolve?
2. Que evidência institucional produz?
3. Qual grau de modernidade técnica entrega?

**Razão prática**: em ambiente público, uma solução pode gerar economia de tempo, reduzir retrabalho e aumentar controle, mas ainda assim **perder apoio se esses ganhos ficarem invisíveis**. O sistema deve funcionar bem e também demonstrar bem o valor do que foi construído.

## 2. Conceito de inteligência institucional aplicado ao PDDE Online

Inteligência institucional, neste projeto, é a capacidade de transformar tecnologia em **ganho administrativo percebido, mensurável e apresentável**. Combina eficiência operacional, governança de dados, qualidade visual, redução de retrabalho, organização da informação e produção de evidência para tomada de decisão.

### 2.1. O que NÃO é inteligência institucional

- Apenas deixar a tela bonita.
- Inserir muitos gráficos sem caminho para detalhe.
- Automatizar uma tarefa sem controle, validação e registro.
- Produzir documentação longa que não influencia a execução.
- Substituir o trabalho humano por uma caixa-preta sem revisão administrativa.

### 2.2. O que É inteligência institucional

| Dimensão | Aplicação no PDDE Online |
|---|---|
| Valor visível | Alta Administração entende em poucos segundos o que o sistema controla, automatiza e melhora |
| Ação orientada | Indicadores apontam para listas, detalhes, filtros, pendências ou botões de resolução |
| Fluxo real | Telas refletem o trabalho da GAD: importar, conferir, corrigir, gerar, acompanhar, comprovar e relatar |
| Rastreabilidade | Alterações, importações, gerações, downloads e revisões deixam evidências proporcionais ao risco |
| Modernidade responsável | Tecnologias de 2026 avaliadas criticamente: adotadas quando agregam valor e descartadas quando criam complexidade improdutiva |
| Estética institucional | Visual moderno e estimulante, mas sóbrio, legível, acessível e adequado ao setor público |

### Regra de ouro

> Toda funcionalidade relevante deve entregar **valor operacional e valor institucional visível**. Não basta funcionar: precisa reduzir trabalho, orientar ação, gerar evidência, evitar erro e poder ser apresentada como modernização administrativa.

## 3. Radar de soluções modernas e inovadoras em 2026

A disciplina de procurar caminhos melhores antes de implementar o caminho óbvio. Aplica-se a todas as frentes: dados, telas, documentos, segurança, busca, acesso, importação, fiscal, dashboards, processos em lote, ajuda contextual e visual institucional.

### 3.1. Perguntas obrigatórias antes de qualquer implementação

1. Existe **fonte estruturada** antes de digitar ou fazer OCR?
2. Existe **padrão consolidado** em sistemas públicos, ERPs, dashboards administrativos ou design systems?
3. A tarefa pode virar **alerta, status, histórico, gráfico, relatório ou evidência**?
4. A solução **reduz clique, memória, retrabalho ou planilha paralela**?
5. A interface mostra **o próximo passo** ou apenas exibe dados?
6. A entrega é **segura** para dados reais, perfis, RLS, arquivos e auditoria?
7. O **ganho pode ser demonstrado visualmente** para chefia e Alta Administração?
8. A abordagem é **adequada para 2026** ou apenas uma solução provisória que funciona?

### 3.2. Referenciais externos que orientam o Radar

| Referencial | Aplicação prática |
|---|---|
| GOV.UK Service Standard ([link](https://www.gov.uk/service-manual/service-standard)) | Entender usuários, resolver o problema inteiro, simplificar, garantir acessibilidade, proteger privacidade, definir sucesso, escolher tecnologia adequada, usar padrões comuns e operar com confiabilidade |
| GOV.UK Government Design Principles ([link](https://www.gov.uk/guidance/government-design-principles)) | Começar pelas necessidades dos usuários, desenhar com dados, fazer o trabalho difícil para tornar simples, construir serviços digitais e não apenas websites, manter consistência sem impedir evolução |
| Nielsen Norman Group | Visibilidade de status, linguagem do usuário, prevenção de erros, reconhecimento em vez de memorização, eficiência, design estético/minimalista e ajuda contextual |
| W3C WCAG 2.2 ([link](https://www.w3.org/TR/WCAG22/)) | Conteúdo perceptível, operável, compreensível e robusto, com critérios testáveis e aplicação em múltiplos dispositivos |
| Supabase RLS ([link](https://supabase.com/docs/guides/database/postgres/row-level-security)) | Regras de acesso por tabela, usuário e papel, essenciais para dados reais e perfis distintos |
| Cloud Run Jobs ([link](https://cloud.google.com/run/docs/create-jobs)) / Supabase background tasks / filas | Considerar para geração em lote, workers e rotinas demoradas — **apenas com evidência de gargalo real** |
| Document AI ([link](https://cloud.google.com/document-ai/docs/processors-list)) / Textract / XML / QR Code / chave de acesso / links oficiais | Avaliar antes de depender exclusivamente de OCR ou digitação manual |

## 4. Princípios transversais obrigatórios

| # | Princípio | Critério de aplicação |
|---:|---|---|
| 1 | **Valor institucional** | A entrega deve tornar perceptível o ganho de eficiência, controle, transparência, padronização ou inovação |
| 2 | **Trabalho real da GAD** | Funcionalidade deve reduzir retrabalho, eliminar planilhas paralelas, priorizar pendências ou transformar dados em ação |
| 3 | **Solução moderna e adequada** | Antes de implementar, verificar se há abordagem mais atual, segura, simples ou estruturada |
| 4 | **Organização da informação** | Informação no lugar certo, com hierarquia clara, caminho para detalhe e ação |
| 5 | **Acesso e rastreabilidade** | RLS, guards, logs proporcionais ao risco, histórico e governança institucional |
| 6 | **Acessibilidade** | WCAG 2.2: contraste, foco, labels, teclado, reduced motion, legibilidade |
| 7 | **Estética institucional** | Moderno mas sóbrio, legível, sem cair em "tech startup genérico" ou "vitrine decorativa" |

## 5. Aplicação por área do sistema

### 5.1. Painel Executivo (página inicial)

- Comando central, não vitrine decorativa.
- Hero com KPIs reais da CRE (163 unidades, totais, pendências).
- Ações executivas em destaque (gerar lote, exportar, importar).
- Insights derivados de dados reais (concentração, distribuição).
- Cada indicador tem caminho para detalhe.

### 5.2. Listagens e detalhes (`/escolas`, `/escolas/:id`)

- Filtros úteis, não decorativos.
- Empty/loading/error states com microcopy clara.
- Edição cadastral atômica e rastreável.
- Skeleton column-aware (matches real layout).

### 5.3. Documentos (gerador, lote, histórico)

- Pré-checagem antes de gerar.
- Progresso visível durante operação longa.
- Histórico persistido com usuário, timestamp, status, falhas.
- ZIP com nome institucional padronizado.

### 5.4. Importação (BASE.xlsx)

- Dry-run obrigatório.
- Diff entre estado atual e novo.
- Hash do arquivo + log.
- Confirmação humana antes de gravar.

### 5.5. Frente fiscal (Aquisição Multicanal)

- XML > chave > QR > URL oficial > código de barras > PDF textual > OCR > digitação assistida.
- Allowlist para URLs externas (proteção SSRF).
- Revisão humana obrigatória antes de virar dado oficial.

### 5.6. Auth/perfis (Marco 6B)

- Guards por perfil no frontend + RLS no banco.
- UI admin para gerenciar usuários e roles (eliminar INSERT manual via service_role).
- `audit_logs` para mutações sensíveis.

## 6. Matriz de decisão tecnológica

Antes de adotar nova tecnologia/biblioteca:

| Status | Critério |
|---|---|
| **Implementar agora** | Resolve problema atual, baixo risco, dependência estável, ganho mensurável |
| **Próximo PR** | Resolve problema atual mas exige preparação (spike, contratos, schema) |
| **Backlog** | Resolve problema futuro previsível; sem urgência |
| **Descartar** | Resolve problema hipotético, custo > ganho, alternativa mais simples disponível |

Nunca adotar tecnologia por entusiasmo. Sempre justificar.

## 7. Critérios de aceite institucional para PRs e prompts

Todo PR deve responder explicitamente no description:

1. Qual marco do Plano Global v4.2 atende?
2. Qual problema operacional resolve?
3. Qual evidência institucional produz?
4. Quais perguntas obrigatórias do §3.1 foram aplicadas?
5. Qual o caminho para detalhe / ação que o indicador (se houver) oferece?
6. Quais validações foram executadas?
7. Qual o smoke (técnico e operacional) realizado?

## 8. Bloco-padrão para prompts de agentes

Ao instruir Codex/Claude Code/outros agentes, incluir:

```
Antes de implementar, aplicar Radar de Inteligência Institucional:
- Existe fonte estruturada antes de OCR/digitação?
- A solução reduz clique, retrabalho ou memória?
- Há caminho para detalhe/ação no indicador?
- A entrega respeita perfis, RLS e auditoria?
- O ganho é demonstrável visualmente para Alta Administração?
- A abordagem é adequada para 2026?

Cumprir Plano Global v4.2.
```

## 9. Checklist de revisão de PR

Antes de aprovar merge:

- [ ] Marco do Plano v4.2 declarado
- [ ] Pelo menos 3 das 8 perguntas §3.1 respondidas explicitamente
- [ ] Smoke técnico passou (test, tsc, lint, build, audit)
- [ ] Smoke operacional realizado quando aplicável
- [ ] Acessibilidade verificada (contraste, teclado, foco)
- [ ] Caminho para detalhe presente quando há indicador
- [ ] Nenhuma adoção de tecnologia nova sem justificativa de §6
- [ ] Documentação de continuidade atualizada se relevante

## 10. Fontes internas e externas

### Fontes internas

- `docs/PLANO_GLOBAL_V4_2.md` (plano vigente)
- `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` (v4.1 arquivado)
- `docs/HANDOFF.md`
- `.continuity/current-state.json`
- `AGENTS.md`
- PRs #57 a #71 no GitHub

### Fontes externas

- GOV.UK Service Standard: https://www.gov.uk/service-manual/service-standard
- GOV.UK Government Design Principles: https://www.gov.uk/guidance/government-design-principles
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Google Cloud Run Jobs: https://cloud.google.com/run/docs/create-jobs
- Google Document AI processor list: https://cloud.google.com/document-ai/docs/processors-list
