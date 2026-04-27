# Histórico de Decisões Arquiteturais e Estratégicas (ADR) — PDDE Online 2026

## Decisão — TypeScript Strict como requisito permanente
**Data:** Abril de 2026
**Contexto:** Preparação para criação do motor documental que lidará com planilhas de prestação de contas, valores monetários e regras rigorosas. Tipagem frouxa apresenta risco alto de bugs silenciosos.
**Decisão:** O projeto passa a exigir TypeScript Strict Mode como requisito permanente antes da importação real da BASE e antes do motor documental. Qualquer agente que introduzir código incompatível com `strict`, `noImplicitAny` ou `strictNullChecks` deverá corrigir a alteração antes de prosseguir.
**Consequências:** Aumenta a rigidez na criação de componentes, mas blinda o repositório contra nulos não checados e acesso a propriedades indefinidas.

## Decisão — Separação de Experiência GAD vs Diretor
**Data:** Abril de 2026
**Contexto:** A GAD lida com 160+ escolas, enquanto o Diretor lida apenas com a sua unidade.
**Decisão:** O Portal do Diretor será uma interface completamente separada e isolada, contendo apenas o que diz respeito à unidade logada.
**Consequências:** O design atual concentra-se na GAD. O Portal do Diretor necessitará de rotas específicas blindadas por Auth/RLS.
