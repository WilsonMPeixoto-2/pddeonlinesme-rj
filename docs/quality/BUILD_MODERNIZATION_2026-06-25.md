# Modernização do build — Oxc e Rolldown

**Data:** 25/06/2026  
**PR:** #94  
**Merge:** `93ed0419c8b861e83eb9c564d726c86ec550cfa3`

## Objetivo

Modernizar o pipeline de build sem alterar funcionalidades, dados, migrations, regras financeiras, políticas de acesso, templates ou interface.

## Alterações implementadas

- removido `@vitejs/plugin-react-swc`;
- adotado `@vitejs/plugin-react` 6;
- Vite e Vitest alinhados ao mesmo plugin;
- React Compiler mantido desabilitado;
- `build.rollupOptions.output.manualChunks` substituído por `build.rolldownOptions.output.codeSplitting.groups`;
- preservados grupos para Recharts, Framer Motion e dependências gerais;
- `react-is` e `@testing-library/dom` declarados explicitamente;
- `package-lock.json` regenerado e versionado.

## Compatibilidade com Workbox

Na instalação limpa, o npm tentou resolver o peer opcional `@rolldown/plugin-babel` em versão que admitia Babel 8. O Workbox usa Babel 7, o que produziu conflito de resolução.

O PDDE Online não usa React Compiler nem carrega o plugin Babel no build. Para tornar a árvore reproduzível sem relaxar o npm, foi aplicado override restrito:

```json
{
  "overrides": {
    "@rolldown/plugin-babel": "0.1.7"
  }
}
```

A versão `0.1.7` oferece compatibilidade com Babel 7. O override atua somente na resolução do peer opcional.

Não foram usados:

- `--force`;
- `--legacy-peer-deps`;
- omissão global de peers.

## Validação

O commit final passou por:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
```

O GitHub CI concluiu com sucesso. Um Preview independente da Vercel também concluiu em estado `READY` para o head final do PR.

## Resultado observado

- instalação reproduzível;
- redução líquida de pacotes após remoção do plugin SWC;
- preservação da geração PWA;
- redução do chunk genérico principal em relação ao build anterior;
- nenhuma alteração funcional na aplicação.

A advertência de chunk grande continua como oportunidade futura de otimização, mas não representa regressão introduzida por este PR.

## Produção

O merge está na `main`, porém a produção principal não foi confirmada no mesmo SHA durante esta rodada porque a Vercel bloqueou novas execuções por limite temporário de frequência de builds.

Produção confirmada permanece em `1399a691d622715a787ea1d9b720ff9992d9f679` até nova verificação.

## Decisão técnica posterior

A avaliação foi executada na branch `types-node-26-evaluation`. O projeto foi alinhado ao runtime Node 24.x com `@types/node` `^24.13.2`, `engines.node` `24.x` e GitHub Actions em Node 24.

Referência: `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.
