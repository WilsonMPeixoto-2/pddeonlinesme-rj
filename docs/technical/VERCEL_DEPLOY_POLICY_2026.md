# Política de deploy Vercel — PDDE Online 2026

Status: proposta operacional ativa nesta branch até merge em `main`.

## Objetivo

Reduzir consumo desnecessário da cota de deployments/builds da Vercel sem reduzir a qualidade da validação no GitHub CI.

O projeto não deve gerar um deployment Vercel a cada commit intermediário, correção documental, execução do Dependabot ou ajuste incremental de uma branch de trabalho.

## Regra de deploy

A integração Git da Vercel fica limitada a dois tipos de branch:

- `main`: um deployment de produção quando uma entrega concluída é incorporada à branch principal;
- `preview-ready-*`: um deployment de Preview criado deliberadamente a partir de um SHA já consolidado e validado.

Todas as demais branches ficam sem deployment automático, inclusive `fix/*`, `feat/*`, `chore/*`, `dependabot/*`, branches de documentação e branches experimentais.

A regra está versionada em `vercel.json`:

```json
"git": {
  "deploymentEnabled": {
    "main": true,
    "preview-ready-*": true,
    "*": false
  }
}
```

A Vercel aplica regras de branch por glob/minimatch. Quando mais de uma regra coincide, basta uma regra `true` para autorizar o deployment. Assim `main` e `preview-ready-*` continuam habilitadas e o catch-all `*` bloqueia o restante.

## Fluxo de trabalho

1. Desenvolvimento ocorre em branch comum (`fix/*`, `feat/*`, `chore/*`, etc.).
2. Cada commit pode executar GitHub CI, mas não gera Preview Vercel.
3. Quando a entrega estiver estável e a CI estiver verde, um Preview só é criado quando houver valor real em inspeção humana.
4. Para isso, criar uma branch imutável `preview-ready-<assunto>` apontando para o SHA validado.
5. Essa branch gera exatamente um Preview enquanto não receber novos commits.
6. Se o Preview exigir correções, continuar trabalhando na branch original. Depois da nova validação, criar outro snapshot `preview-ready-<assunto>-r2` em vez de usar a Preview como branch de desenvolvimento.
7. Produção é gerada somente quando a entrega aprovada é incorporada a `main`.

## Regra de economia

Não criar Preview para:

- commits documentais;
- atualização de continuidade/handoff;
- tentativas intermediárias de TDD;
- commits RED esperados;
- alterações internas sem impacto visual/runtime;
- atualização automática de dependência ainda não aprovada;
- cada pequeno commit de uma mesma entrega.

O GitHub CI continua sendo o gate técnico principal. Vercel Preview passa a ser um artefato deliberado de validação visual/funcional, não um efeito colateral de qualquer push.

## Contexto enviado ao build

`.vercelignore` exclui conteúdo que não participa do build Vite nem do runtime publicado, como documentação, migrations Supabase, testes E2E, cobertura e arquivos de continuidade. Isso reduz o contexto transferido e processado pela Vercel sem remover código necessário da aplicação.

## Projeto Vercel duplicado

Há dois projetos Vercel ligados ao mesmo repositório (`pddeonlinesme-rj` e `pddeonlinesme-rj-pr8-validate`). A política versionada reduz os gatilhos automáticos para ambos, mas o projeto `pddeonlinesme-rj-pr8-validate` deve ser tratado como legado e desconectado do Git caso não exista mais uma função específica de validação. Enquanto permanecer conectado, um branch autorizado pode gerar builds nos dois projetos.

## Critério de sucesso

A política é considerada efetiva quando:

- commits em branches comuns não criam deployments Vercel;
- `preview-ready-*` cria Preview sob demanda;
- merge em `main` cria o deployment de produção;
- GitHub CI continua validando cada PR independentemente da existência de Preview;
- o número mensal/diário de deployments passa a refletir entregas e previews deliberados, não o número de commits.
