# Governança documental e roteiro obrigatório de leitura — Design

## Objetivo

Reconciliar a documentação do PDDE Online 2026 com o estado efetivo de `main` e Production em 11/09/2026 e estabelecer uma hierarquia documental explícita que impeça documentos históricos, handoffs antigos ou planos concluídos de concorrer com as fontes vigentes.

## Problema observado

A documentação contém material de alta qualidade, mas distribuído em camadas sem autoridade claramente definida. Em 11/09/2026, documentos como `AGENTS.md`, `docs/HANDOFF.md`, `.continuity/current-state.json` e `docs/ROADMAP_ADAPTIVE.md` ainda descrevem marcos de maio, junho ou 08/09, enquanto `main` e Production já incorporam os PRs #129 a #132. `docs/DECISIONS.md` e `docs/DECISIONS_LOG.md` também dividem decisões sem uma precedência explícita.

O risco não é apenas informacional: agentes ou mantenedores podem reabrir frentes concluídas, interpretar backlog histórico como prioridade atual, contradizer decisões de negócio já consolidadas ou executar trabalho no repositório errado.

## Princípio de governança

A documentação apoia a execução, mas não substitui a verificação do sistema real. A precedência obrigatória será:

1. código, schema/migrations, banco verificado, CI e deployment real;
2. decisões vigentes em `docs/DECISIONS.md`;
3. estado operacional em `.continuity/current-state.json` e `docs/HANDOFF.md`;
4. documentação técnica canônica do domínio da tarefa;
5. planos, specs, handoffs datados, roadmaps antigos e relatórios históricos.

Se houver conflito entre camadas, prevalece a camada superior. Documentação não pode ser usada como prova de estado funcional sem confronto com o repositório/ambiente correspondente.

## Classificação documental

### CANÔNICO

Documentos que definem regras vigentes e devem ser considerados antes de alterar o produto:

- `AGENTS.md`;
- `docs/README.md`;
- `docs/DECISIONS.md`;
- `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

### OPERACIONAL

Fotografias do estado corrente, deliberadamente atualizáveis:

- `.continuity/current-state.json`;
- `docs/HANDOFF.md`;
- `docs/ROADMAP_ADAPTIVE.md`.

### TÉCNICO POR DOMÍNIO

Contratos e protocolos que só precisam ser lidos quando a tarefa toca o respectivo domínio, por exemplo:

- `docs/technical/financial-publication-contract-v1.md`;
- `docs/technical/integracao-financeira-pdde-2026-v1.md`;
- `docs/technical/repasses-operacionais-2026-v1.md`;
- documentos fiscais, cadastrais e de deploy em `docs/technical/`.

### HISTÓRICO

Planos, specs, handoffs datados, versões antigas do Plano Global, relatórios de recuperação e logs de decisões antigas. Permanecem no Git para rastreabilidade, mas não determinam o estado corrente.

## Roteiro obrigatório de leitura

Antes de qualquer tarefa substantiva, a leitura mínima será:

1. `AGENTS.md`;
2. `docs/README.md`;
3. `.continuity/current-state.json`;
4. `docs/HANDOFF.md`;
5. `docs/DECISIONS.md`;
6. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
7. documentação técnica correspondente ao domínio da tarefa;
8. verificação de `main`, PRs abertos/recentes, CI, Supabase e Production conforme o escopo.

Planos/specs históricos só entram quando necessários para compreender origem, trade-offs ou decisões pretéritas.

## Decisões de negócio a consolidar

O ciclo financeiro/UX de setembro de 2026 deve ficar explicitamente registrado em `docs/DECISIONS.md`:

- narrativa operacional: **Dados → análise → escola → ação → evidência**;
- publicar apenas dimensões financeiramente maduras e validadas;
- ausência de informação não é zero;
- não expor dados parciais como se fossem universo completo;
- 1ª parcela do PDDE Básico é o recorte financeiro principal enquanto for o universo integralmente maduro;
- preservar múltiplas contas por escola/programa;
- hierarquia financeira `programa → ação → parcela → conta`;
- metadados de coleta/proveniência ficam fora da superfície operacional comum;
- indicadores agregados devem ter caminho para detalhe/ação;
- busca global só aponta para áreas e entidades reais do produto;
- remover ações, atalhos e métricas fictícias;
- filtros/contexto da carteira devem sobreviver ao drill-down para a ficha escolar;
- publicação financeira deve ser transacional, idempotente e protegida contra regressão;
- agendamento automático só pode ser habilitado com credenciais de backend e gate explícito;
- dados imaturos permanecem no motor até alcançarem contrato próprio de maturidade.

## Estado factual a refletir

Em 11/09/2026:

- `main`: `b60fb04b360eefb7dc0d92cc39064ee8a019724b` antes desta PR documental;
- PRs #129, #130, #131 e #132: mergeados e implantados;
- Production Vercel: deployment READY no commit acima e domínio público HTTP 200;
- Supabase oficial: `raluxyojqosfzrfozmpz`;
- 163 escolas, 335 contas, 537 repasses;
- 5 dimensões financeiras V1 `MATURE/PUBLISHED` com cobertura 163/163;
- workflow financeiro agendado existe, mas publicação automática permanece inerte enquanto `PDDE_FINANCIAL_SYNC_ENABLED` não estiver explicitamente habilitada e os secrets de backend não estiverem configurados;
- não há PR recente aberto no momento da reconciliação.

## Estratégia de atualização

Não mover ou renomear em massa documentos antigos. Isso preserva links e histórico. Em vez disso:

1. criar `docs/README.md` como mapa e porta de entrada;
2. atualizar as fontes canônicas/operacionais;
3. adicionar avisos de historicidade/precedência onde necessário;
4. corrigir documentos técnicos que descrevem automação/estado de modo incompatível com Production;
5. reduzir números voláteis no README quando não agregarem valor;
6. manter planos/specs em `docs/superpowers/` como histórico de design/execução.

## Política de manutenção futura

Uma mudança deve atualizar documentação apenas quando alterar pelo menos um destes elementos:

- decisão de negócio ou regra operacional;
- contrato de dados;
- arquitetura/segurança;
- status de uma frente que aparece como prioridade atual;
- procedimento de deploy/CI/automação;
- fluxo de usuário que afete treinamento ou operação;
- fonte de verdade ou roteiro obrigatório de leitura.

Snapshots não devem carregar afirmações estáticas que envelhecem sem necessidade, como contagem fixa de testes ou versões de ferramentas quando essas versões já são verificáveis em `package.json`.

## Critérios de aceite

- existe uma porta de entrada única em `docs/README.md`;
- `AGENTS.md` aponta para o roteiro obrigatório e não contém estado obsoleto como verdade corrente;
- `DECISIONS.md` é a fonte canônica de decisões vigentes;
- `DECISIONS_LOG.md` é marcado como histórico;
- `current-state.json`, `HANDOFF.md` e `ROADMAP_ADAPTIVE.md` refletem o ciclo #129–#132;
- `README.md` descreve stack e produto atuais sem números voláteis desnecessários;
- o Plano Global v4.2 é identificado como baseline estratégica histórica, não fotografia corrente;
- documentação financeira distingue workflow existente de automação efetivamente habilitada;
- todos os caminhos Markdown internos adicionados apontam para arquivos existentes;
- JSON continua válido;
- diff final permanece restrito a documentação/continuidade.