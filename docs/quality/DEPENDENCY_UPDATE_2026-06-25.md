# Atualização segura de dependências — 25/06/2026

## Objetivo

Atualizar dependências patch/minor de forma reproduzível, reduzir vulnerabilidades corrigíveis sem quebra de compatibilidade e preservar o stack de build durante a primeira etapa.

## Pacotes atualizados

| Pacote | Versão declarada anterior | Versão declarada atual |
|---|---:|---:|
| `@tanstack/react-query` | `^5.101.0` | `^5.101.1` |
| `framer-motion` | `^12.40.0` | `^12.41.0` |
| `recharts` | `^3.8.1` | `^3.9.0` |
| `vite` | `^8.0.16` | `^8.1.0` |
| `typescript-eslint` | `^8.61.1` | `^8.62.0` |
| `autoprefixer` | `^10.5.0` | `^10.5.2` |
| `globals` | `^17.6.0` | `^17.7.0` |

O `package-lock.json` foi regenerado e versionado pelo GitHub Actions em ambiente limpo.

## Segurança

### Situação inicial

A auditoria reproduzível identificou:

- 1 vulnerabilidade low;
- 2 vulnerabilidades moderate;
- 2 vulnerabilidades high;
- total de 5 achados.

Os achados corrigíveis sem breaking change envolviam `@babel/core`, `tmp` e `undici`.

### Correções aplicadas

Foi executado `npm audit fix`, sem `--force`. O lockfile resultante foi versionado e validado novamente por instalação limpa.

### Situação posterior

A auditoria completa e a auditoria com `--omit=dev` passaram a registrar:

- 0 vulnerabilidades low;
- 2 vulnerabilidades moderate;
- 0 vulnerabilidades high;
- 0 vulnerabilidades critical;
- total de 2 achados.

Os dois registros residuais correspondem à mesma cadeia: dependência direta `exceljs` e dependência transitiva `uuid`.

## Aceitação controlada do risco residual

O `npm audit` propõe como correção automática o rebaixamento do `exceljs` para `3.4.0`, classificado como mudança major. Essa alternativa não foi aplicada porque:

1. representa regressão de versão;
2. pode causar incompatibilidade na geração e leitura das planilhas institucionais;
3. o vetor informado para `uuid` depende do uso de buffer fornecido às funções v3/v5/v6, cenário que não integra o uso atual do PDDE Online;
4. não existe correção automática segura indicada pelo gerenciador para a cadeia atual.

A medida adotada é manter `exceljs` em `4.4.0`, acompanhar a correção upstream e reavaliar a cadeia em futuras rodadas.

## Validação executada

Após as atualizações e correções de segurança, o ambiente limpo aprovou:

- `npm ci`;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm test`;
- `npm run build`;
- Preview e produção da Vercel para o commit do PR #92.

## Evolução posterior

A migração do plugin React e do code splitting, inicialmente fora do escopo deste PR, foi concluída separadamente no PR #94, commit `93ed0419c8b861e83eb9c564d726c86ec550cfa3`.

A decisão de dependência ainda aberta nesta rodada foi encerrada posteriormente na branch `types-node-26-evaluation`: `@types/node` foi alinhado à série 24, o CI passou para Node 24 e `engines.node` foi declarado como `24.x`.

Referência: `docs/quality/NODE_TYPES_ALIGNMENT_2026-06-25.md`.
