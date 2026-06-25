# Alinhamento dos tipos Node — 25/06/2026

## Objetivo

Encerrar a avaliação aberta na branch `types-node-26-evaluation` sem fazer atualização meramente numérica. A decisão técnica foi alinhar a tipagem Node ao runtime real informado para o projeto na Vercel: Node 24.x.

## Decisão

- `@types/node` foi ajustado de `^25.9.4` para `^24.13.2`.
- O `package-lock.json` foi regenerado com `@types/node` `24.13.2`.
- O transitivo `undici-types` acompanhou a série esperada para Node 24 (`7.18.2`).
- O CI passou de Node 20 para Node 24.
- O `package.json` passou a declarar `engines.node` como `24.x`.

## Justificativa

O projeto não tem decisão aprovada para runtime Node 26. Usar tipos 25 ou 26 em um runtime 24 poderia permitir, em desenvolvimento, referências a APIs que não representam o ambiente real de build/deploy. A série 24 é a escolha mais conservadora e rastreável até que exista decisão explícita de runtime.

## O que não foi alterado

- Funcionalidades, telas e layout.
- Supabase, auth, roles, RLS ou migrations.
- Regras financeiras.
- Templates oficiais.
- Override de `@rolldown/plugin-babel`.

## Validação executada

Executado na branch `types-node-26-evaluation`:

| Comando | Resultado |
|---|---|
| `npm ci` | passou |
| `npx tsc --noEmit` | passou |
| `npm run lint` | passou |
| `npm test` | passou — 12 arquivos, 130 testes |
| `npm run build` | passou |
| `npm audit` | retornou os 2 achados moderados residuais já documentados |
| `npm audit --omit=dev` | retornou os 2 achados moderados residuais já documentados |

As auditorias continuam indicando a cadeia `exceljs -> uuid`. A correção automática exige `npm audit fix --force` e downgrade do ExcelJS, portanto permanece rejeitada conforme `docs/quality/DEPENDENCY_UPDATE_2026-06-25.md`.
