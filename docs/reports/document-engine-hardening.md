# Document Engine Hardening

## Finalidade

Registrar as regras tecnicas minimas do motor documental do Demonstrativo Basico individual para evitar regressao de template, cache de formulas e vazamento de dados entre unidades.

Este relatorio e curto por desenho. Ele nao substitui `AGENTS.md`, o Plano Global, nem os testes automatizados; serve como referencia operacional para novas alteracoes no motor documental.

## Estado atual

O Demonstrativo Basico individual usa `exceljs` para abrir o template publico `public/templates/demonstrativo-basico-4cre-template.xlsx`, preencher a aba `MEMORIA` com dados de `vw_unidade_detalhe`, remover a aba `BASE` do arquivo final e gravar o workbook como `.xlsx`.

No estado atual, formulas simples da aba `Demonstrativo` que apontam diretamente para `MEMORIA!X` sao substituidas por valores literais antes do download. Formulas compostas permanecem como formulas e devem ser avaliadas caso virem requisito documental.

## Problemas ja corrigidos

- Remocao da dependencia da aba `BASE` no arquivo individual.
- Substituicao do caminho legado baseado em `XLOOKUP`/`BASE`.
- Integracao real do `DocumentsPanel` com `useUnidadeDetalhe`, `generateDemonstrativoBasico` e download via `saveAs`.
- Correcao de cache da aba `Demonstrativo`: campos criticos passam a refletir a `MEMORIA` preenchida da unidade atual.
- Remocao de resultados cacheados de formulas no workbook gerado, preservando formulas compostas sem carregar resultados antigos do template.

## Riscos ainda existentes

- Novos templates Excel podem reintroduzir formulas, resultados cacheados ou abas legadas.
- Formulas compostas nao devem ser materializadas automaticamente sem analise do contrato documental.
- Visualizadores como Google Sheets podem recalcular ou exibir workbooks de forma diferente do Excel desktop.
- Campos oficiais dependem de revisao humana quando a regra documental mudar.

## Regras minimas para novo template

- Nao conter aba `BASE` com dados reais consolidados.
- Nao depender de `XLOOKUP`.
- Nao conter referencias `BASE!` ou `BASE[`.
- Ter celulas criticas mapeadas em teste.
- Passar pelo script de auditoria do template.
- Ter teste com duas unidades diferentes para evitar cache e vazamento de dados.

## Como rodar auditoria

```bash
node scripts/audit-demonstrativo-template.mjs
```

Para auditar um arquivo gerado localmente:

```bash
node scripts/audit-generated-demonstrativo.mjs caminho/arquivo.xlsx
```

## Criterio de aceite para novo documento Excel

Qualquer novo documento Excel oficial deve:

- ter template publico sem dados reais consolidados;
- listar formulas e referencias criticas por script;
- falhar se houver `BASE`, `BASE!`, `BASE[` ou `XLOOKUP`;
- ter teste automatizado com duas unidades diferentes;
- provar que campos visiveis criticos sao valores da unidade correta;
- manter formulas compostas sem materializacao automatica ate haver analise documental.
