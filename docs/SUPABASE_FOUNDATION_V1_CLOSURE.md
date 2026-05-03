# PDDE Online 2026 — Encerramento da Supabase Foundation v1

Data: 2026-05-02

## 1. Finalidade

Este documento declara formalmente o encerramento da etapa **Supabase Foundation v1** do projeto PDDE Online 2026.

A finalidade é separar, com precisão operacional, o que foi concluído como **migração fundacional para o Supabase próprio** daquilo que permanece como evolução funcional do produto dentro do Plano Global v4.

## 2. Veredito executivo

**A migração fundacional para o Supabase próprio está concluída.**

Isso significa que o projeto deixou de depender operacionalmente do backend provisório do Lovable nas telas principais de unidades escolares e passou a utilizar o Supabase próprio como fonte real de dados para:

- localizador de unidades escolares (`/escolas`);
- página individual da unidade (`/escolas/:id`);
- views fundacionais criadas para localizador, detalhe e dashboard básico;
- dados reais importados da planilha BASE.

Esta conclusão não significa que o sistema final esteja completo. Dashboard analítico final, edição cadastral/bancária, importador institucional via interface, motor documental, geração individual real, portal do diretor e hardening completo retornam aos marcos próprios do Plano Global v4.

## 3. Critério documental de encerramento

O documento `docs/SUPABASE_FOUNDATION_V1_SCOPE.md` definiu que a Foundation v1 terminaria quando o frontend já consumisse dados reais das 163 unidades por meio das views previstas, sem que isso implicasse sistema final, motor documental ou cutover completo.

Esse critério foi atingido.

## 4. Entregas incorporadas à main

| PR | Entrega | Estado |
|---:|---|---|
| #27 | Script administrativo de importação remota da BASE para Supabase próprio | Merged |
| #29 | `/escolas` consumindo `vw_unidades_localizador` via React Query | Merged |
| #30 | `/escolas/:id` consumindo `vw_unidade_detalhe` via React Query, read-only | Merged |
| #31 | Dependências essenciais e scaffold inicial de Zod para Fase 2B | Merged |
| #33 | Light Mode institucional premium com ThemeToggle | Merged |
| #32 | Premium UI Kit e `MaskedInput` para fases futuras | Merged |

## 5. O que está concluído dentro da migração fundacional

- Supabase próprio operacional como backend do projeto.
- Dados reais da planilha BASE carregados no Supabase próprio.
- Tabelas fundacionais e views mínimas criadas.
- `vw_unidades_localizador` utilizada pelo localizador `/escolas`.
- `vw_unidade_detalhe` utilizada pela página individual `/escolas/:id`.
- Validação read-only do Supabase concluída para a view de detalhe.
- Totais da view de detalhe conferidos com `vw_dashboard_basico`.
- Vercel configurada para apontar o frontend ao Supabase próprio por variáveis de ambiente.
- Dependência operacional do Supabase Lovable superada nas telas principais.

## 6. O que não faz parte do encerramento da Foundation v1

Os itens abaixo permanecem relevantes, mas **não bloqueiam** o encerramento da Foundation v1:

- Dashboard final usando `vw_dashboard_basico`.
- Edição cadastral e bancária da página da escola.
- Importador institucional da BASE pela interface.
- Upload de comprovantes/notas fiscais.
- Motor documental.
- Geração individual real de documentos.
- Portal do Diretor funcional.
- Auth/roles/guards definitivos.
- Revisão completa de RLS/policies para uso institucional ampliado.
- Lote/ZIP/Cloud Run opcional.

Esses itens voltam ao Plano Global v4 nos marcos próprios.

## 7. Realocação para o Plano Global v4

| Item remanescente | Classificação correta | Marco lógico no Plano Global v4 |
|---|---|---|
| Dashboard real com `vw_dashboard_basico` | Evolução funcional/analítica | Marco 9 / painel analítico |
| Edição cadastral/bancária em `/escolas/:id` | Governança de dados e formulários | Fase 2B / Marco de formulários |
| Importador institucional via interface | Ingestão e validação de planilha | Marco 10 |
| Motor documental | Núcleo documental | Marco 11 |
| Geração individual real | Integração documental operacional | Marco 12 |
| Portal do Diretor | Perfil, vínculo e experiência externa | Marco 13 |
| Auth/roles/guards/RLS final | Segurança e controle de acesso | Marco 6 e Marco 13 |
| Light Mode institucional | Eixo visual/design system | Antecipado e concluído |
| Premium UI Kit / MaskedInput / Zod scaffold | Preparação técnica | Fase 2B e marcos documentais |

## 8. PRs antigos superados

- **PR #22**: superado pelo PR #30, que reconstruiu a página individual a partir da `main`, usando `vw_unidade_detalhe`, validação Supabase e smoke visual.
- **PR #7 / PR3B**: superado operacionalmente pela reconstrução limpa em PRs menores (#27, #29, #30 e complementos posteriores). Deve permanecer apenas como referência histórica até fechamento formal.
- **PR #3**: requer auditoria separada antes de decisão, pois o estado atual já possui referência a Vercel Analytics em documentação/código.

## 9. Próximo passo operacional

Antes de iniciar novas frentes funcionais, recomenda-se:

1. atualizar `docs/PROJECT_STATE.md`;
2. registrar a reconciliação com o Plano Global v4;
3. fechar PRs antigos superados (#22 e #7), com comentário de superseded;
4. decidir o destino do PR #3;
5. escolher a próxima frente do Plano Global v4.

Frentes candidatas:

- Dashboard real com `vw_dashboard_basico`;
- Fase 2B — edição cadastral/bancária com MaskedInput + Zod + React Hook Form;
- importador institucional via interface;
- auth/roles/guards;
- motor documental.

## 10. Frase oficial de handoff

> A Supabase Foundation v1 está concluída como migração fundacional. O projeto retorna ao Plano Global v4, com Dashboard real, Fase 2B, importador institucional, documentos, portal e segurança tratados nos marcos próprios, incorporando as alterações recentes ao estado oficial do projeto.
