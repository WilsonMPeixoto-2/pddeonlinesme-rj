# Roadmap Adaptativo — PDDE Online 2026

**Atualizado em:** 13/09/2026  
**Papel:** fila curta e prioridades após o estado atual.  
**Não substitui:** `docs/DECISIONS.md`, `docs/README.md` ou verificação direta de `main`/Production.

## 1. Norte atual

- `docs/README.md` define a hierarquia documental e o roteiro obrigatório de leitura.
- `docs/DECISIONS.md` contém as decisões vigentes.
- `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` continua como diretriz transversal.
- `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md` é o registro temporário obrigatório da campanha ativa de hardening de dados/Supabase.
- `docs/PLANO_GLOBAL_V4_2.md` permanece como **baseline estratégica histórica de maio/2026**, não como fotografia do estado corrente.

Este roadmap registra apenas a fila operacional adaptativa a partir do estado real de setembro/2026.

## 2. Estado consolidado

### Entregue no baseline atual

- Supabase Foundation e contratos estruturais básicos;
- edição cadastral mínima e RPC transacional parcial;
- atualização assistida da BASE;
- Demonstrativo Básico individual;
- geração em lote dos 163 Demonstrativos;
- histórico de gerações;
- Painel Executivo-Operacional;
- stack modernizada para Node 24 / React 19 / Vite 8 / TypeScript 6 / Vitest 5;
- hardening progressivo de CI, bundle, E2E e acessibilidade;
- integração financeira V1 com 163 escolas, 335 contas e 537 repasses;
- página de Repasses V1 com recorte completo da 1ª parcela do PDDE Básico;
- Recursos PDDE por programa/ação/parcela/conta;
- pipeline de publicação financeira por dimensão com maturidade, idempotência e proteção contra regressão;
- PR #136 com publicação financeira incremental por delta, idempotência semântica e redução de carga;
- busca global como localizador operacional real;
- preservação de filtros/contexto entre carteira de escolas e ficha individual.

### Estado financeiro V1

- 5 dimensões `MATURE/PUBLISHED`;
- cobertura 163/163;
- ausência de informação preservada como ausência;
- novas dimensões só entram na interface após contrato próprio de maturidade.

### Auditoria de dados/Supabase de 13/09/2026

A auditoria específica pós-incidente encontrou riscos adicionais fora do publisher financeiro, incluindo:

- falso sucesso fiscal via `localStorage` quando a infraestrutura remota não existe;
- migration drift fiscal entre repositório e banco real;
- mock E2E permissivo que mascara RPC/tabela ausente;
- importação BASE ampla e não atômica;
- edição cadastral em duas gravações independentes;
- conta bancária em `vw_unidade_detalhe` sem vínculo programa/exercício;
- Portal Diretor com contrato financeiro divergente;
- RLS de leitura ampla antes da expansão de perfis;
- indicadores de Realtime/Conectado não medidos;
- ausência de observabilidade externa suficiente.

O detalhe e o status de cada achado estão em `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md`.

## 3. Próxima fila operacional

As prioridades abaixo são recomendações adaptativas já alinhadas à campanha de hardening aprovada. Mudanças de escopo protegido continuam exigindo revisão humana.

### P0 — campanha de hardening de dados/Supabase

Executar na ordem, salvo nova evidência de risco/dependência:

1. bloquear falso sucesso/persistência fiscal local no fluxo operacional;
2. tornar mocks Supabase estritos e adicionar testes capazes de detectar contrato ausente;
3. reconciliar deliberadamente migration drift fiscal sem aplicar migrations produtivas por impulso;
4. tornar edição cadastral atômica;
5. transformar importação da BASE em delta + transação server-side;
6. corrigir conta por `unidade + exercício + programa`;
7. alinhar Portal Diretor a uma única autoridade financeira;
8. endurecer RLS/perfis/superfície RPC antes de ampliar diretores;
9. remover ou medir estados visuais de conectividade/Realtime;
10. criar observabilidade externa de saúde, latência e falhas.

Cada etapa deve atualizar o registro de hardening e a continuidade pertinente. Não repetir auditoria integral em cada sessão.

### P0 — manter integridade operacional durante as correções

1. **Smoke autenticado proporcional ao risco**
   - login/recuperação quando Auth mudar;
   - carteira → ficha → retorno quando navegação mudar;
   - Repasses → escola quando financeiro mudar;
   - edição cadastral quando RPC/RLS mudar;
   - geração documental quando template/gerador mudar.

2. **Manter documentação e evidência sincronizadas**
   - comparar registro técnico com sistema real antes de atuar;
   - atualizar estado/handoff quando uma frente relevante for concluída;
   - registrar novas decisões somente em `docs/DECISIONS.md`;
   - manter um único registro temporário da campanha, sem criar novos snapshots concorrentes.

### P1 — ativação controlada da sincronização financeira automática

Status atual: **workflow existe; agendamento não publica enquanto o gate estiver desabilitado/ausente**.

Pré-condições:

1. configurar `PDDE_SUPABASE_URL` no environment `production`;
2. configurar `PDDE_SUPABASE_SERVICE_ROLE_KEY`;
3. manter `PDDE_FINANCIAL_SYNC_ENABLED` desabilitado;
4. executar workflow manualmente;
5. validar dry-run, publicação, idempotência, contagens e regressão;
6. só então habilitar o gate agendado.

Não ativar durante a campanha apenas para gerar carga ou “testar” estabilidade.

### P1 — Auth/RLS/auditoria antes de expansão de perfis

Antes de ampliar o Portal do Diretor ou novos fluxos de escrita:

- validar guards por perfil;
- revisar RLS no banco real;
- reduzir superfície `SECURITY DEFINER` ao necessário;
- garantir vínculo diretor ↔ unidade;
- validar recuperação de senha e fluxos de sessão;
- manter `service_role` fora do browser.

### P2 — novas dimensões financeiras

Candidatas, sem autorização automática:

- saldo atual;
- movimentos bancários posteriores;
- localização de crédito;
- aplicações/rendimentos;
- conciliação documento × débito.

Regra: nenhuma delas entra no Painel/Repasses apenas porque foi coletada. Cada uma exige contrato de maturidade, cobertura, semântica de ausência e caminho operacional de uso.

### P2 — evolução documental

Candidatas:

- Relação de Bens Adquiridos e demais documentos oficiais;
- ampliação de pré-checagens antes da geração;
- evolução do histórico e evidências documentais.

Pré-condição: template oficial real + revisão humana da regra documental.

### P2 — importador institucional

Durante a campanha, este item deixa de ser mera evolução futura porque sua arquitetura atual foi confirmada como risco de escrita ampla/não atômica. A correção deve incluir:

- dry-run/diff;
- hash/idempotência quando aplicável;
- escrita apenas de delta real;
- transação única server-side;
- erros bloqueantes e warnings;
- confirmação humana;
- trilha de auditoria sem duplicação artificial.

### P3 — frente fiscal multicanal

Mantém a ordem de preferência:

`XML > chave > QR > URL oficial > barcode > PDF textual > OCR > digitação assistida`

A POC não deve parecer funcionalidade operacional enquanto o contrato fiscal remoto estiver ausente. Sandbox e OCR simulado não podem produzir estado confundível com dado institucional.

## 4. Evolução de UX e arquitetura da informação

Diretriz atual:

> **Dados → análise → escola → ação → evidência**

Qualquer nova evolução visual deve:

- reforçar hierarquia da informação;
- evitar métricas decorativas;
- preservar contexto entre telas;
- oferecer drill-down em agregados relevantes;
- reduzir memória/retrabalho;
- manter acessibilidade e clareza para usuários com menor familiaridade digital;
- evitar aparência de template genérico de dashboard/IA;
- não declarar “conectado”, “realtime”, “salvo” ou “homologado” sem evidência técnica correspondente.

## 5. Itens que não devem reaparecer como “próxima frente”

- construir Painel Executivo-Operacional básico;
- gerar os 163 Demonstrativos como novidade;
- criar a primeira integração financeira;
- criar Repasses V1;
- tornar busca global operacional;
- preservar contexto carteira/ficha;
- migrar para React 19/Vite 8/Vitest 5;
- reabrir o publisher financeiro V2 sem nova evidência de regressão.

Essas áreas podem evoluir, mas o ponto de partida é o que já foi verificado.

## 6. Riscos contínuos

| Risco | Regra de mitigação |
|---|---|
| `NULL` financeiro convertido em zero | preservar ausência até a fonte informar valor explícito |
| dimensão parcial promovida cedo demais | contrato de maturidade + gate de publicação |
| `service_role` no browser | proibido; backend/workflow controlado somente |
| RLS silencioso | conferir linhas afetadas/retorno e testar no banco |
| migration histórica reaplicada em Production | conferir histórico remoto antes de qualquer push/manual DDL |
| mock aceita contrato inexistente | mock estrito + teste de contrato real/efêmero |
| escrita sem delta | comparar valor atual e gravar apenas mudança real |
| operação lógica dividida em chamadas independentes | mover para transação/RPC única |
| estado operacional no `localStorage` | proibido fora de sandbox claramente isolado |
| UI declara saúde sem medir | remover afirmação ou ligar a health-check real |
| contexto perdido entre telas | URL/return seguro quando o fluxo exigir retorno ao mesmo recorte |
| dashboard decorativo | todo indicador relevante deve apontar para detalhe/ação quando aplicável |
| documentação concorrente | `docs/README.md` + precedência explícita + registro de hardening único enquanto ativo |

## 7. Regra para promover um item a PR

1. confirmar o problema operacional real;
2. verificar o status correspondente no registro de hardening;
3. comparar o tópico com código/schema/banco atuais;
4. ler o contrato técnico do domínio;
5. aplicar o Radar de Inteligência Institucional;
6. definir decisão de negócio afetada;
7. definir arquivos permitidos/proibidos;
8. escrever critério de aceite técnico e operacional;
9. implementar com teste específico que consiga capturar a regressão;
10. validar CI/Preview/banco conforme o risco;
11. atualizar registro de hardening + continuidade antes de encerrar a etapa.