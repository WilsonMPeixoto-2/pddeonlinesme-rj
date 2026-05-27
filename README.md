# PDDE Online — 4ª CRE / SME-RJ 🏛️

> **Portal de Inteligência Tecnológica e Governança Documental do Programa Dinheiro Direto na Escola (PDDE)** para a 4ª Coordenadoria Regional de Educação da Secretaria Municipal de Educação do Rio de Janeiro (SME-RJ).

[![CI Status](https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/actions/workflows/ci.yml/badge.svg)](https://github.com/WilsonMPeixoto-2/pddeonlinesme-rj/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://pddeonlinesme-rj.vercel.app)
[![React Version](https://img.shields.io/badge/react-19.2-blue?logo=react)](https://react.dev)
[![Vite Version](https://img.shields.io/badge/vite-7.3-646CFF?logo=vite)](https://vite.dev)

---

## 🌟 Visão Geral e Arquitetura

O **PDDE Online** centraliza a gestão de saldos, execução financeira e conformidade de prestação de contas das unidades escolares sob jurisdição da 4ª CRE. O sistema opera como uma **Central de Governança de Alto Padrão**, projetada com foco em eliminação de erros, automação e experiência do usuário instantânea.

### 🚀 Funcionalidades de Classe Mundial Implementadas

1. **Localizador de Escolas Inteligente:** Painel dinâmico com busca multicritério e prefetching dinâmico.
2. **Ficha da Unidade com Edição Reativa:** Visualização individual, dados de contato e conta principal com **Optimistic Updates** para salvar alterações sem atraso.
3. **Geração Documental em Memória (ExcelJS):** Gerador inteligente do **Demonstrativo Básico Individual** que manipula e injeta dados na aba `MEMÓRIA` do template oficial, removendo metadados brutos e fórmulas inválidas (`BASE!`, `XLOOKUP`).
4. **Dashboard Executivo-Operacional:** Indicadores em tempo real baseados em views calculadas no banco de dados.
5. **Geração em Lote dos 163 Demonstrativos:** Sistema em background com progresso visível que consolida e empacota demonstrativos de todas as unidades da CRE em um único clique.
6. **Atualização Assistida de Diretores (Bulk Update - Marco 10B v2):** Mecanismo robusto em 7 passos (Upload ➔ Validação ➔ Mapeamento Reativo ➔ Preview de Diff ➔ Confirmação ➔ Aplicação Transacional SQL ➔ Ações Recomendadas).
7. **Trilha de Auditoria & Segurança Transacional:** Alterações em lote executadas via **RPC (Security Definer) com SELECT FOR UPDATE** e logging automático em tabelas de auditoria.
8. **Apoio Fiscal Multicanal (Python):** Módulo de processamento e extração de Notas Fiscais eletrônicas em lote.

---

## 🛠️ Stack Técnica Avançada (Estado da Arte)

O ecossistema tecnológico do projeto foi totalmente modernizado para a stack de 2026, garantindo velocidade, tipagem estrita e resiliência:

| Camada | Tecnologia | Propósito e Diferencial |
| :--- | :--- | :--- |
| **Frontend Core** | **React 19.2** + **Vite 7.3** | Estado da arte em rendering, tempos de compilação ultra-rápidos e suporte a hooks reativos modernos. |
| **Styling (CSS)** | **Vanilla CSS** + **Tailwind CSS v3** | Design Tokens para consistência, layouts HSL responsivos, **Glassmorphism** e animações fluidas. |
| **UI Components** | **Radix UI** + **shadcn/ui** | Acessibilidade completa (WAI-ARIA) e componentes de interface semânticos e polidos. |
| **Micro-animações**| **Framer Motion 12** | Transições de painéis, feedbacks visuais elegantes e micro-interações fluidas. |
| **Gerenciamento Estágio**| **TanStack React Query v5** | Zero-latency caching, prefetching inteligente no hover de cursor e optimistic UI updates. |
| **Banco / Servidor** | **Supabase** | Banco PostgreSQL nativo com políticas Row Level Security (RLS) e RPCs para atomicidade transacional. |
| **Motor de Planilhas** | **ExcelJS 4.4** + **Papaparse 5.5** | Manipulação fiel de planilhas complexas com dynamic imports + parser de CSV robusto (UTF-8/Latin-1 auto-detect). |
| **Validação** | **Zod 4.4** | Governança estrita de dados de entrada na UI com validação matemática modular (CNPJ Mod 11, INEP 8-dígitos). |
| **Suíte de Testes** | **Vitest 4.1** + **jsdom 29.1** | Testes de unidade e renderização ultrarrápidos executando 120 testes de cobertura. |
| **CI/CD** | **GitHub Actions** + **Vercel** | Integração contínua (Lint, TSC, Test, Build) e deploy atomizado automático. |

---

## ⚡ Estratégias de Performance & Governança (Frente 1)

### 1. Zero-Latency Navigation (Query Prefetching)
Quando o usuário move o cursor do mouse (`onMouseEnter`) sobre uma linha de escola ou botão de ação, o sistema dispara silenciosamente o pré-carregamento (`prefetchQuery`) da view `vw_unidade_detalhe`. Nos ~200ms que o usuário leva para clicar, o dado já está no cache local. O carregamento de páginas e painéis laterais ocorre de forma **instantânea** (zero perceptível).

### 2. Otimização Crítica de Build (Code-Splitting)
Configuração Rollup refinada em `vite.config.ts` que isola componentes e bibliotecas pesadas de terceiros em arquivos físicos separados (`vendor-charts` para Recharts, `vendor-motion` para Framer Motion e `vendor` para exceljs). Isso reduziu o tamanho do bundle de inicialização (`index.js`) em **90%** (de 1.96 MB para **~188 kB**).

### 3. Validador Cadastral Estrito (Zod & Módulo 11)
Para garantir governança absoluta dos dados antes de qualquer persistência, a aplicação utiliza esquemas estritos do Zod com:
- Algoritmo aritmético de **Módulo 11** para conferência matemática de dígitos verificadores de CNPJ.
- Validação estrutural de código INEP (exatamente 8 caracteres numéricos).
- Whitelists estruturadas e sanitização de e-mails institucionais.

---

## 📂 Estrutura do Repositório

```
├── .github/workflows/       # Configurações de Integração Contínua (GitHub Actions)
├── .continuity/             # Estado persistente de governança para agentes de IA
├── docs/                    # Relatórios, decisões operacionais (ADRs) e roadmaps
│   ├── reports/             # Relatórios técnicos (Hardenings, POCs Fiscais)
│   └── technical/           # Contratos e protocolos de governança de dados
├── public/templates/        # Planilhas oficiais de template (.xlsx)
├── scripts/                 # Utilitários de migração, carga e auditoria
├── src/
│   ├── components/          # Componentes visuais organizados (UI, Cards, Listas)
│   ├── hooks/               # Custom hooks (Auth, React Query, GAD)
│   ├── integrations/        # Client Supabase e tipos auto-gerados
│   ├── lib/
│   │   ├── bulk-update/     # Motor reativo de atualização assistida em lote (CSV/XLSX)
│   │   └── demonstrativo/   # Gerador em lote e individual do Demonstrativo Básico
│   ├── pages/               # Páginas roteadas do sistema
│   ├── providers/           # Provedores de estado global (Tema, Exercício)
│   └── schemas/             # Validação estrita de domínio (Zod Cadastral)
├── supabase/
│   ├── config.toml          # Configuração remota do projeto (raluxyojqosfzrfozmpz)
│   └── migrations/          # Migrações SQL locais aplicadas em produção
└── tools/
    └── fiscal-extraction/   # Módulo Python independente para Aumento Fiscal
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js ≥ 20.x
- npm ≥ 10.x
- Python ≥ 3.10 (apenas se for utilizar a ferramenta fiscal)

### Passo 1: Instalação e Execução

```bash
# 1. Clonar o repositório e instalar dependências
npm install

# 2. Configurar as variáveis de ambiente
# Crie um arquivo .env.local na raiz contendo:
VITE_SUPABASE_URL=https://raluxyojqosfzrfozmpz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua_chave_publica_obtida_no_painel>

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

### Passo 2: Rodar Validações Locais

```bash
# Executar a suíte completa de 120 testes unitários
npm test

# Validação estrita do compilador TypeScript
npx tsc --noEmit

# Validação estrita de linting de estilo e boas práticas
npm run lint

# Testar empacotamento otimizado de produção
npm run build
```

---

## 🗄️ Integração com o Banco de Dados (Supabase CLI)

O banco de dados oficial está atrelado ao ID de projeto `raluxyojqosfzrfozmpz`. Para desenvolver localmente com migrações ou atualizar tipos:

```bash
# Iniciar a instância local do Supabase
npm run supa:start

# Linkar o repositório local ao projeto Supabase de produção
npm run supa:link -- raluxyojqosfzrfozmpz

# Gerar tipos TypeScript automaticamente a partir do schema remoto
npm run supa:types

# Aplicar novas migrações SQL criadas localmente no banco remoto
npm run supa:push
```

---

## 🐍 Ferramenta de Extração Fiscal Multicanal (Python CLI)

O sistema possui um utilitário avançado escrito em **Python 3** localizado em `tools/fiscal-extraction/` projetado para processar, validar e extrair dados financeiros de Notas Fiscais eletrônicas (NF-e) em lote.

### Configuração e Execução

```bash
# 1. Entrar no diretório do utilitário
cd tools/fiscal-extraction

# 2. Criar e ativar um ambiente virtual
python -m venv .venv
# No Windows:
.venv\Scripts\activate
# No macOS/Linux:
source .venv/bin/activate

# 3. Instalar as dependências necessárias
pip install -r requirements.txt
pip install -e .

# 4. Executar os testes automatizados do analisador fiscal
pytest
```

### Comandos de Utilização Comuns (CLI)

```bash
# Analisar e extrair informações completas de um arquivo XML da nota fiscal
fiscal-extract xml-parse caminho/para/nota_fiscal.xml

# Extrair texto legível e limpar informações cruciais de um PDF textual
fiscal-extract pdf-parse caminho/para/nota_fiscal.pdf

# Validar campos extraídos contra os esquemas aritméticos de compliance
fiscal-extract validate-fields --data-json caminho/para/dados_extraidos.json
```

---

## 🔒 Governança de Segurança e Desenvolvimento (Radar)

Este repositório aplica rigorosamente o **Radar de Inteligência Institucional (v4.2)**. Ao trabalhar no código:

1. **Veto à Redundância:** Sempre priorize o consumo de fontes estruturadas e views existentes no banco. Evite redigitação e cadastros paralelos.
2. **Atomicidade e Transações:** Mudanças de dados sensíveis cadastrais devem obrigatoriamente passar por RPCs estruturados com `SECURITY INVOKER` ou `SECURITY DEFINER` e salvaguarda de auditoria.
3. **Não Versionar Credenciais:** Nunca salve tokens, senhas ou arquivos `.env` no Git. Todos os segredos devem ser configurados nos painéis oficiais do Supabase e da Vercel.
4. **Isolamento de Alterações:** PRs de documentação, governança e higiene não devem se misturar com alterações de regras financeiras, RLS ou templates oficiais, garantindo rastreabilidade absoluta dos commits.

---

## ⚖️ Licença

Uso interno restrito — Coordenadoria Regional de Educação (4ª CRE) / Secretaria Municipal de Educação do Rio de Janeiro. Todos os direitos reservados.
