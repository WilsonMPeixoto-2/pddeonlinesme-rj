# Hardening de dados e integração Supabase — PDDE Online 2026

**Status:** ATIVO  
**Início:** 13/09/2026  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Supabase oficial:** `raluxyojqosfzrfozmpz`  
**Baseline de código auditada:** `main@578b94c1ae0e3709aaa597b124f0a1e89833a972`  
**Branch de correção inicial:** `fix/data-governance-hardening-2026-09-13`

> Este é um **registro técnico operacional temporário da campanha de correções**. Ele não substitui `docs/DECISIONS.md`, `.continuity/current-state.json` ou `docs/HANDOFF.md`. Enquanto `Status: ATIVO`, porém, sua leitura e reconciliação com o código/banco reais são obrigatórias antes de qualquer tarefa que toque dados, Supabase, Auth/RLS, importação, financeiro, fiscal, caching, logs ou observabilidade.

## 1. Regra de continuidade obrigatória

Nenhuma ferramenta, agente ou novo chat deve reiniciar esta investigação do zero.

Ao assumir trabalho nesta campanha, deve:

1. ler `AGENTS.md`, `docs/README.md`, `.continuity/current-state.json`, `docs/HANDOFF.md`, `docs/DECISIONS.md` e este documento;
2. confirmar a branch/PR/SHA corrente e verificar se houve merge posterior ao último registro;
3. para cada item abaixo, **comparar o status documental com o código-fonte, migrations, banco real, CI e deployment que realmente existirem naquele momento**;
4. não reabrir item concluído sem nova evidência de regressão ou divergência;
5. não considerar item concluído apenas porque foi codificado: exigir a evidência definida no critério de aceite;
6. ao concluir uma etapa/tópico, atualizar este arquivo com status, evidência, commit/PR e observações de continuidade;
7. quando houver mudança operacional relevante, atualizar também `.continuity/current-state.json`, `.continuity/session-log.jsonl` e `docs/HANDOFF.md`;
8. quando a correção mudar decisão/regra permanente, atualizar `docs/DECISIONS.md`;
9. quando mudar prioridade da fila curta, atualizar `docs/ROADMAP_ADAPTIVE.md`;
10. deixar explícito o **próximo ponto de retomada**, evitando que o próximo agente tenha de reconstruir a investigação por memória ou por leitura integral do histórico.

### Estados permitidos

| Estado | Significado |
|---|---|
| `OPEN_VERIFIED` | problema confirmado no código/banco atual |
| `IN_PROGRESS` | correção em execução em branch/PR identificado |
| `CODE_FIXED` | código alterado, ainda sem validação completa |
| `BRANCH_VERIFIED` | testes/contrato/CI da branch confirmaram a correção |
| `MERGED` | merge em `main` confirmado |
| `PRODUCTION_VERIFIED` | comportamento e/ou banco real verificados após deploy/migration |
| `DEFERRED_DECISION` | depende de decisão humana explícita, não de implementação automática |
| `CLOSED` | correção concluída e verificada no nível exigido |

**Regra:** `CLOSED` nunca significa “o teste mock passou”. Para itens de dados, o contrato real do Supabase deve fazer parte da validação.

## 2. Escopo da auditoria

A auditoria não se limita ao incidente de Disk I/O. Ela cobre a relação completa entre:

- leitura e agregação de dados;
- gravação, upsert, update, delete e RPCs;
- React Query, cache, invalidação e prefetch;
- Supabase Data API, Realtime, Auth e RLS;
- migrations e drift entre repositório e banco real;
- triggers e trilha de auditoria;
- localStorage/session/storage no navegador;
- importação da BASE;
- pipeline financeiro do motor;
- frente fiscal;
- Portal do Diretor;
- geração de documentos em lote;
- observabilidade, logs e indicadores de saúde;
- crescimento futuro de volume e concorrência.

A meta não é apenas evitar o incidente atual, mas garantir que o sistema continue saudável conforme aumentem consultas, usuários, exercícios, programas, documentos e movimentações.

## 3. Baseline verificada em 13/09/2026

### 3.1. Banco e volume

Consultas de leitura ao PostgreSQL oficial confirmaram, no fechamento da auditoria inicial:

- 163 unidades escolares;
- 335 contas bancárias;
- 537 repasses financeiros;
- 163 linhas de `execucao_financeira`;
- 500 linhas em `audit_logs`;
- 13 conexões totais e 1 ativa no snapshot de saúde;
- cache hit aproximado de 99,94%;
- 7 arquivos temporários acumulados e aproximadamente 55,6 MB em `temp_bytes` no contador observado.

O banco voltou a responder após o episódio de indisponibilidade. Isso não invalida o incidente: Disk I/O chegou a 100% no Nano e consultas administrativas chegaram a `CONNECT_TIMEOUT`.

### 3.2. Evidência histórica de reescrita

`pg_stat_user_tables` mostrou, para apenas 537 repasses atualmente existentes, aproximadamente:

- 1.074 inserts;
- 1.182 updates;
- 537 deletes.

Para 335 contas atuais, o contador observado registrou aproximadamente 996 updates.

Esses números acumulam migrations, testes, importações e reconciliações. Eles não provam isoladamente a origem do incidente, mas demonstram que uma base pequena já foi submetida a volume de mutação muito superior ao retrato final.

### 3.3. Pipeline financeiro após PR #136

A migration `20260913033820_financial_publication_delta_v2.sql` substituiu a troca integral por reconciliação incremental, incluindo:

- advisory lock por exercício;
- idempotência por run/artifact;
- digest semântico de negócio;
- retorno `unchanged` quando o snapshot financeiro é semanticamente igual;
- `UPSERT ... WHERE ... IS DISTINCT FROM` para escrever apenas delta real;
- proteção contra regressão de run e cobertura.

A prova observada mostrou uma publicação alterada em aproximadamente 398 ms e uma repetição semanticamente igual em aproximadamente 30 ms, sem alterações operacionais. **Esse caminho passa a ser a referência arquitetural para outras rotinas de escrita em lote.**

## 4. Registro de achados e correções

### DG-01 — Frente Fiscal pode “homologar” somente no navegador

**Severidade:** CRÍTICA  
**Status:** `BRANCH_VERIFIED`

**Evidência original confirmada:**

- o banco real não possui `public.despesas_fiscais`;
- o banco real não possui `public.homologar_despesa_fiscal(...)`;
- o banco real não possui `public.estornar_despesa_fiscal(...)`;
- a baseline de `FiscalConferencia.tsx` e `EscolaEditar.tsx` transformava ausência do contrato remoto em sucesso local e usava `localStorage['sandbox_despesas_fiscais']`.

**Correção implementada na branch/PR #137:**

- `FiscalConferencia.tsx` não possui mais fallback de homologação local; ausência da tabela/RPC gera erro bloqueante e preserva o formulário;
- `EscolaEditar.tsx` não possui mais fallback de estorno local nem alteração artificial de cache; ausência da RPC gera erro bloqueante e a despesa permanece inalterada;
- códigos `PGRST202`, `42883` e `42P01`, além das mensagens equivalentes de contrato ausente, são tratados como indisponibilidade real de persistência, nunca como sucesso;
- o banco oficial foi reconferido por leitura em 13/09/2026 e continua deliberadamente sem `despesas_fiscais`, `homologar_despesa_fiscal` e `estornar_despesa_fiscal`.

**Validação:** o teste de homologação ficou vermelho antes da correção e passou depois. O teste de estorno foi introduzido em RED no run 331, falhando exatamente porque o comportamento bloqueante ainda não existia; após o commit `d3460997202f38804948166407aecc3b297af663`, o job `Typecheck, Lint, Test, Build & E2E` do run 332 passou integralmente, incluindo E2E/acessibilidade, Knip e auditoria de vulnerabilidades de produção.

**Risco residual:** a correção ainda está em branch/draft PR. Não marcar como `PRODUCTION_VERIFIED` ou `CLOSED` antes de merge/deploy e verificação do comportamento publicado.

**Critério de aceite:**

- [x] branch não grava domínio fiscal em localStorage quando o contrato remoto está ausente;
- [x] RPC/tabela ausente gera erro operacional, não sucesso;
- [x] E2E cobre `404/PGRST202` para homologação e estorno;
- [x] falso cache/sandbox operacional foi removido dos dois fluxos identificados;
- [ ] merge/deploy e verificação em Production.

---

### DG-02 — Migration drift entre GitHub e Supabase no domínio fiscal

**Severidade:** CRÍTICA  
**Status:** `IN_PROGRESS`

**Evidência reconfirmada em 13/09/2026:** o repositório contém `20260527000200_despesas_fiscais.sql` e `20260527000300_estorno_despesas.sql`, mas a listagem real de migrations do projeto oficial continua sem essas versões; a sequência remota salta de `20260527000100` para `20260909002935`. Consulta somente leitura também confirmou `to_regclass('public.despesas_fiscais') = NULL` e ausência das RPCs fiscais.

**Risco:** CI/replay local e E2E podem validar um contrato que Production não possui.

**Correção exigida:** instituir verificação explícita de drift de migrations/objetos críticos e decidir conscientemente se a Frente Fiscal será ativada no banco ou permanecerá bloqueada. **Não aplicar migrations fiscais em Production apenas porque existem no repositório.**

**Diretriz técnica atual:** a documentação oficial do Supabase confirma que migrations locais e o histórico remoto em `supabase_migrations.schema_migrations` são sistemas separados e recomenda `supabase migration list` para diagnosticar divergência. `migration repair` altera histórico e, portanto, não deve ser usado nesta campanha para “apagar” deliberadamente o drift fiscal sem decisão explícita sobre o domínio.

**Critério de aceite:** contrato automatizado detecta ausência/divergência de migration/objeto crítico; estado da Frente Fiscal fica deliberado e documentado.

---

### DG-03 — Mock E2E mascara ausência real de infraestrutura fiscal

**Severidade:** CRÍTICA  
**Status:** `BRANCH_VERIFIED`

**Evidência original:** o mock E2E retornava sucesso genérico para RPCs desconhecidas, permitindo falso verde mesmo sem contrato remoto.

**Correção implementada na branch/PR #137:** `tests/e2e/supabase-mock.ts` passou a devolver `404/PGRST202` para RPC desconhecida; somente RPCs explicitamente modeladas podem retornar sucesso. Os testes específicos de homologação e estorno fiscal exercitam esse comportamento.

**Validação:** RED real observado antes da correção de cada fluxo; após as correções, o job principal do CI do run 332 passou typecheck, lint, unitários, cobertura, auditoria do template, build, budget, E2E/acessibilidade, Knip e `npm audit --omit=dev --audit-level=high`.

**Risco residual:** o replay local contém migrations fiscais que Production não possui. Essa diferença é exatamente o foco de DG-02; portanto, DG-03 não deve ser promovido a `CLOSED` antes de existir uma camada explícita de contrato/drift.

---

### DG-04 — Importação da BASE regrava conjuntos inteiros e não é atômica

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** `src/lib/baseImporter.ts` e `scripts/import-base-remote.mjs` executam upsert em lote de `unidades_escolares` e depois outro upsert de `execucao_financeira`, sem uma única transação de servidor e sem filtro de delta real por campo.

**Riscos:** WAL/I/O desnecessário, triggers/auditoria desnecessários, estado parcial se uma etapa gravar e a seguinte falhar.

**Correção exigida:** migrar a operação para fronteira transacional server-side, com validação, diff e escrita somente de alterações reais, seguindo o princípio do publisher financeiro V2.

**Critério de aceite:** reimportação sem mudança produz zero alterações operacionais; falha intermediária faz rollback integral; contagem/erros ficam auditáveis.

---

### DG-05 — Edição cadastral pode persistir parcialmente

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** `useUpdateUnidadeCadastro.ts` chama RPC para parte do cadastro e realiza update separado do e-mail.

**Risco:** primeira escrita pode persistir e a segunda falhar; UI pode tratar a mutation como falha única apesar de o banco já ter mudado parcialmente.

**Correção exigida:** uma operação lógica de cadastro deve corresponder a uma transação/RPC única, inclusive e-mail.

**Critério de aceite:** todos os campos editáveis do mesmo submit são atômicos e o teste de falha comprova rollback.

---

### DG-06 — Auditoria amplifica escrita quando rotinas regravem dados sem necessidade

**Severidade:** MÉDIA/ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** triggers auditam `unidades_escolares` e `contas_bancarias`; os 500 registros atuais de `audit_logs` observados eram 334 inserts e 166 updates de contas.

**Diretriz:** auditoria deve registrar mudança real; a correção prioritária é eliminar regravação desnecessária, não remover auditoria legítima.

**Critério de aceite:** rotinas de sincronização/importação sem delta não disparam updates/auditoria.

---

### DG-07 — Leituras do Dashboard são saudáveis hoje, mas baixam domínios inteiros

**Severidade:** MÉDIA / ESCALABILIDADE  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** `repassesFinanceirosOptions` busca todos os repasses do exercício e `contasFinanceirasOptions` busca todas as contas do exercício; agregações principais são calculadas no cliente. O cache atual é de 5 min para financeiro e 15 min para o resumo do Dashboard.

**Avaliação atual:** 537 repasses e 335 contas tornam isso aceitável hoje. Não é a causa direta da indisponibilidade.

**Correção futura:** quando crescerem exercícios/CREs/movimentos/documentos, mover agregações executivas para view/RPC e paginar listas.

**Critério de aceite para encerramento:** gatilho de escala e arquitetura de migração documentados ou agregação server-side implementada quando o volume justificar.

---

### DG-08 — `/escolas` carrega localizador + detalhe completo e faz prefetch adicional

**Severidade:** MÉDIA / ESCALABILIDADE  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** a página carrega `vw_unidades_localizador`, `useUnidadesDetalheLista` e prefetch de `vw_unidade_detalhe` por hover.

**Avaliação atual:** aceitável para 163 UEs; duplicação desnecessária para escala maior.

**Correção:** incluir no localizador apenas os derivados necessários ao status cadastral ou criar view de carteira adequada, mantendo detalhe sob demanda.

---

### DG-09 — `vw_unidade_detalhe` escolhe conta sem respeitar programa/exercício

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** a LATERAL de contas filtra apenas `cb.unidade_id = u.id` e ordena `principal DESC`; não relaciona `cb.exercicio` e `cb.programa` à linha de `execucao_financeira`.

O banco possui contas distintas de Básico e Qualidade para todas as 163 escolas verificadas.

**Risco:** ao ampliar o detalhe para outros programas, a conta exibida pode ser a do Básico.

**Correção exigida:** resolução de conta deve considerar `unidade + exercício + programa`, preservando multiplicidade quando aplicável.

**Critério de aceite:** teste SQL com contas distintas por programa comprova que cada linha de detalhe usa a conta do próprio contexto.

---

### DG-10 — Portal do Diretor usa contrato financeiro incompatível

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** `PortalDiretor.tsx` chama `useUnidadeDetalhe` com `programa: 'PDDE'`, enquanto `execucao_financeira` real contém `programa = 'basico'` para as 163 linhas verificadas. Partes do portal também usam campos legados `saldo_anterior`, `recebido` e `gasto`, em paralelo ao novo domínio financeiro.

**Risco:** detalhe vazio e duas verdades financeiras no mesmo produto.

**Correção exigida:** alinhar programa/contrato e definir uma única autoridade financeira por informação exibida.

---

### DG-11 — RLS de leitura é ampla demais para futuro perfil Diretor

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** políticas `SELECT` em `unidades_escolares`, `contas_bancarias`, `execucao_financeira` e `repasses_financeiros` usam `USING (true)` para `authenticated`; `ProtectedRoute` apenas verifica existência de sessão; associação escola-diretor ocorre no frontend.

**Avaliação atual:** Auth possuía apenas 2 usuários na consulta realizada, portanto não há evidência de incidente atual. Há risco arquitetural antes da expansão de perfis.

**Correção exigida antes de liberar diretores reais:** papel/escopo explícito e RLS por unidade ou superfície segregada de leitura.

---

### DG-12 — UI anuncia Realtime/Conectado sem medição real

**Severidade:** ALTA institucional / MÉDIA técnica  
**Status:** `OPEN_VERIFIED`

**Evidência confirmada:** há listeners `postgres_changes`, mas `pg_publication_tables` para `supabase_realtime` retornou zero tabelas; a UI exibe “Modo Realtime Conectado” e “Conectado · Supabase” sem health-check correspondente.

**Risco:** sinal verde decorativo durante degradação/indisponibilidade real.

**Correção exigida:** remover afirmações não medidas ou conectá-las a estado verificável. Realtime só deve ser anunciado se o canal/subscription e publicação correspondente existirem.

---

### DG-13 — Não foi encontrado polling agressivo no frontend

**Severidade:** POSITIVO / CONTROLE  
**Status:** `CLOSED`

**Evidência:** busca focada não encontrou `refetchInterval`, `setInterval` ou loop equivalente de chamadas Supabase na aplicação. React Query global evita refetch em foco e aplica caching.

**Regressão a observar:** qualquer novo polling deve ter justificativa, intervalo explícito, cancelamento e análise de custo.

---

### DG-14 — Persistência no navegador está quase restrita à sessão, exceto sandbox fiscal

**Severidade:** ALTA por causa do fiscal  
**Status:** `OPEN_VERIFIED`

**Evidência:** cliente Supabase persiste sessão Auth em `localStorage`, comportamento normal para SPA; não foi identificada base operacional em IndexedDB/sessionStorage. Os dois fallbacks fiscais conhecidos foram removidos na branch da campanha e passam por E2E estrito, mas este item permanece aberto até a revisão final de persistência no navegador após integração da correção.

**Correção:** eliminar persistência operacional fiscal em Production e manter apenas preferências/sessão compatíveis com o modelo de segurança.

---

### DG-15 — Geração em lote é client-side e pode pressionar memória do navegador

**Severidade:** MÉDIA / ESCALABILIDADE  
**Status:** `OPEN_VERIFIED`

**Evidência:** geração usa ExcelJS/JSZip no cliente e acumula documentos antes do ZIP final.

**Avaliação atual:** funcional para 163 UEs, mas deve possuir limite/estratégia antes de escala muito maior.

**Opções futuras:** limite explícito, processamento em Web Worker ou geração server-side/streaming conforme volume e necessidade operacional.

---

### DG-16 — Logs/histórico não possuem política operacional de crescimento/retenção

**Severidade:** MÉDIA  
**Status:** `OPEN_VERIFIED`

**Evidência:** `audit_logs` já existe e é crescente; `document_generation_runs` usa paginação, mas `count: exact`; não há política operacional consolidada de retenção/arquivamento.

**Correção:** definir gatilhos de volume e política de retenção/arquivamento compatível com auditoria institucional antes de crescimento material.

---

### DG-17 — Índices suficientes, com redundâncias e “unused” que exigem análise antes de remoção

**Severidade:** BAIXA/MÉDIA  
**Status:** `OPEN_VERIFIED`

**Evidência:** Advisor reportou 12 índices sem uso no snapshot; `execucao_financeira` possui índice explícito equivalente à chave única `(unidade_id, exercicio, programa)`.

**Diretriz:** não remover índice automaticamente por lint. Confirmar planos, workload e período de observação. Racionalizar redundância apenas com evidência.

---

### DG-18 — Observabilidade da aplicação é insuficiente

**Severidade:** ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência:** `ErrorBoundary` limita-se a `console.error`; não há monitor operacional que avise sobre saúde do banco, timeout, erro de API, falha de sincronização ou freshness de snapshot. O incidente de Disk I/O só foi percebido por entrada manual no painel do Supabase.

**Correção exigida:** criar camada externa de observabilidade com health-check leve e alertas fora do próprio banco/aplicação degradada. Definir métricas mínimas: disponibilidade, latência, erro, última publicação financeira, falha de workflow e saúde do banco quando a plataforma permitir.

---

### DG-19 — Funções `SECURITY DEFINER` expostas ao papel `authenticated`

**Severidade:** MÉDIA/ALTA  
**Status:** `OPEN_VERIFIED`

**Evidência:** Security Advisor apontou `admin_assign_role`, `admin_revoke_role`, `apply_partial_bulk_update`, `has_role` e `list_admin_users` executáveis por `authenticated`. As funções administrativas verificadas fazem validação interna de role, portanto não foi demonstrado bypass imediato.

**Correção:** reduzir superfície EXECUTE ao mínimo necessário e confirmar cada RPC contra consumidores reais antes de revogar. Não enfraquecer RLS para “resolver” incompatibilidade.

---

### DG-20 — Leaked Password Protection desabilitada

**Severidade:** MÉDIA  
**Status:** `DEFERRED_DECISION`

**Evidência:** Security Advisor do Supabase reportou proteção contra senha comprometida desabilitada.

**Correção:** avaliar habilitação considerando plano e política de autenticação. Não é causa do incidente de recursos.

## 5. Ordem de correção aprovada

A ordem de execução desta campanha é:

1. bloquear falsa persistência/sucesso da Frente Fiscal em Production;
2. tornar mocks Supabase estritos e adicionar testes que consigam detectar contrato ausente;
3. reconciliar deliberadamente o drift fiscal, sem aplicar migration produtiva por impulso;
4. tornar edição cadastral uma única operação atômica;
5. redesenhar importação da BASE para delta + transação;
6. corrigir resolução de conta em `vw_unidade_detalhe`;
7. alinhar Portal do Diretor ao domínio financeiro oficial;
8. revisar RLS/perfis antes de expansão de diretores;
9. substituir estados decorativos de conectividade/realtime por estado real ou removê-los;
10. instituir observabilidade externa/health contract;
11. depois tratar otimizações de escala, retenção e índices com evidência.

A ordem pode mudar apenas se nova evidência demonstrar risco maior, regressão ou dependência técnica. A mudança deve ser registrada neste documento e no handoff.

## 6. Regras de implementação durante a campanha

- Cada tópico deve ser tratado em mudança pequena e revisável.
- Aplicar TDD sempre que houver mudança de comportamento: primeiro teste que reproduz o problema, depois correção mínima.
- Para Supabase/RLS/migrations, validar também contrato SQL/replay de migrations e banco/branch apropriado.
- Não executar DDL destrutivo ou migration de Production sem autorização humana explícita.
- Não reativar automaticamente a Frente Fiscal apenas porque suas migrations existem.
- Não trocar performance por perda de rastreabilidade institucional.
- Não otimizar por contagem pequena de benchmark sintético quando o problema é integridade/transação.
- Toda correção deve explicitar se reduz I/O, evita retrabalho, elimina estado paralelo ou melhora rastreabilidade.

## 7. Checklist obrigatório ao encerrar cada tópico

Antes de marcar um item como concluído:

- [ ] código-fonte atual foi relido, não assumido pela documentação;
- [ ] banco/schema real foi comparado quando o tópico toca dados;
- [ ] teste específico reproduziu a falha antes da correção, quando aplicável;
- [ ] teste específico passou depois da correção;
- [ ] typecheck/lint/test/build relevantes foram executados;
- [ ] contrato Supabase/SQL foi validado quando aplicável;
- [ ] diff foi revisado para garantir que não houve ampliação acidental de escopo;
- [ ] este documento foi atualizado com status/evidência;
- [ ] `.continuity/current-state.json`, `docs/HANDOFF.md` e `.continuity/session-log.jsonl` foram atualizados se o estado operacional mudou;
- [ ] próximo ponto de retomada foi registrado.

## 8. Registro de atualizações da campanha

### 2026-09-13 01:35 -03:00 — campanha instituída

**Origem:** auditoria específica de código + Supabase após incidente de Disk I/O.  
**Baseline:** `main@578b94c1ae0e3709aaa597b124f0a1e89833a972` (PR #136 já incorporada).  
**Resultado:** achados DG-01 a DG-20 consolidados; DG-13 já classificado como controle verificado; demais itens permanecem abertos ou dependentes de decisão.  
**Próximo ponto de retomada:** DG-01/DG-03, impedindo falso sucesso fiscal e endurecendo o mock para que infraestrutura inexistente não seja mascarada.

### 2026-09-13 — DG-01/DG-03 verificados na branch

**Branch/PR:** `fix/data-governance-hardening-2026-09-13`, draft PR #137.  
**TDD:** homologação e estorno receberam cenários E2E de contrato ausente; o estorno foi confirmado em RED no run 331 antes da alteração de `EscolaEditar.tsx`.  
**Implementação:** removidos fallbacks operacionais de homologação/estorno em `localStorage` e cache; RPC ausente passa a gerar erro bloqueante explícito. O mock passou a falhar RPC desconhecida com `404/PGRST202`.  
**Prova de branch:** commit de estorno `d3460997202f38804948166407aecc3b297af663`; job principal do CI run 332 integralmente verde, inclusive E2E/acessibilidade.  
**Banco oficial:** reconferido somente por leitura; as duas migrations fiscais e os três objetos fiscais continuam ausentes. Nenhuma migration/DDL foi aplicada.  
**Status:** DG-01 e DG-03 `BRANCH_VERIFIED`; DG-02 promovido a `IN_PROGRESS`.  
**Próximo ponto de retomada:** DG-02. Criar contrato automatizado de drift que compare migrations/objetos críticos sem alterar Production e registrar decisão explícita sobre manter a Frente Fiscal bloqueada ou ativá-la futuramente por migration revisada.

---

## 9. Condição de encerramento desta diretriz

Este documento permanece leitura obrigatória enquanto houver qualquer item `OPEN_VERIFIED`, `IN_PROGRESS`, `CODE_FIXED`, `BRANCH_VERIFIED`, `MERGED` ou `DEFERRED_DECISION` cuja decisão afete segurança/integridade operacional.

Quando todos os itens necessários forem `CLOSED` ou formalmente transferidos para decisão/backlog permanente:

1. consolidar decisões duradouras em `docs/DECISIONS.md`;
2. consolidar estado final em `.continuity/current-state.json` e `docs/HANDOFF.md`;
3. remover a obrigatoriedade temporária deste documento de `AGENTS.md`/roteiro de continuidade;
4. manter este arquivo como relatório técnico histórico, sem status operacional concorrente.