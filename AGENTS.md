# AGENTS.md — PDDE Online 2026

**Atualizado em:** 11/09/2026  
**Repositório oficial:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Produto:** PDDE Online 2026 · GAD · 4ª CRE · SME-RJ

## 1. Identidade e isolamento do projeto

Antes de agir, confirme que o repositório é **`WilsonMPeixoto-2/pddeonlinesme-rj`**.

Não misturar este projeto com:

- RADAR PDDE;
- `pdde-repasse-conciliador`;
- POPs/SEI;
- outros protótipos, bases ou projetos Supabase.

O `pdde-repasse-conciliador` é fonte externa estruturada do pipeline financeiro, mas continua sendo um projeto separado.

## 2. Fonte de verdade e precedência

A documentação apoia a execução; não substitui o sistema real.

Quando houver divergência, a ordem obrigatória é:

1. código em `main`, schema/migrations, banco verificado, CI e deployment real;
2. `docs/DECISIONS.md`;
3. `.continuity/current-state.json` e `docs/HANDOFF.md`;
4. documentação técnica do domínio em `docs/technical/`;
5. planos, specs, handoffs datados, relatórios e roadmaps históricos.

Nunca declarar funcionalidade, Production, banco ou CI como íntegros apenas porque um documento afirma isso. Verifique o artefato correspondente.

## 3. Roteiro obrigatório antes de qualquer tarefa substantiva

Ler, nesta ordem:

1. `AGENTS.md`;
2. `docs/README.md`;
3. `.continuity/current-state.json`;
4. `docs/HANDOFF.md`;
5. `docs/DECISIONS.md`;
6. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
7. documentação técnica específica da tarefa;
8. `main`, PRs recentes/abertos, CI, Supabase e Production conforme o escopo.

`docs/PLANO_GLOBAL_V4_2.md`, `docs/OPPORTUNITIES_BACKLOG.md`, `docs/superpowers/plans/` e `docs/superpowers/specs/` são referências estratégicas/históricas. Não usar seus status internos como fotografia atual sem confronto com as fontes acima.

## 4. Classificação obrigatória de afirmações

Ao reportar estado ou recomendar ação, distinguir:

- **FATO VERIFICADO** — confirmado em código, commit, diff, teste, banco ou deployment;
- **INFERÊNCIA** — conclusão razoável ainda não comprovada diretamente;
- **RELATO DOCUMENTAL** — informação lida em documento/handoff/log;
- **PENDÊNCIA A CONFIRMAR** — exige verificação antes de orientar decisão.

## 5. Decisões de negócio que não podem ser improvisadas

As decisões completas ficam em `docs/DECISIONS.md`. Entre as invariantes vigentes:

- narrativa operacional: **Dados → análise → escola → ação → evidência**;
- publicar na interface apenas dimensões com contrato de maturidade validado;
- ausência de informação **não é zero**;
- não expor universo parcial como se fosse completo;
- preservar múltiplas contas por escola/programa;
- hierarquia financeira: `programa → ação → parcela → conta`;
- metadados de coleta/proveniência ficam fora da superfície operacional comum;
- indicadores relevantes devem conduzir a detalhe, filtro ou ação;
- busca global só deve anunciar áreas/entidades reais;
- não criar atalhos, botões, métricas ou estados fictícios;
- filtros e contexto operacional devem sobreviver ao drill-down quando isso reduzir retrabalho;
- publicação financeira deve ser transacional, idempotente e protegida contra regressão;
- sincronização agendada só pode publicar com gate explícito e credenciais seguras de backend.

Se a tarefa exigir mudar qualquer uma dessas regras, trate como decisão arquitetural/de negócio e devolva para revisão humana antes de implementar.

## 6. Camada de dados e financeiro

Para dados financeiros, planilhas, importação/exportação, CNPJ, INEP, demonstrativos ou prestação de contas:

- inventariar a fonte de dados e o contrato esperado antes de alterar código;
- preservar rastreabilidade entre valor bruto, normalizado e erro/warning;
- não inventar regra financeira, documental, de acesso ou identidade de escola;
- preservar `NULL` quando a informação não existe;
- não presumir relação 1:1 entre escola e conta bancária;
- tratar Production Supabase como somente leitura salvo autorização explícita;
- escritas financeiras devem ocorrer por fluxo controlado de integração;
- preservar templates oficiais, fórmulas, bordas, células mescladas e regras documentais.

## 7. Segurança e domínios protegidos

Revisão humana continua obrigatória para:

- autenticação, roles, guards e RLS;
- migrations e funções `SECURITY DEFINER/INVOKER`;
- secrets e credenciais;
- regras financeiras e contratos de maturidade;
- templates oficiais;
- publicação/retirada de dados de Production;
- decisões arquiteturais e mudanças de boundary.

Nunca versionar secrets, tokens ou `.env`.

## 8. Validações mínimas

| Tipo de alteração | Validações mínimas |
|---|---|
| TypeScript | `npm run typecheck` |
| UI / fluxo React | typecheck, lint, build, E2E/acessibilidade quando aplicável e Preview |
| Parser/importador/motor documental | typecheck, testes e fixtures representativas |
| Supabase/RLS/Auth | replay local das migrations + testes de contrato + revisão humana |
| Mudança substancial | `npm ci`, typecheck, lint, testes, cobertura, build e gates do CI |
| Dependências | package + lockfile sincronizados, build, testes e auditoria |
| Documentação | JSON válido quando houver, links internos coerentes e diff restrito ao escopo |

Não usar `--force`, `--legacy-peer-deps`, desabilitar lint/testes ou relaxar políticas para fabricar um CI verde.

## 9. CI e Production

O workflow `.github/workflows/ci.yml` é o gate permanente de PR e inclui:

- typecheck;
- lint;
- testes unitários e cobertura;
- auditoria do template do Demonstrativo;
- build e bundle budget;
- E2E/acessibilidade;
- Knip de produção;
- auditoria de vulnerabilidades;
- replay completo do Supabase local e testes de contrato do banco.

O workflow `.github/workflows/sync-financial-snapshot.yml` existe, mas a presença do `schedule` **não significa automação ativa**. Execução agendada só publica quando `PDDE_FINANCIAL_SYNC_ENABLED=true` e os secrets de backend esperados estão configurados no environment `production`.

Nunca declarar Production sincronizada sem conferir SHA/deployment e smoke do domínio público.

## 10. Radar de Inteligência Institucional

Toda tarefa aplica `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

Perguntas obrigatórias:

1. Existe fonte estruturada antes de digitação/OCR?
2. A solução reduz retrabalho, clique, memória ou planilha paralela?
3. O indicador tem caminho para detalhe/ação?
4. A informação está no lugar certo e com hierarquia compreensível?
5. Há padrão atual em sistemas públicos, ERPs, dashboards ou design systems?
6. A entrega respeita segurança, perfis, RLS, auditoria e dados reais?
7. A interface é acessível, clara e institucionalmente sóbria?
8. O ganho é demonstrável para gestão e Alta Administração?
9. A abordagem é adequada para 2026, e não apenas funcional?

## 11. Política de documentação

Use `docs/README.md` como índice oficial.

Atualize documentação quando uma mudança alterar:

- decisão de negócio/regra operacional;
- contrato de dados;
- arquitetura ou segurança;
- prioridade apresentada como atual;
- CI/deploy/automação;
- fluxo relevante de usuário;
- fonte de verdade ou roteiro obrigatório.

Evite snapshots desnecessários que envelhecem sozinhos, como contagem fixa de testes ou versões duplicadas já disponíveis em `package.json`.

Depois de tarefa relevante:

1. atualizar `.continuity/current-state.json` e `docs/HANDOFF.md` se o estado operacional mudou;
2. atualizar `docs/DECISIONS.md` se houve nova decisão ou mudança de regra;
3. atualizar `docs/ROADMAP_ADAPTIVE.md` se mudou prioridade/fila curta;
4. atualizar documentação técnica do domínio se o contrato mudou.

Não criar novas fontes paralelas de “estado atual” ou “decisões atuais”.

## 12. Formato de prompt operacional

Todo prompt operacional para agente deve declarar:

- repositório/projeto alvo;
- objetivo;
- arquivos obrigatórios de leitura;
- arquivos permitidos;
- arquivos proibidos;
- decisões de negócio afetadas;
- critérios de aceite;
- validações mínimas;
- condição de rollback quando houver risco de Production.
