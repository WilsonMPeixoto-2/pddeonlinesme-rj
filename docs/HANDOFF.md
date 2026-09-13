# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 13/09/2026  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`  
**Campanha ativa:** `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md`  
**Branch ativa:** `fix/data-governance-hardening-2026-09-13`  
**Draft PR:** #137

> Este handoff é uma fotografia operacional. Código, banco, CI e deployment real prevalecem em caso de divergência. Enquanto a campanha de hardening estiver ativa, o agente deve ler o registro técnico, comparar o tópico com as fontes reais e continuar do último ponto verificado, sem reiniciar a auditoria do zero.

## 1. Estado verificado mais recente

### Baseline e branch

- `main` auditado: `578b94c1ae0e3709aaa597b124f0a1e89833a972`, com PR #136 já incorporado;
- branch da campanha: `fix/data-governance-hardening-2026-09-13`;
- PR #137 permanece draft e concentra as correções de hardening;
- DG-01 e DG-03 estão `BRANCH_VERIFIED`;
- DG-02 está `IN_PROGRESS` e é o próximo ponto exato de trabalho.

O estado Vercel posterior ao PR #136 ainda não deve ser usado para afirmar o SHA de Production sem nova verificação específica.

### Supabase oficial

Projeto: `raluxyojqosfzrfozmpz`.

Snapshot já consolidado da campanha: 163 escolas, 335 contas bancárias, 537 repasses financeiros, 163 linhas de `execucao_financeira`, 500 linhas observadas em `audit_logs`; após o incidente, o banco voltou a responder com cache hit alto, mas houve indisponibilidade real com Disk I/O em 100% no compute Nano e `CONNECT_TIMEOUT`.

Em 13/09/2026, leitura direta reconfirmou:

- `public.despesas_fiscais`: ausente;
- `public.homologar_despesa_fiscal(...)`: ausente;
- `public.estornar_despesa_fiscal(uuid)`: ausente;
- migrations remotas `20260527000200` e `20260527000300`: ausentes do histórico oficial.

Nenhuma migration fiscal, DDL ou `migration repair` foi executado em Production.

## 2. DG-01 e DG-03 — etapa concluída na branch

A baseline permitia falso sucesso fiscal no navegador: homologação e estorno podiam cair para `localStorage`/cache quando a infraestrutura remota não existia, e o mock E2E retornava sucesso genérico para RPC desconhecida.

Na branch atual:

- `FiscalConferencia.tsx` bloqueia homologação se o contrato fiscal estiver ausente;
- `EscolaEditar.tsx` bloqueia estorno se o contrato fiscal estiver ausente;
- nenhum desses fluxos cria `sandbox_despesas_fiscais` nem altera cache para simular persistência;
- o formulário de homologação é preservado no erro;
- a despesa permanece na lista quando o estorno não pode ser persistido;
- `tests/e2e/supabase-mock.ts` devolve `404/PGRST202` para RPC desconhecida.

### Prova TDD/CI

O teste de estorno foi confirmado em RED no CI run 331: 12 E2E passaram e o novo cenário falhou exatamente porque a mensagem/conduta bloqueante ainda não existia. Depois da correção em `EscolaEditar.tsx`, commit `d3460997202f38804948166407aecc3b297af663`, o job principal do CI run 332 passou integralmente: typecheck, lint, 175 testes unitários, cobertura, auditoria do template, build, bundle budget, E2E/acessibilidade, Knip e auditoria de vulnerabilidades de produção.

**Não promover DG-01/DG-03 a Production/CLOSED antes de merge/deploy e verificação publicada.**

## 3. Próximo ponto exato: DG-02 — migration/object drift fiscal

O repositório contém:

- `supabase/migrations/20260527000200_despesas_fiscais.sql`;
- `supabase/migrations/20260527000300_estorno_despesas.sql`.

O Supabase oficial não registra essas versões e não possui os objetos fiscais que elas criariam. Isso significa que o replay local de migrations e Production representam contratos diferentes.

### Objetivo da etapa DG-02

Criar uma verificação automatizada **somente leitura** que torne explícito o estado esperado do domínio fiscal e detecte divergência entre:

1. migrations críticas existentes no repositório;
2. histórico remoto `supabase_migrations.schema_migrations`;
3. objetos críticos efetivamente existentes (`despesas_fiscais`, RPC de homologação e RPC de estorno);
4. estado operacional declarado da Frente Fiscal.

Enquanto a decisão humana continuar sendo “não ativar a Frente Fiscal”, a ausência remota é um estado deliberado e o frontend deve permanecer bloqueante, não uma falha a ser automaticamente “corrigida” com `db push`/`migration repair`.

A documentação oficial do Supabase confirma que arquivos locais e histórico remoto são sistemas separados e que `supabase migration list` é o mecanismo de diagnóstico de divergência. Não usar `migration repair` para fabricar sincronismo documental sem resolver conscientemente a diferença de contrato.

## 4. Ordem operacional depois de DG-02

1. DG-05: tornar edição cadastral uma única operação atômica;
2. DG-04/DG-06: importação da BASE por delta + transação e redução de escrita/auditoria desnecessária;
3. DG-09: resolver conta por unidade + exercício + programa;
4. DG-10: alinhar Portal Diretor à autoridade financeira oficial;
5. DG-11/DG-19/DG-20: RLS, perfis, superfície RPC/Auth;
6. DG-12/DG-18: remover estados decorativos de conectividade e instituir observabilidade real;
7. DG-07/DG-08/DG-15/DG-16/DG-17: escala, retenção, browser e índices conforme evidência.

A ordem só muda com nova evidência de risco/dependência e deve ser registrada no relatório de hardening.

## 5. Regras protegidas durante a campanha

- Production Supabase não recebe migration fiscal por impulso;
- não usar `migration repair` como maquiagem de drift deliberado;
- não usar `service_role` no browser;
- não enfraquecer RLS para resolver incompatibilidade funcional;
- ausência de dado não vira zero;
- estado visual não pode declarar persistência, conectividade ou realtime sem evidência correspondente;
- mudança que toca dados deve ser confrontada com banco/schema real, não apenas mocks;
- ao concluir cada tópico, atualizar relatório de hardening, `.continuity/current-state.json`, este handoff e `.continuity/session-log.jsonl`.

## 6. Roteiro obrigatório para qualquer próximo chat/agente

1. ler `AGENTS.md` e `docs/README.md`;
2. ler `.continuity/current-state.json` e este `docs/HANDOFF.md`;
3. ler `docs/DECISIONS.md`;
4. ler `docs/technical/DATA_GOVERNANCE_HARDENING_2026.md` enquanto `Status: ATIVO`;
5. confirmar branch/PR/SHA e comparar o tópico corrente com código, migrations, CI e Supabase reais;
6. continuar do estado registrado, sem reexecutar toda a auditoria por padrão;
7. atualizar continuidade ao concluir a etapa.

## 7. Próxima ação técnica

**Tópico:** DG-02.  
**Estado:** `IN_PROGRESS`.  
**Ação:** implementar, por TDD, um contrato automatizado de drift fiscal somente leitura. O teste deve primeiro provar que a verificação detecta combinações incoerentes de migrations/objetos/estado declarado. Depois implementar o verificador mínimo e integrá-lo ao CI sem aplicar nenhuma migration em Production.  
**Production Supabase:** somente leitura nesta etapa.