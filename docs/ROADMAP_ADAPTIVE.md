# Roadmap Adaptativo — PDDE Online 2026

**Atualizado em:** 11/09/2026  
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
- preservação de filtros/contexto entre carteira de escolas e ficha individual.

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

### P1 — ativação controlada da sincronização financeira automática

Status atual: **workflow existe; agendamento não publica enquanto o gate estiver desabilitado/ausente**.

Pré-condições:

1. configurar `PDDE_SUPABASE_URL` no environment `production`;
2. configurar `PDDE_SUPABASE_SERVICE_ROLE_KEY`;
3. manter `PDDE_FINANCIAL_SYNC_ENABLED` desabilitado;
4. executar workflow manualmente;
5. validar dry-run, publicação, idempotência, contagens e regressão;
6. só então habilitar o gate agendado.

Não é bloqueio para o funcionamento atual do produto.

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
