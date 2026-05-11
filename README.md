# PDDE Online — 4ª CRE / SME-RJ

Sistema interno de apoio à prestação de contas do **Programa Dinheiro Direto na Escola (PDDE)** para a 4ª Coordenadoria Regional de Educação da Secretaria Municipal de Educação do Rio de Janeiro.

**Produção:** https://pddeonlinesme-rj.vercel.app

---

## Visão geral

O PDDE Online centraliza o acompanhamento financeiro e a geração de documentos oficiais das unidades escolares da 4ª CRE. O sistema permite:

### Implementado e em produção

- **Localizador de escolas** — listagem e busca de unidades escolares com dados cadastrais e financeiros.
- **Ficha da unidade** — visualização individual read-only com identificação, dados bancários e execução financeira importada.
- **Geração de Demonstrativo Básico** — produção do arquivo `.xlsx` oficial (Demonstrativo Básico Individual) a partir dos dados do Supabase, preenchendo a aba `MEMÓRIA` diretamente.
- **Dashboard** — visão consolidada com indicadores financeiros das unidades.
- **Importação de dados** — carga da planilha BASE.xlsx com normalização e validação.

### Em planejamento

- **Portal do Diretor** — acesso segregado para diretores de unidades escolares.
- **Edição cadastral/bancária** — modo de edição na ficha da unidade.
- **Geração em lote** — motor documental para gerar demonstrativos de múltiplas unidades.

### Pendente

- **Auth/roles/RLS definitivo** — refinamento de papéis e políticas de acesso.
- **Importador institucional via interface** — upload e validação visual.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Animações | Framer Motion |
| Estado servidor | TanStack React Query |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Geração documental | ExcelJS (dynamic import) |
| Testes | Vitest + Testing Library |
| Deploy | Vercel |
| Observabilidade | Vercel Web Analytics |

## Estrutura do projeto

```
├── public/templates/        # Templates documentais (.xlsx)
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── escola/          # Componentes específicos da unidade escolar
│   │   └── ui/              # shadcn/ui + componentes base
│   ├── hooks/               # Custom hooks (React Query, auth, etc.)
│   ├── integrations/        # Supabase client + types gerados
│   ├── lib/
│   │   ├── demonstrativo/   # Gerador do Demonstrativo Básico Individual
│   │   └── baseImporter.ts  # Parser/importador da BASE.xlsx
│   ├── pages/               # Páginas/rotas da aplicação
│   └── providers/           # Context providers (exercício, tema, etc.)
├── supabase/
│   ├── config.toml          # Configuração do projeto Supabase
│   └── migrations/          # Migrações SQL versionadas
├── docs/                    # Documentação operacional e decisões
└── .continuity/             # Estado de continuidade para agentes
```

## Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9
- Supabase CLI (opcional, para desenvolvimento local com banco)

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm test

# Type-check sem emitir
npx tsc --noEmit

# Lint
npm run lint

# Build de produção
npm run build
```

### Supabase local (opcional)

```bash
# Iniciar instância local
npm run supa:start

# Resetar banco local
npm run supa:reset

# Gerar tipos TypeScript
npm run supa:types

# Linkar ao projeto remoto
npm run supa:link -- raluxyojqosfzrfozmpz
```

## Variáveis de ambiente

O projeto utiliza variáveis de ambiente para conexão com o Supabase. Crie um arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://raluxyojqosfzrfozmpz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua_publishable_key>
```

> **Nota:** o arquivo `.env` não é versionado. Consulte o painel do Supabase para obter as credenciais. Nunca exponha a `service_role` key no frontend.

## Segurança

- **Não versionar `.env`** — credenciais ficam apenas no painel Vercel e Supabase.
- **Produção Supabase somente leitura** — alterações em produção exigem autorização explícita.
- **Dados reais e documentos oficiais** — exigem validação humana antes de qualquer alteração em templates, regras financeiras ou cálculos.
- **Auth, RLS, roles e policies** — qualquer mudança requer revisão humana obrigatória.

## Governança

- **Código-fonte é fonte de verdade** — documentos em `docs/` e `.continuity/` são snapshots auxiliares, não fonte primária.
- **PRs pequenos e escopo fechado** — cada alteração funcional deve ser um PR próprio com arquivos permitidos e proibidos definidos.
- **Classificação obrigatória** — agentes devem classificar afirmações como FATO VERIFICADO NO CÓDIGO, HIPÓTESE, RELATO DE OUTRA FERRAMENTA ou PENDÊNCIA A CONFIRMAR.

## Deploy

- **Produção:** Vercel, deploy automático a partir de `main` → https://pddeonlinesme-rj.vercel.app
- **Preview:** cada PR recebe um deploy de preview automático pela Vercel.
- **Vercel Authentication:** previews podem exigir autenticação Vercel para acesso.

## Geração documental

O Demonstrativo Básico Individual é gerado via ExcelJS a partir do template em `public/templates/`. O gerador:

1. Carrega o template `.xlsx` preservando layout, fórmulas, bordas e mesclagens.
2. Preenche a aba `MEMÓRIA` com dados da view `vw_unidade_detalhe` do Supabase.
3. Remove defensivamente a aba `BASE` se presente.
4. Entrega o arquivo para download via `file-saver`.

**Restrições do gerador:**
- Não depende da aba `BASE` nem de `XLOOKUP`.
- Não publica templates com dados reais consolidados.
- Regras financeiras e documentais oficiais requerem revisão humana.

## Documentação operacional

| Documento | Propósito |
|---|---|
| `docs/HANDOFF.md` | Estado atual do projeto para continuidade entre sessões |
| `docs/DECISIONS.md` | Decisões operacionais vigentes |
| `docs/ROADMAP_ADAPTIVE.md` | Fila curta e marcos funcionais |
| `docs/OPPORTUNITIES_BACKLOG.md` | Radar de oportunidades e próximas frentes |
| `docs/UI_CHANGELOG.md` | Registro de entregas visuais |
| `AGENTS.md` | Divisão de responsabilidades entre ferramentas |

## Contribuição

Este é um sistema interno mantido pela 4ª CRE. Para contribuir:

1. Crie uma branch a partir de `main`.
2. Mantenha o escopo do PR restrito e bem definido.
3. Execute `npx tsc --noEmit && npm run lint && npm test && npm run build` antes de abrir o PR.
4. Atualize `docs/HANDOFF.md` e `.continuity/current-state.json` ao final de tarefas relevantes.

## Estado atual

PR #43 (Demonstrativo Básico Individual) concluído e em produção. A fila inicial de higiene técnica (CI, lockfile, dependências, testes base e governança) foi finalizada nos PRs #46 a #51.

Consulte `docs/HANDOFF.md` e `docs/ROADMAP_ADAPTIVE.md` para os próximos marcos funcionais.

## Licença

Uso interno — Secretaria Municipal de Educação do Rio de Janeiro.
