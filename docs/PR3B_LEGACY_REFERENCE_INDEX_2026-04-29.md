# PDDE Online 2026 — Índice de referência do PR3B legado

Data: 2026-04-29
Branch limpa: `feature/pr3b-clean-semantic-schema`
Branch legada de referência: `feature/pr3b-frontend-semantic-schema`

## 1. Finalidade

Este documento atende ao Bloco 1 do plano de reconstrução limpa do PR3B.

A finalidade é registrar quais artefatos documentais da branch legada devem ser consultados, reaproveitados seletivamente ou tratados como obsoletos, sem sobrescrever a documentação mais recente da `main`.

## 2. Regra principal

A branch legada `feature/pr3b-frontend-semantic-schema` não deve ser mesclada diretamente.

Seus arquivos devem ser usados apenas como fonte de consulta e reaproveitamento seletivo.

## 3. Documentos recentes que prevalecem

Os seguintes documentos já estão na `main` e prevalecem sobre registros antigos:

- `docs/CURRENT_STATUS_AFTER_PRODUCTION_RECOVERY_2026-04-29.md`
- `docs/PR3B_RECONCILIATION_AFTER_PRODUCTION_RECOVERY_2026-04-29.md`
- `docs/PR3B_CLEAN_REBUILD_PLAN_2026-04-29.md`

Eles registram que:

- a produção foi recuperada pelas PRs #8 e #9;
- a PR #10 registrou o estado pós-recuperação;
- a PR #11 registrou a reconciliação do PR3B;
- o PR #6 foi fechado sem merge;
- o PR #7 deve permanecer como referência técnica, não como PR mesclável;
- a reconstrução deve ocorrer em branch limpa.

## 4. Documentos legados úteis como referência

A branch legada contém documentos úteis que podem ser consultados durante a reconstrução:

| Documento legado | Uso recomendado | Observação |
|---|---|---|
| `docs/PR3B_LOCAL_TESTING.md` | Consultar resultados de testes locais Supabase e dados de teste. | Atualizar qualquer referência antiga a commits, produção ou Vercel antes de reaproveitar. |
| `docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md` | Consultar decisões de higiene de repositório e contrato de ambiente. | Não substituir documentos recentes. |
| `docs/PR3B_PROMPTS.md` | Consultar prompts e restrições operacionais. | Útil para continuidade, mas deve ser adaptado ao novo fluxo online-first. |
| `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md` | Consultar diagnóstico de ambiente/variáveis de Preview. | Não aplicar alterações em Vercel nesta fase. |
| `docs/POST_PR3B_BACKLOG.md` | Consultar backlog técnico pós-PR3B. | Deve permanecer backlog, sem bloquear a reconstrução limpa. |

## 5. Diretrizes de reaproveitamento

Ao reaproveitar qualquer documento legado:

1. não sobrescrever documento mais recente da `main`;
2. atualizar datas, commits e referências de branch;
3. declarar que a produção atual já contém PR #8, #9, #10 e #11;
4. remover qualquer sugestão de merge direto do PR3B antigo;
5. preservar a regra de não iniciar PR4 lógico nesta etapa;
6. preservar a regra de não tocar em Supabase remoto, Vercel Production ou migrations novas.

## 6. Situação do Bloco 1

Status: iniciado e parcialmente concluído.

A estratégia escolhida neste momento foi criar um índice de referência em vez de copiar os documentos legados integralmente, para evitar introdução de conteúdo antigo ou conflitante na branch limpa.

A cópia integral de documentos legados poderá ser feita em etapa posterior, se houver necessidade objetiva.

## 7. Próximo passo documental

Após a validação técnica dos blocos iniciais, a próxima ferramenta poderá decidir se algum documento legado deve ser trazido para a branch limpa com atualização completa.

Até lá, este índice preserva a rastreabilidade sem contaminar a base atual.
