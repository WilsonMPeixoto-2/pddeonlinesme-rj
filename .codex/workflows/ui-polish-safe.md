# Workflow: ui-polish-safe

Use para qualquer polimento, redesign, restyle ou correção visual do PDDE Online.

## Regra central

Mudança visual não termina em código verde. O resultado precisa ser renderizado, inspecionado e comparado com a referência aprovada quando houver.

## Fluxo obrigatório

1. Confirmar que a tarefa é visual e identificar explicitamente qualquer contrato de dados, navegação ou comportamento que não pode mudar.
2. Ler `AGENTS.md`, `docs/UI_CHANGELOG.md` e a referência visual/Preview vigente da superfície afetada.
3. Tratar screenshot, mockup ou Preview aprovado como **especificação**, não inspiração. Não reinterpretar hierarquia, proporções, densidade, tipografia, cores ou posição sem decisão explícita.
4. Preservar Light Mode e Dark Mode institucionais quando ambos fizerem parte da superfície.
5. Evitar redesign global sem decisão explícita. Alterar apenas as telas/componentes autorizados.
6. Antes de criar nova camada de CSS/override, localizar a autoridade real do estilo e a cascata relevante. Não empilhar correções sobre uma arquitetura visual já confusa.
7. Trabalhar em branch/Preview. Production não é ambiente de experimento visual.
8. Rodar os gates técnicos proporcionais, incluindo `npx tsc --noEmit`, `npm run lint` e `npm run build` quando houver código, além dos testes/E2E aplicáveis.
9. Abrir a implementação real em navegador e verificar pelo menos:
   - primeiro viewport;
   - clipping e overlap;
   - wrapping e overflow;
   - z-index;
   - tipografia e hierarquia;
   - assets e ícones;
   - estados de loading/erro/sucesso afetados;
   - console sem erro material relacionado;
   - interação principal da superfície quando houver.
10. Capturar screenshot da implementação real. Quando houver referência aprovada, manter um pequeno registro das divergências e corrigir as materiais antes de encerrar.
11. Validar desktop alvo e ao menos um viewport responsivo quando aplicável.
12. Não promover a mudança para `main`/Production antes de a implementação renderizada ter sido revisada e, em redesign/restyle relevante, aprovada pelo usuário.
13. Registrar mudança relevante em `docs/UI_CHANGELOG.md` e atualizar handoff/estado somente quando o fato operacional realmente mudar.

## Completion audit

Antes de declarar a tarefa concluída, verificar requisito por requisito e associar cada um à evidência correspondente. Build/lint/CI não provam fidelidade visual. Screenshot conceitual aprovado não prova que a implementação corresponde ao conceito.

Se uma tentativa visual falhar, reavaliar a causa antes de empilhar outra correção. Após duas tentativas sem resolver, interromper o ciclo de remendos e revisar a abordagem; sintomas recorrentes em componentes diferentes exigem revisão arquitetural antes de continuar.
