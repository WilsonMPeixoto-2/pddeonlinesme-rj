# Workflow: completion-audit

Use antes de afirmar que uma tarefa relevante está concluída, corrigida, publicada, revertida, sincronizada ou pronta para merge.

## Objetivo

Impedir que intenção, plano, commit, teste parcial ou descrição documental sejam tratados como prova do estado real.

## Procedimento

1. Reconstituir o objetivo completo do usuário sem reduzi-lo ao trabalho já executado.
2. Extrair todos os requisitos explícitos, invariantes, artefatos, gates e entregáveis aplicáveis.
3. Para cada requisito, identificar a fonte autoritativa que pode prová-lo no estado atual.
4. Revalidar a evidência no mesmo SHA/ambiente que será reportado ou promovido.
5. Classificar cada requisito como:
   - **COMPROVADO**;
   - **CONTRADITO**;
   - **INCOMPLETO**;
   - **EVIDÊNCIA FRACA/INDIRETA**;
   - **NÃO VERIFICADO**.
6. Não declarar conclusão enquanto requisito necessário permanecer fora de **COMPROVADO**.

## Escopo da evidência

A prova deve ter o mesmo alcance da afirmação:

- teste unitário não prova jornada E2E;
- CI verde não prova fidelidade visual;
- código em `main` não prova que Production serve o mesmo SHA;
- migration local não prova estado do Supabase remoto;
- documento/handoff não prova estado do sistema;
- screenshot conceitual não prova implementação;
- ausência de erro observado não prova comportamento que não foi exercitado.

## Publicação e rollback

Para afirmar publicação, confirmar SHA, deployment/alias efetivo e smoke proporcional do ambiente publicado.

Para afirmar rollback, confirmar não apenas o Git ref, mas que o artefato/estado esperado voltou a ser efetivamente servido.

Quando uma verificação não puder ser executada, registrar a lacuna explicitamente e manter o item como **NÃO VERIFICADO**.
