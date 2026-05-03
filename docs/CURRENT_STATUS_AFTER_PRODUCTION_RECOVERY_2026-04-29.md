> **Documento histórico.** Este registro foi superado pelo encerramento da Supabase Foundation v1 em 2026-05-02. Para continuidade atual, consulte `docs/PROJECT_STATE.md`, `docs/SUPABASE_FOUNDATION_V1_CLOSURE.md` e `docs/GLOBAL_PLAN_V4_RECONCILIATION_AFTER_SUPABASE.md`.

# PDDE Online 2026 — Estado atual após recuperação da produção

Data: 2026-04-29

## 1. Finalidade

Este documento registra o estado operacional do projeto após a recuperação da produção realizada por meio das PRs #8 e #9.

O objetivo é reduzir confusão entre produção, branches de migração, PRs históricos e estados locais de máquinas diferentes.

## 2. Fonte de verdade

A fonte oficial de continuidade do projeto é o GitHub, complementado pelos deployments/Previews da Vercel.

Estados locais em PC, notebook, clones temporários, Lovable, Codex, Antigravity ou Claude não devem ser tratados como fonte de verdade se divergirem do GitHub.

## 3. Produção

Status: recuperada e funcional como vitrine do protótipo.

Produção ativa:

```text
https://pddeonlinesme-rj.vercel.app
```

Estado confirmado:

- a tabela de escolas voltou ao normal;
- a rota direta `/escolas` não retorna mais 404;
- a produção não deve ser usada para testar migração Supabase;
- Lovable deve permanecer congelado para alterações diretas em produção.

## 4. PRs recentes e função real

| GitHub PR | Função real | Estado | Observação |
|---:|---|---|---|
| #5 | Revert de emergência anterior | Fechado e mesclado | Já cumpriu sua função histórica; não há ação pendente. |
| #6 | Alinhamento documental Plano v4 × Supabase | Aberto, não mesclado | Útil, mas precisa revisão/atualização antes de eventual merge. |
| #7 | PR3B — branch técnica da migração Supabase | Aberto, draft, não mesclado | Ponto oficial da migração em Preview/branch técnica. |
| #8 | Recuperação da tabela de escolas | Fechado e mesclado | Removeu a regressão do Lovable e a virtualização problemática. |
| #9 | Fallback SPA Vercel | Fechado e mesclado | Adicionou `vercel.json` para rotas profundas como `/escolas`. |

## 5. Diferença entre número do GitHub e etapa lógica

Os números dos PRs no GitHub não correspondem necessariamente às etapas lógicas do plano.

Exemplo:

- `PR #7` no GitHub é a etapa lógica `PR3B` da migração;
- `PR #4` do GitHub existiu e foi antigo, mas não corresponde ao futuro `PR4` lógico de cutover remoto;
- o futuro `PR4` lógico da migração ainda não foi iniciado.

## 6. Estado da migração Supabase

A migração Supabase continua em aberto e está preservada no PR #7:

```text
feature/pr3b-frontend-semantic-schema
```

Status do PR #7:

- aberto;
- draft;
- não mesclado;
- não aplicado em produção;
- não conectado ao Supabase remoto próprio;
- não inicia o PR4 lógico.

O PR #7 declara adaptação de frontend ao schema semântico, mas a `main` avançou depois dele com as PRs #8 e #9. Portanto, o PR3B precisa ser reconciliado com a `main` atual antes de qualquer avanço.

## 7. PR #6

O PR #6 é documental e operacional, mas foi aberto antes da recuperação final da produção.

Não deve ser mesclado sem revisão, porque pode estar desatualizado em relação ao estado pós-PR #8/#9.

Possíveis caminhos:

1. atualizar o PR #6 para refletir este estado;
2. substituir o PR #6 por novo PR documental mais limpo;
3. fechar o PR #6 se ficar obsoleto após documentação de estado atual.

## 8. Próxima ação segura

A próxima ação segura não é iniciar PR4, não é criar migrations novas e não é mexer em produção.

Próxima ação recomendada:

```text
Auditar e reconciliar PR #7 / PR3B com a main atual pós-PR #8/#9.
```

Objetivos dessa reconciliação:

- confirmar o que está em produção;
- confirmar o que está apenas em PR3B;
- confirmar se o PR3B precisa incorporar `vercel.json`;
- confirmar se a correção da tabela da main conflita com a versão semântica do PR3B;
- indicar se o PR3B deve ser rebaseado, atualizado ou substituído;
- preservar produção intocada.

## 9. Bloqueios atuais

Não iniciar ainda:

- PR4 lógico de cutover remoto;
- Supabase remoto próprio;
- db push remoto;
- migrations novas;
- alteração de variáveis Vercel;
- monorepo;
- Fastify;
- Cloud Run;
- motor documental real;
- novas alterações Lovable em produção.

## 10. Regra operacional imediata

Toda nova tarefa deve começar informando:

- branch de origem;
- objetivo fechado;
- arquivos que pode alterar;
- arquivos que não pode alterar;
- comandos de validação;
- ponto de parada;
- handoff final.

Produção deve permanecer estável para demonstração institucional enquanto a migração continua em branch/Preview.
