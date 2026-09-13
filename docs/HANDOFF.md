# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 13/09/2026 01:35 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`  
**Campanha ativa:** `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md`

> Este handoff é uma fotografia operacional. Código, banco, CI e deployment real prevalecem em caso de divergência. Enquanto a campanha de hardening estiver ativa, o agente deve ler o registro técnico, comparar o tópico com as fontes reais e continuar do último ponto verificado, sem reiniciar a auditoria do zero.

## 1. Estado verificado mais recente

### Código

- `main`: `578b94c1ae0e3709aaa597b124f0a1e89833a972`;
- commit: PR #136, `fix: tornar publicação financeira incremental e reduzir carga do Supabase`;
- branch de trabalho da campanha: `fix/data-governance-hardening-2026-09-13`.

O estado Vercel posterior ao PR #136 **não foi revalidado neste bootstrap da campanha**. O último deployment de frontend previamente documentado continua sendo histórico e não deve ser usado para afirmar o SHA atualmente em Production sem nova consulta.

### Supabase oficial

Projeto: `raluxyojqosfzrfozmpz`.

Snapshot de leitura após a recuperação do incidente:

- 163 escolas;
- 335 contas bancárias;
- 537 repasses financeiros;
- 163 linhas de `execucao_financeira`;
- 500 linhas observadas em `audit_logs`;
- 13 conexões totais e 1 ativa no snapshot;
- cache hit aproximado de 99,94%.

O banco voltou a responder, mas houve incidente real anterior com **Disk I/O em 100% no compute Nano e `CONNECT_TIMEOUT`**. Não reduzir a causa a um único query sem evidência.

## 2. PR #136 — correção já incorporada ao baseline

O caminho de publicação financeira foi endurecido para:

- reconciliação incremental por delta;
- digest semântico de negócio;
- idempotência real sem reescrever snapshot inalterado;
- advisory lock por exercício;
- proteção contra run regressiva e regressão de cobertura;
- escrita somente quando valores realmente divergem;
- política de consulta do Dashboard menos agressiva.

Na prova observada, uma publicação com mudança ficou na ordem de centenas de milissegundos e a repetição semanticamente igual caiu para dezenas de milissegundos com zero alterações operacionais.

**Não reabrir esse tópico do zero.** Só revisitar se nova evidência mostrar regressão ou se a próxima correção depender diretamente dele.

## 3. Campanha ativa de hardening de dados/Supabase

Documento de trabalho obrigatório:

`docs/technical/DATA_GOVERNANCE_HARDENING_2026.md`

Ele contém os achados DG-01 a DG-20, status, evidências, critérios de aceite e ordem de correção.

### Regra de continuidade

Ao iniciar qualquer nova sessão/ferramenta:

1. ler o roteiro de `AGENTS.md`/`docs/README.md`;
2. ler o registro de hardening;
3. identificar o último tópico/status realmente trabalhado;
4. comparar **aquele tópico** com código/schema/banco/CI atuais;
5. continuar a correção do ponto registrado;
6. ao fechar uma etapa, atualizar registro técnico + continuidade necessária + próximo ponto de retomada.

A documentação não autoriza pular a verificação do sistema real, mas também não autoriza jogar fora o trabalho já verificado e começar novamente.

## 4. Achados críticos já confirmados

### DG-01 / DG-03 — Frente Fiscal + mocks

Confirmado no código e banco:

- Production Supabase não possui `despesas_fiscais`;
- não possui `homologar_despesa_fiscal`;
- não possui `estornar_despesa_fiscal`;
- `FiscalConferencia.tsx` transforma ausência de RPC/tabela em sucesso local, alterando cache e gravando `sandbox_despesas_fiscais` em `localStorage`;
- `EscolaEditar.tsx` contém fallback local equivalente para estorno;
- o mock E2E responde sucesso genérico para RPCs desconhecidas e `[]` para `despesas_fiscais`, mascarando a ausência do contrato real.

**Próxima correção imediata:** impedir falso sucesso/persistência local no fluxo operacional e tornar o mock estrito, via TDD.

### DG-02 — migration drift fiscal

O repositório contém:

- `20260527000200_despesas_fiscais.sql`;
- `20260527000300_estorno_despesas.sql`.

O histórico real `supabase_migrations.schema_migrations` não contém essas versões. Ele salta de `20260527000100` para `20260909002935`.

**Regra:** não aplicar essas migrations em Production automaticamente. Primeiro corrigir a honestidade do frontend/testes e depois decidir conscientemente se o domínio fiscal será ativado.

### DG-04 / DG-05 — escrita ampla e parcial

Confirmado:

- importação da BASE executa upsert amplo de `unidades_escolares` e depois outro upsert de `execucao_financeira`, fora de uma transação única e sem delta semântico;
- edição cadastral usa RPC para parte do cadastro e segundo update independente para e-mail.

São frentes posteriores ao bloqueio fiscal.

### DG-09 / DG-10 — conta/programa e Portal Diretor

Confirmado:

- `vw_unidade_detalhe` escolhe conta por unidade, sem amarrar programa/exercício;
- 163 escolas verificadas possuem contas distintas para Básico e Qualidade;
- `PortalDiretor.tsx` usa `programa: "PDDE"`, enquanto o domínio legado real de `execucao_financeira` usa `basico`;
- Portal/Fiscal ainda usam campos financeiros legados em paralelo ao novo domínio de `contas_bancarias`/`repasses_financeiros`.

### DG-11 / DG-12 / DG-18 — RLS, verdade visual e observabilidade

Confirmado:

- tabelas operacionais relevantes permitem `SELECT` a qualquer `authenticated` por `USING (true)`;
- `ProtectedRoute` verifica sessão, não escopo por unidade;
- o snapshot de `supabase_realtime` não continha tabelas publicadas, apesar de a UI anunciar “Modo Realtime Conectado”;
- `/escolas` exibe “Conectado · Supabase” sem health-check;
- `ErrorBoundary` apenas registra `console.error`; não existe camada externa de alerta de indisponibilidade/latência/falha de sincronização.

## 5. Achados positivos/controles

- não foi encontrado polling agressivo (`refetchInterval`, `setInterval` ou loop equivalente) no frontend;
- caching React Query atual é razoável para o volume de 163 escolas;
- o pipeline financeiro V2 passou a evitar reescritas semanticamente nulas;
- o browser não mantém uma base paralela operacional ampla em IndexedDB/sessionStorage; a exceção grave é o sandbox fiscal em `localStorage`;
- índices financeiros essenciais existem e são usados; não remover índices “unused” automaticamente apenas por Advisor.

## 6. Ordem operacional da campanha

1. DG-01/DG-03: bloquear falso sucesso fiscal + mock estrito;
2. DG-02: contrato de drift e decisão deliberada sobre ativação fiscal;
3. DG-05: edição cadastral atômica;
4. DG-04/DG-06: importação da BASE por delta/transação e redução de escrita/auditoria desnecessária;
5. DG-09: conta vinculada a unidade + exercício + programa;
6. DG-10: Portal Diretor alinhado a uma autoridade financeira única;
7. DG-11/DG-19/DG-20: RLS/perfis/superfície de RPC/Auth;
8. DG-12/DG-18: estados reais de conectividade + observabilidade externa;
9. DG-07/DG-08/DG-15/DG-16/DG-17: escala, retenção, browser e índices conforme evidência.

A ordem só deve mudar se houver nova evidência de risco maior ou dependência técnica; registrar a mudança no documento de hardening.

## 7. Sincronização financeira automática

Workflow: `.github/workflows/sync-financial-snapshot.yml`.

O YAML possui gatilhos manuais/eventuais/agendados, mas o schedule só publica quando `PDDE_FINANCIAL_SYNC_ENABLED == 'true'` e os secrets de backend esperados estão configurados.

Não ativar esse gate durante a campanha apenas para “testar” o banco. Publicação manual/produção continua domínio protegido.

## 8. CI e lacuna de testes identificada

O CI possui typecheck, lint, testes, cobertura, build, E2E/acessibilidade, auditorias e replay local de migrations.

A auditoria mostrou, contudo, que **teste verde não era suficiente para provar compatibilidade com Production**, porque o mock Supabase aceitava RPC desconhecida e o replay local contém migrations fiscais que o banco remoto não recebeu.

A campanha deve adicionar validações específicas de contrato/drift para impedir essa classe de falso positivo.

## 9. Roteiro obrigatório para continuidade

1. `AGENTS.md`;
2. `docs/README.md`;
3. `.continuity/current-state.json`;
4. `docs/HANDOFF.md`;
5. `docs/DECISIONS.md`;
6. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
7. `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md` enquanto `Status: ATIVO`;
8. documentação técnica específica do tópico;
9. código/PR/CI/Supabase/Production atuais conforme o escopo.

Depois da leitura, **não refazer toda a auditoria por padrão**. Comparar o tópico em trabalho com as fontes reais e avançar do último estado registrado.

## 10. Próximo ponto exato de retomada

**Tópico:** DG-01 + DG-03.  
**Objetivo:** tornar impossível que o fluxo operacional informe homologação/estorno fiscal bem-sucedido quando o contrato remoto não existe, e impedir que o mock E2E masque RPC desconhecida.  
**Método:** TDD, começando por teste que falhe no comportamento atual; depois correção mínima; depois validação abrangente e atualização do registro de hardening/continuidade.  
**Production Supabase:** somente leitura nesta etapa.