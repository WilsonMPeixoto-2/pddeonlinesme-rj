

# Divisão realista do projeto: o que faço aqui vs. o que é melhor fora

## ✅ O que eu faço bem dentro do Lovable

### 1. Frontend web (React + Tailwind)
- Tela de login único da CRE
- Listagem/busca/edição das 163 escolas (CRUD da BASE)
- Formulário para adicionar/editar campos da BASE
- Botões "gerar 1 demonstrativo" e "gerar lote (.zip)"
- Histórico de gerações (data, usuário, qtd de arquivos)
- Validações de input (CNPJ, INEP, valores numéricos)

### 2. Backend leve (Lovable Cloud / Supabase)
- Tabela `escolas` (espelho da aba BASE)
- Tabela `geracoes` (auditoria de cada lote gerado)
- Autenticação por e-mail/senha para a equipe da CRE
- Importação inicial das 163 linhas a partir do seu .xlsx
- Exportar a BASE de volta para .xlsx quando precisar

### 3. Geração de XLSX server-side via Edge Function
- Abre o **seu template original** como base (preserva layout, fórmulas, formatação)
- Substitui apenas as células de dados vindas da BASE
- Aplica `sheet.protection` com senha **ANA** nas áreas amarelas mapeadas
- Nomeia `DEMONSTRATIVO BÁSICO - <designação>.xlsx`
- Empacota em `.zip` quando for lote

### 4. Análise e prototipação one-shot
- Já fiz: mapeamento das abas, células amarelas, lógica do template
- Posso gerar amostras (.xlsx reais) para você validar antes de subir tudo

---

## ⚠️ O que é melhor fazer fora ou com cautela

| Tarefa | Por quê não aqui | Onde fazer |
|---|---|---|
| **Validação visual fiel ao layout oficial FNDE** | Eu não consigo abrir o .xlsx no Excel real para conferir bit-a-bit. Renderizadores web/LibreOffice podem divergir sutilmente do Excel. | Você abre os arquivos gerados no Excel e valida. Eu entrego amostras pequenas primeiro. |
| **Fórmulas complexas tipo XLOOKUP encadeado** | LibreOffice (motor de recálculo no sandbox) tem suporte parcial a funções novas do Excel 365. Risco de divergência silenciosa. | Manter as fórmulas **dentro do template original** intactas — eu nunca reescrevo fórmula, só preencho células de entrada. |
| **Assinatura digital / certificado ICP-Brasil nos arquivos** | Fora do escopo de qualquer ferramenta web genérica. | Fluxo manual com gov.br ou software específico, depois da geração. |
| **Envio oficial ao SIGPC/FNDE** | Sistema federal fechado, sem API pública. | Upload manual pela equipe da CRE no portal do FNDE. |
| **Edição do template oficial em si** | Mudanças de layout, adicionar/remover blocos do Demonstrativo. | Você (ou a equipe) edita no Excel e me reenvia o template novo. Eu só consumo. |
| **Conciliação bancária real (importar OFX do banco)** | Cada banco tem formato/API próprio; vira um projeto à parte. | Continuar manual, ou projeto separado depois. |
| **Portal multi-tenant com 163 logins de diretoras** | Possível tecnicamente, mas explode escopo, suporte e custo. Você mesmo cortou. | Fora do escopo desta entrega. |
| **Backup/retenção legal de longo prazo** | Lovable Cloud guarda dados, mas prestação de contas pública costuma exigir arquivamento próprio. | Exportar .zip de todos os demonstrativos por exercício e guardar no drive institucional da SEDUC. |

---

## 🧱 Divisão de responsabilidade clara

```text
┌─────────────────────────────────────────────────────────┐
│  VOCÊ / EQUIPE CRE                                      │
│  • Mantém o TEMPLATE oficial (.xlsx) atualizado         │
│  • Valida amostras geradas no Excel real                │
│  • Faz upload manual no SIGPC/FNDE                      │
│  • Decide quando regerar o lote                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  SISTEMA LOVABLE (o que eu construo)                    │
│  • BASE online (CRUD, busca, validação)                 │
│  • Login único da CRE                                   │
│  • Motor de geração XLSX (template + dados + senha ANA) │
│  • Histórico/auditoria de gerações                      │
│  • Export .zip do lote                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Entrega proposta — fatias pequenas e verificáveis

**Fatia 1 — Prova do motor (sem site, sem banco)**
Eu rodo um script aqui mesmo que pega 3 escolas da sua BASE atual, gera 3 .xlsx reais com proteção amarela e senha ANA, e te entrego em `/mnt/documents/`. Você abre no Excel e valida fidelidade. **Se essa fatia falhar, todo o resto cai — então começamos por ela.**

**Fatia 2 — BASE online + login**
Lovable Cloud ativado, tabela `escolas` populada com as 163 unidades, tela de listagem/edição com login único da CRE.

**Fatia 3 — Geração on-demand pela web**
Botão "gerar 1" e "gerar todos (.zip)" na tela, usando o motor da Fatia 1 dentro de uma Edge Function. Histórico de gerações registrado.

**Fatia 4 — Teste da Leitura A**
Adicionamos uma coluna nova na BASE pela tela, regeramos o lote, validamos que a coluna nova aparece nos novos arquivos. Isso fecha o teste pedido pela sua chefe.

---

## ❓ Limites honestos que você precisa saber

1. **Não posso garantir 100% de fidelidade visual** sem você abrir no Excel e conferir. Por isso a Fatia 1 vem antes de tudo.
2. **A senha ANA protege a planilha contra edição casual**, não é criptografia forte. Quem tiver intenção e conhecimento abre. Isso é limitação do próprio Excel, não do nosso sistema.
3. **Lovable Cloud tem custo de uso** (banco + edge functions). Para 163 escolas e geração mensal, tende a ficar dentro da faixa gratuita ou muito baixa, mas não é zero.
4. **Se o template oficial mudar de layout**, o motor precisa ser reajustado. Não é automático.

---

## 🎯 Recomendação

Começar pela **Fatia 1 agora**. É a única que valida a hipótese mais arriscada (geração fiel + proteção). Custa pouco tempo, não exige decisão sobre Cloud, e se o resultado te convencer aí seguimos para Fatias 2-4.

