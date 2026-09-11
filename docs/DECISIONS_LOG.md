# Histórico de decisões arquiteturais — PDDE Online 2026

> **Documento histórico. Não é fonte canônica das decisões vigentes.**
>
> Para decisões atuais, consulte [`DECISIONS.md`](./DECISIONS.md). Para a hierarquia documental completa, consulte [`README.md`](./README.md).

Este arquivo preserva decisões antigas que ajudam a explicar a evolução do projeto. Elas podem ter sido refinadas ou absorvidas por decisões posteriores.

## Abril/2026 — TypeScript Strict como requisito permanente

**Contexto:** preparação do motor documental e de fluxos financeiros com alto risco de bugs silenciosos.

**Decisão histórica:** exigir TypeScript Strict Mode antes da importação real da BASE e da expansão do motor documental.

**Legado vigente:** a exigência de tipagem estrita continua refletida no projeto e no gate de CI; detalhes operacionais atuais devem ser lidos em `AGENTS.md`, `package.json` e no próprio CI.

## Abril/2026 — Separação de experiência GAD vs Diretor

**Contexto:** a GAD trabalha com o universo da CRE, enquanto o Diretor deve enxergar apenas a sua unidade.

**Decisão histórica:** o Portal do Diretor será uma experiência separada e restrita ao escopo da unidade autenticada.

**Legado vigente:** qualquer evolução dessa frente continua condicionada a Auth/RLS/roles e à decisão atual registrada em `DECISIONS.md`.

## Regra de uso

- não adicionar novas decisões vigentes aqui;
- não usar este arquivo para determinar prioridade atual;
- novas decisões entram em `docs/DECISIONS.md`;
- o histórico detalhado também permanece recuperável pelo Git.
