# Skill: institutional-ui-visual-law

Use para polimento institucional, acessibilidade visual, consistência de Light/Dark Mode, redesign e linguagem visual do PDDE Online 2026.

## Princípios

- Preservar a finalidade humana da superfície, o contrato de dados e a navegação já válidos.
- Preservar Light Mode e Dark Mode institucionais quando aplicáveis.
- Evitar redesign global sem decisão explícita.
- Não alterar contrato de dados durante polimento visual salvo quando isso fizer parte expressa do escopo.
- Uma referência visual aprovada é especificação. Não reinterpretar hierarquia, proporções, densidade, tipografia, cores, iconografia ou composição sem justificativa e aprovação.
- Preferir menos elementos bem resolvidos a cardificação, badges, glows, containers ou decoração adicionados apenas para “parecer moderno”.
- Corrigir a camada/componente que possui o estilo; não criar sucessivas folhas de override para esconder a causa.

## Evidência obrigatória

Mudança visual relevante exige:

1. renderização real da implementação;
2. inspeção de desktop e viewport responsivo aplicável;
3. screenshot atual;
4. comparação com a referência quando houver;
5. verificação de overlap, clipping, wrapping, overflow, z-index, hierarquia tipográfica, assets e estados afetados;
6. interação real da jornada principal quando houver;
7. Preview antes de Production para redesign/restyle relevante.

Build, lint, typecheck, teste de DOM e CI verde são necessários conforme o escopo, mas não substituem a prova visual.

## Falha e conclusão

Se a primeira correção não resolver, investigar a causa antes de adicionar outra camada. Após duas tentativas sem resolver, interromper o ciclo e rever a abordagem.

Antes de declarar conclusão, associar cada requisito visual/funcional à evidência que o comprova no SHA atual. Se a evidência for indireta, ausente ou referente a outro SHA, o requisito continua não verificado.

Registrar mudanças visuais relevantes no handoff ou changelog apropriado.
