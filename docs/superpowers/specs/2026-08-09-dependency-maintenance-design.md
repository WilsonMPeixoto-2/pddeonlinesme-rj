# Manutenção de Dependências — Design

**Projeto:** PDDE Online 2026  
**Repositório exclusivo:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Baseline:** `main` em `16b2409d7186dca5c4e148b107e6804ac1276787`  
**Data:** 09/08/2026

## Objetivo

Atualizar a base técnica do PDDE Online 2026 com risco controlado, preservando estabilidade funcional, segurança, rastreabilidade e compatibilidade com o runtime Node 24.x.

## Guardas de identidade do projeto

- Toda leitura e escrita deve usar exclusivamente `WilsonMPeixoto-2/pddeonlinesme-rj`.
- Não reutilizar arquivos, branches, versões, decisões ou resultados de `RADARPDDE`, `pdde-gad-cre-04`, `pdde-dashboard` ou qualquer outro repositório.
- Antes de cada frente, confirmar repositório, branch-base e SHA.
- Código, lockfile, CI e testes do repositório prevalecem sobre documentação histórica.

## Estratégia aprovada

### Frente A — patches/minors seguros

Atualizar somente versões alcançáveis pelos ranges SemVer já declarados, com `npm update` e `npm audit fix` sem `--force`. Preservar `package.json` quando não houver necessidade de alterar ranges. Validar instalação reproduzível e todos os gates do CI.

### Frente B — núcleo sensível

Tratar em PR independente atualizações de Supabase e qualquer mudança que afete autenticação, Vite, PWA, React Router, runtime ou contratos de build. Não misturar com mudanças funcionais, migrations, RLS ou regras de negócio.

### Frente C — Playwright

Adicionar `@playwright/test` em PR independente e criar smoke tests de navegador para prevenir regressões de tela vazia/renderização, redirecionamentos e rotas críticas. A motivação é o incidente real do PR #98, revertido pelo PR #99.

## Restrições permanentes nesta rodada

- Node permanece `24.x`.
- `@types/node` permanece na série 24.x salvo decisão explícita de runtime.
- ExcelJS permanece em `4.4.0` enquanto não houver substituição ou correção segura comprovada.
- Preservar override `@rolldown/plugin-babel: 0.1.7` até instalação limpa comprovar que ele pode ser removido.
- Proibido `npm audit fix --force` e `--legacy-peer-deps`.
- Não alterar Supabase remoto, migrations, Auth/RLS, dados, templates financeiros ou regras documentais nesta frente.
- Não retomar route-level code splitting nesta manutenção.

## Critérios de aceite

Cada PR deve concluir com, conforme aplicável:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

Mudanças de navegador exigem Preview/smoke antes de merge. Mudanças de dependência devem manter `package.json` e `package-lock.json` sincronizados.

## Valor institucional e operacional

A manutenção deve reduzir risco de falha, preservar segurança da cadeia de dependências e aumentar a capacidade de detectar regressões antes de Production, sem gerar novas dependências sem benefício concreto.