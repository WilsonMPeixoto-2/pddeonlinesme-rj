# Roadmap Adaptativo — PDDE Online 2026

**Atualizado em:** 28/09/2026  
**Papel:** fila curta e prioridades após o estado atual.  
**Não substitui:** `docs/DECISIONS.md`, `docs/README.md` ou verificação direta de `main`/Production.

## 1. Norte atual

- `docs/README.md` define a hierarquia documental e o roteiro obrigatório de leitura.
- `docs/DECISIONS.md` contém as decisões vigentes.
- `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` continua como diretriz transversal.
- `docs/PLANO_GLOBAL_V4_2.md` permanece como **baseline estratégica histórica de maio/2026**, não como fotografia do estado corrente.

Este roadmap registra apenas a fila operacional adaptativa a partir do estado real de setembro/2026.

## 2. Estado consolidado

### Entregue em Production

- Supabase Foundation e contratos estruturais básicos;
- edição cadastral mínima e RPC transacional;
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
- recorte financeiro principal do Painel alinhado ao universo maduro da 1ª parcela;
- busca global como localizador operacional real;
- preservação de filtros/contexto entre carteira de escolas e ficha individual;
- evidência P2 de 52 escolas com ordem de pagamento em 14/09/2026;
- drill-down operacional do 2º ciclo;
- sincronização automática de ordens do FNDE integrada ao pipeline financeiro.
- sincronização financeira nativa v8 no Supabase com cron operacional;
- maturidade pública do 2º ciclo integrada ao frontend;
- Visão anual do PDDE Básico com 1º + 2º ciclos e total por unidade;
- linha do tempo de repasses e filtros cruzados entre visualizações e tabela;
- total anual e timeline compacta na ficha financeira da escola;
- semântica revisada: pagamento oficial do FNDE não depende de confirmação bancária para compor repasses.

### Estado financeiro V1

- 5 dimensões `MATURE/PUBLISHED`;
- cobertura 163/163;
- ausência de informação preservada como ausência;
- novas dimensões só entram na interface após contrato próprio de maturidade.

## 3. Próxima fila operacional

As prioridades abaixo são recomendações adaptativas, não autorização automática de implementação.

### P0 — manter integridade operacional

1. **Smoke autenticado proporcional ao risco**
   - login/recuperação quando Auth mudar;
   - carteira → ficha → retorno quando navegação mudar;
   - Repasses → escola quando financeiro mudar;
   - edição cadastral quando RPC/RLS mudar;
   - geração documental quando template/gerador mudar.

2. **Manter documentação canônica sincronizada**
   - atualizar estado/handoff quando uma frente relevante for concluída;
   - registrar novas decisões somente em `docs/DECISIONS.md`;
   - evitar criar novos snapshots concorrentes.

### P1 — manter e observar a sincronização financeira nativa

A publicação financeira nativa v8 está operacional no Supabase, com cron recorrente e read-after-write. A frente deixa de ser “ativar a primeira sincronização” e passa a ser observabilidade e regressão:

1. manter cron saudável e tentativas recentes sem erro;
2. preservar 163/163 nas dimensões maduras;
3. detectar regressão de cobertura antes de promover nova informação;
4. manter frontend silencioso em estado saudável e explícito apenas em atraso/falha;
5. não usar a camada bancária como condição para aceitar pagamento oficial do FNDE.

### P1 — Auth/RLS/auditoria antes de expansão de perfis

Antes de ampliar o Portal do Diretor ou novos fluxos de escrita:

- validar guards por perfil;
- revisar RLS no banco real;
- ampliar `audit_logs` onde a mutação justificar;
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

Evoluir apenas quando houver demanda operacional clara:

- dry-run;
- diff;
- hash do arquivo;
- erros bloqueantes e warnings;
- confirmação humana;
- trilha de auditoria.

### P3 — frente fiscal multicanal

Mantém a ordem de preferência:

`XML > chave > QR > URL oficial > barcode > PDF textual > OCR > digitação assistida`

A POC permanece isolada até haver caso de uso institucional e corpus representativo suficiente.

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
- evitar aparência de template genérico de dashboard/IA.

## 5. Itens que não devem reaparecer como “próxima frente”

- construir Painel Executivo-Operacional básico;
- gerar os 163 Demonstrativos como novidade;
- criar a primeira integração financeira;
- criar Repasses V1;
- tornar busca global operacional;
- preservar contexto carteira/ficha;
- migrar para React 19/Vite 8/Vitest 5;
- reabrir Supabase Foundation como frente genérica.

Essas áreas podem evoluir, mas o ponto de partida é o que já está em Production.

## 6. Riscos contínuos

| Risco | Regra de mitigação |
|---|---|
| `NULL` financeiro convertido em zero | preservar ausência até a fonte informar valor explícito |
| dimensão parcial promovida cedo demais | contrato de maturidade + gate de publicação |
| `service_role` no browser | proibido; backend/workflow controlado somente |
| RLS silencioso | conferir linhas afetadas/retorno e testar no banco |
| migration histórica reaplicada em Production | conferir histórico remoto antes de qualquer push/manual DDL |
| contexto perdido entre telas | URL/return seguro quando o fluxo exigir retorno ao mesmo recorte |
| dashboard decorativo | todo indicador relevante deve apontar para detalhe/ação quando aplicável |
| documentação concorrente | `docs/README.md` + precedência explícita |

## 7. Regra para promover um item a PR

1. confirmar o problema operacional real;
2. verificar se a frente já existe em Production;
3. ler o contrato técnico do domínio;
4. aplicar o Radar de Inteligência Institucional;
5. definir decisão de negócio afetada;
6. definir arquivos permitidos/proibidos;
7. escrever critérios de aceite técnicos e operacionais;
8. criar PR isolado;
9. validar CI/Preview/banco conforme o risco;
10. atualizar documentação canônica se o estado ou decisão mudou.
