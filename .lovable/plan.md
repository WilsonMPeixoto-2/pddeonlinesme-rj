

# Reestilização Global — Dark Mode Atmosférico Institucional

Aplicação de uma nova identidade visual em todo o sistema, mantendo arquitetura, dados, autenticação e estrutura de navegação atuais. Apenas tokens de design, tipografia, hierarquia e detalhes de layout serão alterados.

## 1. Paleta — Dark mode profundo como padrão

Reescrita de `src/index.css` para que o app inicie em modo escuro grafite por padrão (sem botão de toggle nesta etapa), com o azul institucional da SME-RJ como cor tática de destaque.

Tokens principais (HSL, conforme exigido pelo sistema):

- `--background`: `220 13% 8%` (grafite profundo, próximo a #121214)
- `--card`: `220 13% 11%` (elevação sutil sobre o fundo)
- `--popover`: `220 13% 10%`
- `--foreground`: `210 20% 96%` (texto principal quase branco, sem brilho excessivo)
- `--muted`: `220 10% 15%`
- `--muted-foreground`: `215 14% 62%` (textos secundários/Visual Law finos)
- `--border`: `220 10% 18%` (bordas quase invisíveis, separação por contraste)
- `--input`: `220 10% 14%`
- `--primary`: `212 95% 56%` (azul SME-RJ tático, vibrante sobre grafite — derivado do logo da 4ª CRE)
- `--primary-foreground`: `0 0% 100%`
- `--ring`: `212 95% 56%` (anel de foco azul institucional)
- `--accent`: `212 95% 56%`
- `--success`: `152 65% 45%`
- `--warning`: `38 92% 55%`
- `--destructive`: `0 75% 55%`
- Sidebar/header: tom levemente acima do background (`220 13% 10%`)

Adicionalmente, no `body`:
- Fundo com gradiente atmosférico sutil (radial azul a 6% no canto superior, fade para grafite).
- `font-feature-settings` ativando `cv11`, `ss01` para tipografia moderna.
- Suavização `-webkit-font-smoothing: antialiased`.

## 2. Tipografia — Inter com hierarquia ousada

Adoção da fonte **Inter** (estável, gratuita, próxima visualmente da Geist) via Google Fonts no `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

No `tailwind.config.ts`, estender `fontFamily.sans` para `["Inter", ...]` com fallback ao stack do sistema.

Hierarquia tipográfica padrão (classes utilitárias aplicadas nas páginas existentes, sem mudar estrutura):

- **Display / herói de página**: `text-4xl md:text-5xl font-bold tracking-tight` (títulos de Dashboard, Login)
- **Título de seção**: `text-2xl font-semibold tracking-tight`
- **Label/eyebrow**: `text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground`
- **Body**: `text-sm font-normal text-muted-foreground` (Visual Law — instruções finas)
- **Números financeiros**: `tabular-nums font-semibold` (mantém alinhamento da tabela)

Sem títulos de 72px reais — em produto administrativo isso prejudica densidade. Adotamos a *sensação* de hierarquia ousada via contraste forte entre `text-4xl/5xl bold` e `text-xs font-light text-muted-foreground`, que é o que dá o tom "Visual Law" sem comprometer usabilidade.

## 3. Logo da 4ª CRE — uso discreto e institucional

A imagem enviada (`Screenshot_20260422_211556_Claude.jpg`) será copiada para `src/assets/logo-4cre.png` e usada em três pontos discretos:

- **Login** — substitui o ícone `ShieldCheck` no cabeçalho do card. Tamanho 56×56, com leve `ring-1 ring-primary/30` e `drop-shadow`. Subtítulo "SME-RJ · 4ª CRE" mantido.
- **AppLayout (header)** — substitui o quadrado azul atual (`h-7 w-7 rounded-md bg-primary`) por um círculo com a logo, 28×28. Texto "PDDE Online · 4ª CRE · SME-RJ" ao lado.
- **Footer institucional** — uma linha discreta no fim do `AppLayout` (já que hoje não há footer), com a logo em opacidade 40%, à direita: "Sistema interno · 4ª Coordenadoria Regional de Educação · SME-RJ". Texto em `text-[11px] font-light tracking-wide text-muted-foreground/70`.

Sem aplicar o logo em todas as páginas internas — apenas onde reforça identidade sem poluir.

## 4. Refinamentos visuais por página (sem reestruturar)

Aplicação automática do novo tema escuro em todas as páginas via tokens. Ajustes pontuais:

- **Login**: gradiente atmosférico mais profundo (radial azul superior + grafite), card com `bg-card/80 backdrop-blur` e `border-border/60`. Título do card sobe para `text-2xl font-semibold`.
- **AppLayout**: header com `bg-card/60 backdrop-blur-md border-border/60`, indicador de aba ativa fica em azul tático (`after:bg-primary` com `shadow-[0_0_12px_hsl(var(--primary)/0.4)]`) — sutil glow institucional.
- **Dashboard**: título principal sobe para `text-4xl font-bold tracking-tight`. Cards de resumo ganham `bg-card border border-border/60` com hover `border-primary/30`.
- **Escolas / Configurações / Base / EscolaEditar / Manual**: herdam tokens automaticamente. Apenas ajuste de classes onde houver `bg-white`, `bg-gray-*` ou `text-gray-*` hardcoded (rodar busca e trocar por tokens semânticos).

## 5. Detalhes técnicos de implementação

- `src/main.tsx` ou `src/App.tsx`: adicionar `document.documentElement.classList.add("dark")` no boot para forçar dark mode global (não há toggle ainda).
- Manter os tokens `:root` (light) intactos como fallback futuro — apenas alteramos `.dark` e forçamos `.dark` no html.
- *Alternativa preferida*: redefinir os tokens diretamente no `:root` para o novo grafite (mais simples, evita acoplar com `.dark` class) e remover o forçar-dark. **Vou seguir essa alternativa** para manter o sistema previsível.
- Copiar `user-uploads://Screenshot_20260422_211556_Claude.jpg` para `src/assets/logo-4cre.png`.
- Criar componente leve `src/components/BrandMark.tsx` que renderiza a logo + texto institucional, reutilizado em Login, header e footer.
- Buscar e substituir cores hardcoded restantes (`bg-white`, `text-black`, `bg-gray-*`) por tokens semânticos.
- Ajustar `tailwind.config.ts` com `fontFamily.sans = ["Inter", "ui-sans-serif", "system-ui", ...]`.

## 6. Fora de escopo (preservado)

- Nenhuma mudança em rotas, autenticação, schema, edge functions ou lógica de negócio.
- Sem novos fluxos, sem novas páginas, sem toggle de tema (pode vir depois se desejado).
- Conteúdo textual em PT-BR mantido; apenas microcopy de footer institucional adicionada.

