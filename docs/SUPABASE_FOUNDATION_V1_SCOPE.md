# PDDE Online 2026 — Supabase Foundation v1 — Escopo

Data: 2026-04-30

## 1. Finalidade

Este documento registra o escopo da etapa Supabase Foundation v1 do projeto PDDE Online 2026.

O objetivo é destravar o uso de dados reais a partir do Excel `DADOS..xlsx` e do layout aprovado, criando uma fundação Supabase mínima, fiel à realidade operacional das 163 unidades escolares, sem antecipar o sistema final e sem comprometer a produção atual.

A fonte oficial de continuidade desta etapa é a Issue #13 do repositório, complementada por este documento.

## 2. Relação com o Plano Global v4

O Plano Global v4 continua como norte estratégico, matriz ampla de tarefas e referência cronológica geral.

A Supabase Foundation v1 é uma adaptação tática dentro desse plano. Não substitui o Plano Global v4 e não inicia o PR4 lógico de cutover remoto. Existe para evitar que a equipe fique presa em loopings de perfeccionismo técnico ou refatorações destrutivas enquanto a base de dados real ainda não está disponível.

## 3. Decisão-mestra

Não devemos esperar o modelo final do sistema para criar o Supabase.

Devemos criar um Supabase básico, fiel ao Excel e ao layout aprovado, orientado ao usuário real, tecnicamente correto, evolutivo e flexível, permitindo que o sistema cresça sem se prender a refatorações destrutivas posteriores.

## 4. Estado confirmado antes desta etapa

- A PR #12 foi mesclada com squash para corrigir o desalinhamento visual da tabela de escolas.
- A `main` atual incorpora as recuperações das PRs #8, #9, #10 e #12.
- A produção deve permanecer preservada como vitrine funcional.
- O PR #7 / PR3B antigo permanece como referência técnica histórica e não é o caminho de merge desta etapa.
- A nova etapa parte da `main` atual após o merge da PR #12.

## 5. Escopo imediato

### 5.1. Conteúdo desta primeira tarefa

A primeira entrega da Supabase Foundation v1 é exclusivamente documental e contém:

- criação da branch `feature/supabase-foundation-v1` a partir da `main` atual;
- criação deste documento `docs/SUPABASE_FOUNDATION_V1_SCOPE.md`;
- commit com a mensagem `docs(supabase): define foundation v1 scope`.

Esta tarefa não altera código de aplicação, não cria migrations, não toca em frontend, não toca em Vercel e não toca em Supabase remoto.

### 5.2. Próximas tarefas previstas dentro da Foundation v1

As tarefas seguintes, a serem executadas em PRs distintos sobre a mesma branch ou sobre branches subsequentes, são:

1. Migrations mínimas locais para as tabelas previstas na seção 8.
2. Views mínimas locais previstas na seção 9.
3. Script de importação da aba `BASE` do arquivo `DADOS..xlsx`.
4. Normalização de campos identificadores como texto: `designacao`, `inep`, `cnpj`, `agencia`, `conta_corrente`.
5. Manutenção de valores financeiros como `numeric(14,2)`.
6. Regeneração local de types após validação do schema.
7. Adaptação do frontend em blocos mínimos: `Base`, `Dashboard`, `Escolas` e detalhe/edição da unidade escolar.

Cada um desses itens só avança após validação local e aprovação explícita do responsável.

## 6. Fora de escopo

A Supabase Foundation v1 não inclui, nesta etapa:

- início do PR4 lógico ou cutover remoto;
- `db push` remoto ou qualquer alteração no Supabase remoto;
- alteração de variáveis na Vercel;
- alteração da produção;
- motor documental;
- geração de DOCX ou PDF;
- upload de comprovantes;
- ativação do portal real do diretor;
- finalização do fluxo completo de prestação de contas.

Esses itens permanecem como módulos futuros, não como bloqueadores da Foundation v1.

## 7. Diretriz de produto: user oriented

O sistema deve ser orientado ao usuário real, e não à tabela completa do Excel.

Implicações operacionais:

- a tabela geral de escolas atua como localizador e não como planilha gigante;
- dados financeiros, conta bancária e detalhes operacionais aparecem na página individual da unidade escolar;
- o dashboard apresenta indicadores de leitura rápida derivados das tabelas reais;
- o layout aprovado pelo Lovable é referência visual e ponto de partida, não limite estrutural ou contratual.

## 8. Aproveitamento do Excel como fonte real

A aba `BASE` do arquivo `DADOS..xlsx` é a fonte real desta fase para as 163 unidades escolares.

Princípios de aproveitamento:

- preservar `designacao` e `nome` como campos separados;
- normalizar `cnpj` como texto, sem repetir o erro de acomodação numérica do Excel;
- preservar zeros à esquerda e letras em `agencia` e `conta_corrente`, inclusive o caractere `X`;
- preservar `inep` como texto;
- manter valores financeiros como `numeric(14,2)`, sem coerção para `float`.

O Excel é fonte de carga inicial. Não é contrato de schema permanente.

## 9. Aproveitamento do layout Lovable

O layout produzido no Lovable é referência visual aprovada para Dashboard, Escolas e detalhe da unidade.

Regras:

- o layout orienta a hierarquia visual e a experiência do usuário;
- o layout não dita a forma final do schema do banco;
- ajustes visuais necessários para refletir os dados reais têm prioridade sobre fidelidade pixel-perfect ao mock;
- divergências entre o mock Lovable e o dado real do Excel devem ser resolvidas a favor do dado real, com registro em `docs/UI_CHANGELOG.md` quando alterarem o layout aprovado.

## 10. Classificação funcional dos dados

Para evitar confusão entre realidade e protótipo, todo dado exibido na interface deve ser classificado como:

- **dado real importado** — proveniente diretamente da aba `BASE` do Excel;
- **dado real calculado** — derivado por agregação ou cálculo a partir de dados reais importados;
- **placeholder futuro** — campo previsto no schema, mas ainda sem dado de origem;
- **mock visual** — elemento puramente visual para fins de aprovação de layout, sem origem em dados reais;
- **funcionalidade desativada** — recurso do mock que não deve operar nesta etapa, mantido inerte na interface.

A documentação de cada bloco de UI adaptado deve declarar a qual classe pertencem os dados exibidos.

## 11. Tabelas mínimas previstas

As migrations futuras desta Foundation v1 devem contemplar, no mínimo:

- `unidades_escolares` — registro canônico das 163 unidades, com identificadores, dados cadastrais e bancários básicos;
- `execucao_financeira` — registros de execução financeira por unidade e por exercício;
- `contas_bancarias` — vínculo banco/agência/conta por unidade, preservando texto;
- `import_logs` — registro auditável de cada importação executada a partir do Excel.

Os nomes finais de colunas e as constraints serão definidos na tarefa de migrations e validados localmente antes de qualquer aplicação remota.

## 12. Views mínimas previstas

As views futuras desta Foundation v1 devem contemplar, no mínimo:

- `vw_unidades_localizador` — projeção mínima para a tela `Escolas` operar como localizador rápido;
- `vw_unidade_detalhe` — projeção consolidada para a página individual da unidade escolar;
- `vw_dashboard_basico` — projeção agregada para o `Dashboard`, com indicadores de leitura rápida.

As views funcionam como contrato estável entre o banco e o frontend, isolando o frontend de mudanças não-disruptivas em colunas físicas.

## 13. Critérios de aceite

### 13.1. Critérios desta primeira tarefa documental

- branch `feature/supabase-foundation-v1` criada a partir da `main` atual;
- arquivo `docs/SUPABASE_FOUNDATION_V1_SCOPE.md` criado e alinhado à Issue #13;
- nenhuma alteração em código de aplicação;
- nenhuma alteração em Supabase remoto;
- nenhuma alteração em Vercel;
- commit registrado como `docs(supabase): define foundation v1 scope`.

### 13.2. Critérios de aceite do primeiro PR de migrations da Foundation v1

- migrations básicas criadas e validadas localmente;
- importador lê a aba `BASE` e importa as 163 unidades;
- `designacao` e `nome` permanecem separados;
- `cnpj` é normalizado como texto, sem repetir o erro de acomodação do Excel;
- `conta_corrente` preserva zeros e letras, inclusive `X`;
- produção permanece intacta.

## 14. Comandos mínimos de validação

Para tarefas que alteram código:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Para tarefas que envolvem schema local:

```bash
supabase db reset --local
```

Para esta primeira tarefa documental, basta:

```bash
git status
git diff --stat
```

## 15. Ponto de parada antes de qualquer Supabase remoto

A Supabase Foundation v1 opera exclusivamente em ambiente local até segunda ordem.

São proibidas, sem aprovação explícita do responsável:

- execução de `supabase db push` contra projeto remoto;
- alteração de variáveis no painel da Vercel;
- alteração no projeto Supabase de produção;
- alteração de qualquer fluxo que afete a URL `https://pddeonlinesme-rj.vercel.app`.

Qualquer ferramenta — Codex, Claude Code, Antigravity, Lovable ou outra — que tente avançar para Supabase remoto a partir desta branch deve ser interrompida e o estado revisado manualmente.

## 16. Observação operacional

Se uma ferramenta tentar bloquear o avanço alegando ausência de `documentos_gerados`, motor documental ou workflow completo, esses pontos devem ser tratados como módulos futuros, não como bloqueadores da Supabase Foundation v1.

A Foundation v1 termina quando o frontend já consome dados reais das 163 unidades por meio das views previstas, sem que isso implique sistema final, motor documental ou cutover remoto.
