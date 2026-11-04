# PDDE Online — verificação técnica e lições de incidentes externos

**Referência suplementar, 04/11/2026.** A fonte de verdade continua sendo `AGENTS.md`, `docs/DECISIONS.md`, `.continuity/current-state.json`, código, migrações, CI e Production. Este texto não altera qualquer regra financeira ou institucional.

## Padrões reutilizáveis
1. **Escopo antes de ação:** identificar repositório `pddeonlinesme-rj`, projeto Vercel e banco Supabase efetivos; o motor `pdde-repasse-conciliador` é projeto distinto, não uma base substituta nem um ambiente de homologação intercambiável.
2. **Falhas de deploy:** confrontar project ID, branch/SHA, target, logs completos, primeiro erro fatal e mudanças no lockfile. Causas observadas em projetos diferentes (Supabase suspenso na Vercel, `ERESOLVE`, `EUSAGE`) são exemplos, **não** diagnósticos presumidos para este sistema.
3. **Persistência e reconciliação:** não confundir dashboard com banco reconciliado. Verificar registros remotos, origem FNDE/SIGEF/PDDEInfo, unicidade, cobertura, competência e estados atômicos conforme contratos do projeto; manter trilha de proveniência.
4. **Proteções:** para preview Vercel protegido, utilizar autenticação oficial do CLI/browser, sem desativar Deployment Protection. Para dados e RLS, testar apenas fixtures adequadas e o backend autorizado.
5. **Gate de entrega:** validar CI, migrations/contratos, SHA realmente publicado, links e fluxos em navegador, consistência financeira e relatórios após recarga. Separar `não testado` de `passou`.
6. **Governança:** `docs/DECISIONS.md` e `AGENTS.md` prevalecem. Não alterar processos, permissões, fontes de verdade ou aplicações financeiras apenas porque outra ferramenta ofereceu uma alternativa.

Registrar relatórios com projeto/ambiente, ID do deployment, SHA, primeira falha comprovada, correção aplicada, testes, risco residual e pendências. Nenhum dado real de escola/servidor deve ser incluído em fixtures públicas.
