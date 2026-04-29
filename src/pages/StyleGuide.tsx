import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Info,
  Loader2,
  Sparkles,
  XCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Style Guide — Design System Institucional PDDE Online
   Referência viva. Todas as cores são tokens HSL.
   ───────────────────────────────────────────────────────── */

type Token = { name: string; cssVar: string; usage: string };

const PALETTE_BASE: Token[] = [
  { name: "Background", cssVar: "--background", usage: "Tela base institucional" },
  { name: "Foreground", cssVar: "--foreground", usage: "Texto principal" },
  { name: "Card", cssVar: "--card", usage: "Superfície de cartão padrão" },
  { name: "Card elevated", cssVar: "--card-elevated", usage: "Cartão em destaque" },
  { name: "Card hover", cssVar: "--card-hover", usage: "Estado de hover de cartão" },
  { name: "Muted", cssVar: "--muted", usage: "Superfícies secundárias" },
  { name: "Muted foreground", cssVar: "--muted-foreground", usage: "Texto auxiliar (AA ≥ 4.5:1)" },
  { name: "Border", cssVar: "--border", usage: "Linhas e divisores" },
  { name: "Border strong", cssVar: "--border-strong", usage: "Bordas em destaque" },
];

const PALETTE_PRIMARY: Token[] = [
  { name: "Primary", cssVar: "--primary", usage: "Ações primárias / links" },
  { name: "Primary glow", cssVar: "--primary-glow", usage: "Realce / sheen" },
  { name: "Primary muted", cssVar: "--primary-muted", usage: "Estados sutis" },
  { name: "Ring", cssVar: "--ring", usage: "Anel de foco acessível" },
];

const PALETTE_STATUS: Token[] = [
  { name: "Success", cssVar: "--success", usage: "Pronta · concluído · positivo" },
  { name: "Warning", cssVar: "--warning", usage: "Incompleto · atenção" },
  { name: "Destructive", cssVar: "--destructive", usage: "Erro · pendente crítico" },
  { name: "Info", cssVar: "--info", usage: "Mensagens informativas" },
  { name: "Neutral", cssVar: "--neutral", usage: "Sem informação / inativo" },
];

const PALETTE_RISK: Token[] = [
  { name: "Risk · none", cssVar: "--risk-none", usage: "Sem risco" },
  { name: "Risk · low", cssVar: "--risk-low", usage: "Baixo" },
  { name: "Risk · medium", cssVar: "--risk-medium", usage: "Médio" },
  { name: "Risk · high", cssVar: "--risk-high", usage: "Alto" },
  { name: "Risk · critical", cssVar: "--risk-critical", usage: "Crítico — bloqueante" },
];

const PALETTE_FIN: Token[] = [
  { name: "Fin · positive", cssVar: "--fin-positive", usage: "Saldo / receita" },
  { name: "Fin · negative", cssVar: "--fin-negative", usage: "Déficit" },
  { name: "Fin · spent", cssVar: "--fin-spent", usage: "Executado" },
  { name: "Fin · pending", cssVar: "--fin-pending", usage: "A executar" },
  { name: "Fin · custeio", cssVar: "--fin-custeio", usage: "Recurso de custeio" },
  { name: "Fin · capital", cssVar: "--fin-capital", usage: "Recurso de capital" },
  { name: "Fin · neutral", cssVar: "--fin-neutral", usage: "Sem movimento" },
];

const PALETTE_DOC: Token[] = [
  { name: "Doc · pending", cssVar: "--doc-pending", usage: "Não gerado" },
  { name: "Doc · draft", cssVar: "--doc-draft", usage: "Rascunho" },
  { name: "Doc · generated", cssVar: "--doc-generated", usage: "Gerado, aguardando ação" },
  { name: "Doc · signed", cssVar: "--doc-signed", usage: "Assinado / concluído" },
  { name: "Doc · rejected", cssVar: "--doc-rejected", usage: "Rejeitado" },
];

const PALETTE_PROG: Token[] = [
  { name: "PDDE Básico", cssVar: "--prog-basico", usage: "Programa Básico" },
  { name: "PDDE Qualidade", cssVar: "--prog-qualidade", usage: "Programa Qualidade" },
  { name: "PDDE Equidade", cssVar: "--prog-equidade", usage: "Programa Equidade" },
];

function Swatch({ token }: { token: Token }) {
  return (
    <div className="ds-card p-3">
      <div
        className="mb-2 h-12 w-full rounded-md ring-1 ring-inset ring-border/40"
        style={{ background: `hsl(var(${token.cssVar}))` }}
      />
      <div className="space-y-0.5">
        <p className="text-[12.5px] font-medium text-foreground">{token.name}</p>
        <p className="ds-num-mono text-[10.5px] text-muted-foreground">{token.cssVar}</p>
        <p className="text-[11px] leading-snug text-muted-foreground/90">{token.usage}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1 border-b border-border/60 pb-3">
        <h2 className="ds-h2">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function PaletteGrid({ tokens }: { tokens: Token[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tokens.map((t) => (
        <Swatch key={t.cssVar} token={t} />
      ))}
    </div>
  );
}

/* Mini barra de execução financeira (igual à da tabela de escolas) */
function ExecutionDemo({ pct }: { pct: number }) {
  const tone =
    pct >= 90 ? "from-warning/80 to-warning"
    : pct >= 50 ? "from-primary/70 to-primary"
    : "from-success/70 to-success";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="ds-num font-medium">R$ {(pct * 1500).toFixed(0)},00</span>
        <span className="ds-num text-muted-foreground/70">{pct.toFixed(0)}%</span>
      </div>
      <div className="ds-bar-track relative h-1.5 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-500", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StyleGuide() {
  const [demoLoading, setDemoLoading] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-10 animate-ds-fade-in">
        {/* Header */}
        <header className="space-y-2 border-b border-border/60 pb-6">
          <p className="ds-eyebrow">Design System · v1.0</p>
          <h1 className="ds-h1">Guia institucional PDDE Online</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Referência viva da paleta, tipografia, tokens semânticos e padrões visuais do sistema.
            Todas as cores são definidas em <span className="ds-num-mono">HSL</span> via tokens de{" "}
            <span className="ds-num-mono">index.css</span>. Componentes consomem apenas{" "}
            <span className="ds-num-mono">hsl(var(--token))</span> ou classes utilitárias do Tailwind
            mapeadas no <span className="ds-num-mono">tailwind.config.ts</span>.
          </p>
        </header>

        {/* ─── Paleta ─── */}
        <Section title="Paleta institucional definitiva" description="Base, primária e neutros.">
          <div className="space-y-5">
            <div>
              <p className="ds-label mb-2">Base · superfícies</p>
              <PaletteGrid tokens={PALETTE_BASE} />
            </div>
            <div>
              <p className="ds-label mb-2">Primária · marca SME</p>
              <PaletteGrid tokens={PALETTE_PRIMARY} />
            </div>
          </div>
        </Section>

        {/* ─── Tokens semânticos ─── */}
        <Section
          title="Tokens semânticos"
          description="Cores carregam significado: nunca use cor crua para representar status, risco ou financeiro."
        >
          <div className="space-y-6">
            <div>
              <p className="ds-label mb-2">Status operacional</p>
              <PaletteGrid tokens={PALETTE_STATUS} />
            </div>
            <div>
              <p className="ds-label mb-2">Risco · escala graduada</p>
              <PaletteGrid tokens={PALETTE_RISK} />
            </div>
            <div>
              <p className="ds-label mb-2">Financeiro · papéis monetários</p>
              <PaletteGrid tokens={PALETTE_FIN} />
            </div>
            <div>
              <p className="ds-label mb-2">Documentos · ciclo de vida</p>
              <PaletteGrid tokens={PALETTE_DOC} />
            </div>
            <div>
              <p className="ds-label mb-2">Programas PDDE</p>
              <PaletteGrid tokens={PALETTE_PROG} />
            </div>
          </div>
        </Section>

        {/* ─── Tipografia ─── */}
        <Section
          title="Tipografia"
          description="Inter para texto e títulos; JetBrains Mono para números e códigos institucionais."
        >
          <Card className="ds-card-elevated">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="ds-eyebrow">Eyebrow · uppercase tracking 0.16em</p>
                <h1 className="ds-h1">H1 · Títulos de página</h1>
                <p className="text-xs text-muted-foreground">.ds-h1 · 30/36px · semibold tracking-tight</p>
              </div>
              <div className="space-y-1">
                <h2 className="ds-h2">H2 · Seções</h2>
                <p className="text-xs text-muted-foreground">.ds-h2 · 24px · semibold tracking-tight</p>
              </div>
              <div className="space-y-1">
                <h3 className="ds-h3">H3 · Cards e blocos</h3>
                <p className="text-xs text-muted-foreground">.ds-h3 · 18px · semibold tracking-tight</p>
              </div>
              <div className="space-y-1">
                <p className="text-base text-foreground">Body · texto institucional padrão (Inter 16/17px).</p>
                <p className="text-sm text-muted-foreground">Body sm · auxiliar e descrições.</p>
                <p className="text-xs text-muted-foreground">Caption · metadata, timestamps, hints.</p>
              </div>
              <div className="grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-2">
                <div>
                  <p className="ds-label mb-2">Números — tabular nums</p>
                  <div className="space-y-1">
                    <p className="ds-num-mono text-num-xl text-foreground">R$ 1.234.567,89</p>
                    <p className="ds-num-mono text-num-lg text-foreground/90">R$ 12.345,67</p>
                    <p className="ds-num-mono text-num-md text-foreground/85">R$ 123,45</p>
                    <p className="ds-num-mono text-num-sm text-muted-foreground">163 unidades</p>
                  </div>
                </div>
                <div>
                  <p className="ds-label mb-2">Tabelas — th/td</p>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="ds-th py-1 text-left">Unidade</th>
                        <th className="ds-th py-1 text-right">Alunos</th>
                        <th className="ds-th py-1 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border/40">
                        <td className="ds-td py-1.5">EM Anísio Teixeira</td>
                        <td className="ds-num py-1.5 text-right">428</td>
                        <td className="ds-num-mono py-1.5 text-right text-foreground/90">R$ 12.450,00</td>
                      </tr>
                      <tr className="border-t border-border/40">
                        <td className="ds-td py-1.5">CMEI Vila Nova</td>
                        <td className="ds-num py-1.5 text-right">112</td>
                        <td className="ds-num-mono py-1.5 text-right text-foreground/90">R$ 4.890,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ─── Cards ─── */}
        <Section title="Padrões de cards" description="Três níveis de elevação institucional.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="ds-card p-5">
              <p className="ds-label mb-2">.ds-card</p>
              <p className="text-sm text-foreground">Padrão. Para conteúdo institucional estável.</p>
              <p className="mt-2 text-xs text-muted-foreground">Sombra: ds-sm · radius lg</p>
            </div>
            <div className="ds-card-elevated p-5">
              <p className="ds-label mb-2">.ds-card-elevated</p>
              <p className="text-sm text-foreground">Em destaque. Use em KPIs, painéis principais e modais.</p>
              <p className="mt-2 text-xs text-muted-foreground">Sombra: ds-md + inset highlight</p>
            </div>
            <div className="ds-card-interactive ds-press p-5">
              <p className="ds-label mb-2">.ds-card-interactive</p>
              <p className="text-sm text-foreground">Clicável. Hover eleva e troca o fundo. Combine com .ds-press.</p>
              <p className="mt-2 text-xs text-muted-foreground">Microinteração: lift + ds-spring</p>
            </div>
          </div>
        </Section>

        {/* ─── Badges ─── */}
        <Section
          title="Padrões de badges"
          description="Discretos e consistentes. Sempre semânticos — nunca decorativos."
        >
          <Card className="ds-card-elevated">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ds-badge ds-badge-success"><span className="ds-dot ds-dot-success" /> Pronta</span>
                <span className="ds-badge ds-badge-warning"><span className="ds-dot ds-dot-warning" /> Incompleta</span>
                <span className="ds-badge ds-badge-danger"><span className="ds-dot ds-dot-danger" /> Pendente</span>
                <span className="ds-badge ds-badge-info"><span className="ds-dot ds-dot-info" /> Em revisão</span>
                <span className="ds-badge ds-badge-neutral"><span className="ds-dot ds-dot-neutral" /> Sem dados</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="ds-badge-pill ds-badge-info">PDDE Básico</span>
                <span className="ds-badge-pill ds-badge-success">PDDE Qualidade</span>
                <span className="ds-badge-pill ds-badge-warning">PDDE Equidade</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">shadcn · secondary</Badge>
                <Badge variant="outline">shadcn · outline</Badge>
                <Badge>shadcn · default</Badge>
                <Badge variant="destructive">shadcn · destructive</Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                Use <code className="ds-num-mono">.ds-badge</code> para tabelas (compactos) e{" "}
                <code className="ds-num-mono">.ds-badge-pill</code> para filtros e cabeçalhos.
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ─── Estados ─── */}
        <Section
          title="Estados: vazio · carregando · erro · sucesso"
          description="Sempre comunicar com cor + ícone + mensagem clara."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Vazio */}
            <div className="ds-state-empty rounded-lg border border-dashed">
              <EmptyState
                variant="card"
                icon={Inbox}
                title="Nenhum resultado"
                description="Ajuste os filtros ou limpe a busca para ver todas as unidades."
                action={<Button size="sm" variant="outline">Limpar filtros</Button>}
              />
            </div>

            {/* Carregando — skeleton institucional */}
            <Card className="ds-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Carregando…</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
                <p className="ds-caret pt-1 text-[11px] text-muted-foreground">
                  Buscando dados
                </p>
              </CardContent>
            </Card>

            {/* Erro */}
            <div className="ds-state-error rounded-lg border p-5">
              <div className="mb-2 flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <p className="text-sm font-semibold">Falha ao carregar</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Não foi possível conectar ao backend. Verifique sua conexão e tente novamente.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10">
                Tentar novamente
              </Button>
            </div>

            {/* Sucesso */}
            <div className="ds-state-success rounded-lg border p-5">
              <div className="mb-2 flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-semibold">Importação concluída</p>
              </div>
              <p className="text-xs text-muted-foreground">
                163 unidades atualizadas. Nenhum conflito detectado.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-success/40 text-success hover:bg-success/10">
                Ver relatório
              </Button>
            </div>
          </div>

          {/* Aviso */}
          <div className="ds-state-warning mt-4 flex items-start gap-3 rounded-lg border p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-warning">Atenção</p>
              <p className="text-xs text-muted-foreground">
                3 unidades com cadastro incompleto. Conclua o cadastro antes de gerar documentos em lote.
              </p>
            </div>
          </div>
        </Section>

        {/* ─── Espaçamentos ─── */}
        <Section
          title="Espaçamentos"
          description="Escala 4px. Use os tokens — não hardcode valores."
        >
          <Card className="ds-card-elevated">
            <CardContent className="p-6">
              <div className="space-y-2">
                {[
                  { token: "--space-1", px: "4px", w: 4 },
                  { token: "--space-2", px: "8px", w: 8 },
                  { token: "--space-3", px: "12px", w: 12 },
                  { token: "--space-4", px: "16px", w: 16 },
                  { token: "--space-5", px: "24px", w: 24 },
                  { token: "--space-6", px: "32px", w: 32 },
                  { token: "--space-7", px: "48px", w: 48 },
                  { token: "--space-8", px: "64px", w: 64 },
                ].map((s) => (
                  <div key={s.token} className="flex items-center gap-3">
                    <span className="ds-num-mono w-24 text-[11px] text-muted-foreground">{s.token}</span>
                    <span className="ds-num-mono w-12 text-[11px] text-muted-foreground">{s.px}</span>
                    <div
                      className="h-3 rounded-sm bg-primary/40"
                      style={{ width: `${s.w * 4}px` }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ─── Sombras + Bordas + Radius ─── */}
        <Section title="Sombras, bordas e radius" description="Mapeados por tokens semânticos.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "shadow-ds-xs", cls: "shadow-ds-xs" },
              { name: "shadow-ds-sm", cls: "shadow-ds-sm" },
              { name: "shadow-ds-md", cls: "shadow-ds-md" },
              { name: "shadow-ds-lg", cls: "shadow-ds-lg" },
              { name: "shadow-ds-xl", cls: "shadow-ds-xl" },
              { name: "shadow-ds-glow", cls: "shadow-ds-glow" },
            ].map((s) => (
              <div key={s.name} className={cn("rounded-lg border border-border/60 bg-card p-4", s.cls)}>
                <p className="ds-num-mono text-[11px] text-muted-foreground">{s.name}</p>
                <p className="mt-2 text-sm">Superfície institucional</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "radius sm", cls: "rounded-sm" },
              { label: "radius md", cls: "rounded-md" },
              { label: "radius lg", cls: "rounded-lg" },
              { label: "radius xl", cls: "rounded-xl" },
              { label: "radius pill", cls: "rounded-pill" },
            ].map((r) => (
              <div key={r.label} className="space-y-2">
                <div className={cn("h-12 border border-border/60 bg-muted/30", r.cls)} />
                <p className="ds-num-mono text-[11px] text-muted-foreground">{r.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="ds-label">Border padrão</p>
              <p className="text-sm text-muted-foreground">border · 1px · sutil</p>
            </div>
            <div className="rounded-lg border border-border-strong bg-card p-4">
              <p className="ds-label">Border strong</p>
              <p className="text-sm text-muted-foreground">border-strong · para hover/destaque</p>
            </div>
          </div>
        </Section>

        {/* ─── Microinterações ─── */}
        <Section
          title="Microinterações"
          description="Sempre rápidas (140–360ms), com easing institucional. Respeitam prefers-reduced-motion."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="ds-card-interactive ds-lift cursor-pointer p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-medium">.ds-lift</p>
              <p className="text-xs text-muted-foreground">Hover sobe 2px e ganha sombra md → lg.</p>
            </div>
            <div className="ds-card ds-press cursor-pointer p-5">
              <TrendingUp className="h-5 w-5 text-success" />
              <p className="mt-2 text-sm font-medium">.ds-press</p>
              <p className="text-xs text-muted-foreground">Pressão tátil: scale 0.97 com spring.</p>
            </div>
            <div className="ds-card p-5">
              <FileText className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-medium">.ds-focus</p>
              <p className="mb-2 text-xs text-muted-foreground">Anel de foco acessível em qualquer interativo.</p>
              <Button variant="outline" size="sm" className="ds-focus">
                Tab para focar
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => setDemoLoading((v) => !v)} variant="outline" size="sm">
              {demoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {demoLoading ? "Carregando…" : "Disparar carregamento"}
            </Button>
            {demoLoading && (
              <span className="ds-caret text-xs text-muted-foreground">Processando</span>
            )}
          </div>
        </Section>

        {/* ─── Componentes financeiros ─── */}
        <Section title="Padrões financeiros" description="Cores semânticas + números tabulares.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="ds-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="ds-label">Saldo</span>
                <Wallet className="h-4 w-4 text-fin-positive" />
              </div>
              <p className="ds-num-mono text-num-lg text-fin-positive">R$ 12.450,00</p>
              <p className="mt-1 text-[11px] text-muted-foreground">vs. R$ 10.200,00 no mês anterior</p>
            </div>
            <div className="ds-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="ds-label">Executado</span>
                <TrendingUp className="h-4 w-4 text-fin-spent" />
              </div>
              <p className="ds-num-mono text-num-lg text-foreground/90">R$ 8.230,00</p>
              <ExecutionDemo pct={66} />
            </div>
            <div className="ds-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="ds-label">Pendente</span>
                <TrendingDown className="h-4 w-4 text-fin-pending" />
              </div>
              <p className="ds-num-mono text-num-lg text-fin-pending">R$ 4.220,00</p>
              <ExecutionDemo pct={92} />
            </div>
            <div className="ds-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="ds-label">Custeio · Capital</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-fin-custeio" />
                <span className="ds-num-mono text-sm text-foreground/90">R$ 6.800</span>
                <span className="ml-3 inline-block h-2 w-2 rounded-full bg-fin-capital" />
                <span className="ds-num-mono text-sm text-foreground/90">R$ 1.430</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Distribuição por natureza</p>
            </div>
          </div>
        </Section>

        {/* ─── Acessibilidade ─── */}
        <Section
          title="Acessibilidade de contraste"
          description="Todas as combinações abaixo são testadas em fundo institucional (#0A1024)."
        >
          <Card className="ds-card-elevated">
            <CardContent className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { fg: "foreground",         label: "Texto principal",  ratio: "≥ 13:1", aa: "AAA" },
                  { fg: "muted-foreground",   label: "Texto auxiliar",   ratio: "≥ 4.8:1", aa: "AA" },
                  { fg: "primary",            label: "Link / ação",      ratio: "≥ 5.2:1", aa: "AA" },
                  { fg: "success",            label: "Status positivo",  ratio: "≥ 4.6:1", aa: "AA" },
                  { fg: "warning",            label: "Status atenção",   ratio: "≥ 6.4:1", aa: "AA" },
                  { fg: "destructive",        label: "Status crítico",   ratio: "≥ 5.0:1", aa: "AA" },
                ].map((c) => (
                  <div key={c.fg} className="ds-card p-3">
                    <p className={cn("text-base font-medium", `text-${c.fg}`)}>{c.label}</p>
                    <p className="mt-1 ds-num-mono text-[11px] text-muted-foreground">
                      hsl(var(--{c.fg})) · {c.ratio} · {c.aa}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Regras de uso</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Texto sobre primary deve usar <code className="ds-num-mono">primary-foreground</code> (branco).</li>
                  <li>Nunca use cor crua (ex: <code className="ds-num-mono">text-white</code>) em componentes — sempre tokens.</li>
                  <li>Anel de foco visível em todo interativo: aplicar <code className="ds-num-mono">.ds-focus</code> ou variant shadcn.</li>
                  <li>Animações respeitam <code className="ds-num-mono">prefers-reduced-motion</code>.</li>
                  <li>Status nunca depende só de cor: sempre cor + ícone + texto.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Footer */}
        <footer className="border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          PDDE Online · 4ª CRE · SME-RJ — Design System v1.0 · Prototipação visual.
        </footer>
      </div>
    </AppLayout>
  );
}
