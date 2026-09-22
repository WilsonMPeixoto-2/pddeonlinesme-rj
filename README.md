# PDDE Online 2026 · 4ª CRE / SME-RJ

> Serviço digital administrativo para apoio à gestão, análise, execução e governança do Programa Dinheiro Direto na Escola (PDDE) na 4ª Coordenadoria Regional de Educação da SME-RJ.

[![CI](https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/actions/workflows/ci.yml/badge.svg)](https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Production-Vercel-black?logo=vercel)](https://pddeonlinesme-rj.vercel.app)

## Documentação: comece aqui

Antes de alterar o projeto, leia [`docs/README.md`](./docs/README.md). Ele define:

- ordem de precedência entre código, decisões, handoff e histórico;
- roteiro obrigatório de leitura;
- quais documentos são canônicos, operacionais, técnicos ou históricos;
- documentação técnica exigida por domínio.

A fonte de verdade final para estado funcional continua sendo o sistema real: `main`, schema/migrations, banco, CI e deployment.

## Visão do produto

O PDDE Online não é apenas um dashboard. O produto organiza o trabalho da GAD em uma sequência operacional:

**Dados → análise → escola → ação → evidência**

O sistema busca reduzir planilhas paralelas, retrabalho, memorização de contexto e exposição de informação incompleta como se fosse definitiva.

### Frentes consolidadas

- **Painel Executivo-Operacional** com recortes de dados publicados e caminho para detalhe;
- **Localizador de escolas** com busca, filtros e preservação de contexto ao entrar e voltar da ficha;
- **Busca global operacional** por áreas reais do sistema e pelas unidades escolares;
- **Ficha da unidade** com dados cadastrais, documentos e acesso a Recursos PDDE;
- **Repasses 2026** com recorte confiável da 1ª parcela paga do PDDE Básico e navegação para o detalhe da escola;
- **Recursos PDDE** organizados por programa, ação, parcela e conta;
- **Pipeline financeiro versionado** entre `pdde-repasse-conciliador` e Supabase, com maturidade por dimensão, publicação transacional, idempotência e proteção contra regressão;
- **Demonstrativo Básico individual e em lote** a partir de template oficial sanitizado;
- **Atualização cadastral assistida** com validação, diff e escrita transacional;
- **Histórico e trilha de auditoria** para operações críticas já instrumentadas;
- **Frente fiscal isolada** em Python, com preferência por fontes estruturadas antes de OCR.

## Estado financeiro V1

O contrato financeiro operacional validado em setembro/2026 trabalha com:

- 163 escolas;
- 335 contas bancárias;
- 537 registros de repasse/parcela;
- seis dimensões financeiras contratadas, incluindo pagamento informado do 2º ciclo;
- snapshot corrente de 2026 com **163/163 unidades no 2º ciclo** e **R$ 765.215,00** informados pelo FNDE.

Princípios obrigatórios:

- ausência de informação não vira zero;
- uma escola pode possuir múltiplas contas no mesmo programa;
- a hierarquia financeira é `programa → ação → parcela → conta`;
- dados parciais não são promovidos como universo completo;
- o snapshot validado do motor é a referência corrente de monitoramento; Supabase permanece como persistência relacional, histórica e auditável;
- falha ou atraso de persistência nunca é convertido em zero: a interface exibe o snapshot corrente e sinaliza a defasagem;
- consultas financeiras revalidam periodicamente para que fatos novos não permaneçam ocultos em cache ou apenas no banco;
- metadados técnicos detalhados permanecem na auditoria; a interface expõe apenas o frescor necessário à confiança operacional.

Documentação técnica:

- [`docs/technical/integracao-financeira-pdde-2026-v1.md`](./docs/technical/integracao-financeira-pdde-2026-v1.md)
- [`docs/technical/financial-publication-contract-v1.md`](./docs/technical/financial-publication-contract-v1.md)
- [`docs/technical/repasses-operacionais-2026-v1.md`](./docs/technical/repasses-operacionais-2026-v1.md)

## Sincronização financeira

Existe o workflow `.github/workflows/sync-financial-snapshot.yml` para validar e publicar snapshots maduros do `pdde-repasse-conciliador`.

O motor executa a coleta integral diariamente às **07:05 (America/Sao_Paulo)**. O PDDE Online recebe o evento de publicação e mantém fallback diário às **10:30**.

A sincronização automática é elegível por padrão, salvo kill-switch explícito `PDDE_FINANCIAL_SYNC_ENABLED=false`, e continua exigindo `PDDE_SUPABASE_SERVICE_ROLE_KEY` no environment `production`.

A publicação só é considerada concluída quando o workflow executa **read-after-write** e comprova que a proveniência, a cobertura, os valores e as datas da mesma view consumida pelo frontend coincidem com o snapshot validado. Atraso de persistência superior a **15 minutos** é tratado como incidente visível de frescor, não como ausência de dados.

## Stack atual

As versões abaixo refletem `package.json` em 11/09/2026. O próprio `package.json` é a referência para versões futuras.

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24.x |
| Frontend | React 19.2.8 + React DOM 19.2.8 |
| Build | Vite 8.2.2 |
| Linguagem | TypeScript 6.0.3 |
| Estilos | Tailwind CSS 4.3.3 + shadcn/ui + Radix UI |
| Rotas | React Router DOM 7.18.2 |
| Dados/cache | TanStack React Query 5.102.8 |
| Tabelas | TanStack React Table 9.2.4 |
| Banco/backend | Supabase / PostgreSQL + RLS + RPCs |
| Validação | Zod 4.4.3 |
| Documentos | ExcelJS 4.4 + JSZip + file-saver |
| Testes | Vitest 5 + jsdom 30 + Playwright 1.63 |
| CI/CD | GitHub Actions + Vercel |

## Estrutura principal

```text
.github/workflows/        CI e sincronização financeira
.continuity/              snapshot estruturado de continuidade
docs/                     governança, decisões, handoff e contratos técnicos
public/templates/         templates documentais oficiais sanitizados
scripts/                  importação, auditoria e sincronização
src/
  components/             componentes de interface
  hooks/                  hooks de dados e fluxo
  integrations/           Supabase client e tipos
  lib/                    regras de domínio e motores
  pages/                  páginas roteadas
  schemas/                validações de domínio
supabase/
  migrations/             histórico versionado do schema
  tests/                  testes de contrato do banco
tools/fiscal-extraction/  módulo Python isolado da frente fiscal
```

## Desenvolvimento local

### Pré-requisitos

- Node.js 24.x;
- npm compatível com o lockfile;
- Docker para Supabase local;
- Python 3.10+ somente para `tools/fiscal-extraction/`.

### Aplicação

```bash
npm ci
npm run dev
```

Variáveis públicas esperadas no ambiente frontend:

```bash
VITE_SUPABASE_URL=https://raluxyojqosfzrfozmpz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<chave_publica>
```

Nunca versionar secrets ou `service_role`.

### Validações locais

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run audit:demonstrativo:template
npm run build
npm run check:bundle
npm run test:e2e
npm run check:deps:prod
npm audit --omit=dev --audit-level=high
```

### Supabase local

```bash
npm run supa:start
npm run supa:reset
npx supabase test db
```

Para operações remotas, confirme explicitamente o projeto antes de qualquer mutação:

```text
raluxyojqosfzrfozmpz
```

## Gate de CI

`.github/workflows/ci.yml` executa dois jobs principais em PRs para `main`:

1. **Typecheck, Lint, Test, Build & E2E**
   - instalação limpa;
   - typecheck e lint;
   - unitários e cobertura;
   - auditoria do template;
   - build e bundle budget;
   - E2E e acessibilidade;
   - Knip de produção;
   - auditoria de vulnerabilidades.

2. **Supabase financial publication contract**
   - sobe Supabase local;
   - reconstrói todo o banco pelas migrations;
   - executa os testes de contrato SQL;
   - encerra a stack local.

O CI usa `concurrency` com cancelamento de execuções obsoletas para evitar consumo inútil de runners.

## Regras de manutenção

- Não misturar este repositório com RADAR PDDE, POPs ou outros projetos.
- Não reabrir decisões vigentes sem registrar a mudança em [`docs/DECISIONS.md`](./docs/DECISIONS.md).
- Não transformar `NULL` financeiro em zero.
- Não expor workflow IDs, hashes, parser ou outros metadados técnicos na interface operacional comum.
- Não publicar dimensão financeira imatura.
- Não usar `service_role` no browser.
- Não aplicar migration histórica manualmente em Production sem verificar o histórico real do Supabase.
- Toda métrica relevante deve, quando possível, levar a detalhe, filtro ou ação.
- Botões, atalhos e estados fictícios não devem ser apresentados como funcionalidades.

## Produção

- Aplicação: https://pddeonlinesme-rj.vercel.app
- Supabase oficial: `raluxyojqosfzrfozmpz`

Nunca assumir que `main` e Production estão sincronizadas apenas pelo histórico documental. Verifique o SHA/deployment quando isso for relevante à decisão.

## Licença

Uso interno restrito — 4ª Coordenadoria Regional de Educação / Secretaria Municipal de Educação do Rio de Janeiro.
