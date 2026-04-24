import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { MiniSparkline } from "@/components/MiniSparkline";
import { NumberTicker } from "@/components/NumberTicker";
import { toast } from "sonner";
import { Inbox, Sparkles } from "lucide-react";

type Token = { name: string; varName: string; tone?: string };

const SURFACE_TOKENS: Token[] = [
  { name: "Background", varName: "--background" },
  { name: "Card", varName: "--card" },
  { name: "Popover", varName: "--popover" },
  { name: "Muted", varName: "--muted" },
  { name: "Secondary", varName: "--secondary" },
  { name: "Border", varName: "--border" },
];

const ACTION_TOKENS: Token[] = [
  { name: "Primary", varName: "--primary" },
  { name: "Success", varName: "--success" },
  { name: "Warning", varName: "--warning" },
  { name: "Destructive", varName: "--destructive" },
];

function Swatch({ token }: { token: Token }) {
  return (
    <div className="space-y-2">
      <div
        className="h-20 rounded-lg border border-border/60 shadow-inner"
        style={{ background: `hsl(var(${token.varName}))` }}
      />
      <div className="space-y-0.5">
        <p className="text-xs font-medium">{token.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{token.varName}</p>
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
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Sistema de design · Interno
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Style Guide</h1>
            <p className="text-sm text-muted-foreground">
              Referência viva de tokens, tipografia, componentes e estados — Dark Mode Atmosférico Institucional.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            v1.0 · 4ª CRE
          </Badge>
        </div>

        {/* Tipografia */}
        <Section
          title="Tipografia"
          description="Inter · escala hierárquica do hero institucional ao microtexto operacional."
        >
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Hero · 72px / bold
              </p>
              <p className="text-7xl font-bold tracking-tight">R$ 4.812.339</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Display · 48px / bold
              </p>
              <p className="text-5xl font-bold tracking-tight">Visão geral</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Title · 24px / semibold
              </p>
              <p className="text-2xl font-semibold tracking-tight">Unidades Escolares</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Body · 14px / regular
              </p>
              <p className="text-sm">
                Acompanhe o estado da prestação de contas das unidades escolares da 4ª CRE.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Microcopy · 11px / light · uppercase tracking
              </p>
              <p className="text-[11px] font-light uppercase tracking-[0.18em] text-muted-foreground">
                Painel operacional · Exercício 2026
              </p>
            </div>
          </div>
        </Section>

        {/* Tokens de cor */}
        <Section
          title="Tokens de cor"
          description="Todos os valores são HSL definidos em src/index.css. Nunca use cores hardcoded em componentes."
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Superfícies
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {SURFACE_TOKENS.map((t) => <Swatch key={t.varName} token={t} />)}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações & Estados
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {ACTION_TOKENS.map((t) => <Swatch key={t.varName} token={t} />)}
              </div>
            </div>
          </div>
        </Section>

        {/* Botões */}
        <Section title="Botões" description="Variantes e tamanhos.">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Badges */}
        <Section title="Badges & Status pills">
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-6">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                Pronta
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
                Incompleta
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                Pendente
              </span>
            </CardContent>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Inputs & Controles">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Texto</label>
                <Input placeholder="Digite algo…" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Estado de erro</label>
                <Input
                  placeholder="Valor inválido"
                  className="border-destructive/60 focus-visible:ring-destructive/40"
                  defaultValue="abc"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Modo experimental</p>
                  <p className="text-[11px] text-muted-foreground">Switch padrão</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Skeletons</p>
                  <p className="text-[11px] text-muted-foreground">Loading placeholders</p>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Cards & Stats */}
        <Section title="Cards & métricas">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Total executado
                </p>
                <p className="text-3xl font-semibold tabular-nums">
                  <NumberTicker value={4812339} format={(n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`} />
                </p>
                <MiniSparkline data={[4, 9, 14, 19, 22, 31, 38, 47, 51]} tone="primary" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Conformidade
                </p>
                <p className="text-3xl font-semibold tabular-nums">
                  <NumberTicker value={92} format={(n) => `${Math.round(n)}%`} />
                </p>
                <MiniSparkline data={[60, 65, 70, 72, 78, 82, 88, 90, 92]} tone="success" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Pendências
                </p>
                <p className="text-3xl font-semibold tabular-nums">
                  <NumberTicker value={7} />
                </p>
                <MiniSparkline data={[15, 12, 11, 10, 9, 9, 8, 8, 7]} tone="warning" />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Estados */}
        <Section title="Estados de carregamento e vazio">
          <Tabs defaultValue="empty">
            <TabsList>
              <TabsTrigger value="empty">Empty</TabsTrigger>
              <TabsTrigger value="loading">Loading</TabsTrigger>
            </TabsList>
            <TabsContent value="empty">
              <Card>
                <CardContent className="p-6">
                  <EmptyState
                    icon={Inbox}
                    title="Nada por aqui ainda"
                    description="Importe a BASE ou cadastre uma unidade para começar."
                    action={<Button size="sm">Importar BASE</Button>}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="loading">
              <Card>
                <CardContent className="space-y-3 p-6">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* Modais & toasts */}
        <Section title="Diálogos & feedback">
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-6">
              <Button variant="outline" onClick={() => toast("Notificação padrão")}>
                Toast padrão
              </Button>
              <Button variant="outline" onClick={() => toast.success("Operação concluída")}>
                Toast sucesso
              </Button>
              <Button variant="outline" onClick={() => toast.error("Falha na operação")}>
                Toast erro
              </Button>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                Abrir ConfirmDialog
              </Button>
            </CardContent>
          </Card>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Excluir registro?"
            description="Esta ação é permanente e não poderá ser desfeita."
            confirmLabel="Excluir"
            variant="destructive"
            onConfirm={() => toast.success("Registro excluído (demo)")}
          />
        </Section>

        {/* Espaçamento */}
        <Section title="Espaçamento & Radius">
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-sm bg-primary/30" />
                <div className="h-10 w-10 rounded-md bg-primary/30" />
                <div className="h-10 w-10 rounded-lg bg-primary/30" />
                <div className="h-10 w-10 rounded-xl bg-primary/30" />
                <div className="h-10 w-10 rounded-full bg-primary/30" />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                radius: sm · md · lg · xl · full · base var(--radius) = 0.5rem
              </p>
            </CardContent>
          </Card>
        </Section>
      </div>
    </AppLayout>
  );
}
