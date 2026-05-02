import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { EmptyState } from "@/components/EmptyState";
import {
  ArrowLeft,
  AlertCircle,
  User,
  Landmark,
  Coins,
  CheckCircle2,
  FileText,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { cn } from "@/lib/utils";

/* ─── Helpers ─── */
const formatMoney = (val: number | null | undefined) => {
  if (val == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
};

const formatText = (val: string | null | undefined, fallback = "Não informado") => {
  return val && val.trim() !== "" ? val : fallback;
};

/* ─── Section navigation ─── */
const SECTIONS = [
  { id: "identificacao", label: "Identificação", icon: User },
  { id: "bancarios", label: "Dados Bancários", icon: Landmark },
  { id: "financeiros", label: "Execução Financeira Importada", icon: Coins },
];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md ring-1 bg-primary/10 text-primary ring-primary/20 transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/10 text-success">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exercicio } = useExercicio();
  const [activeSection, setActiveSection] = useState<string>("identificacao");
  const [docsOpen, setDocsOpen] = useState(false);

  const PROGRAMA_PADRAO = "basico";
  const readOnlyInputClass = "bg-background/60 border-border/50 text-foreground cursor-default shadow-inner";

  const { data: u, isLoading, error, refetch, isFetching } = useUnidadeDetalhe({
    unidadeId: id,
    exercicio,
    programa: PROGRAMA_PADRAO,
  });

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll-spy: observe sections
  useEffect(() => {
    if (isLoading || !u) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isLoading, u]);

  const handleSaveClick = () => {
    toast.info("Edição cadastral será tratada em etapa própria de governança de dados.");
  };

  const scrollTo = (sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-9 w-32" />
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <Skeleton className="h-64 w-full" />
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center p-10">
          <EmptyState
            icon={AlertCircle}
            title="Erro ao carregar dados da unidade escolar"
            description="Não foi possível consultar a view de detalhe no Supabase. Verifique sua sessão, conexão ou permissões."
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? "Tentando..." : "Tentar novamente"}
              </Button>
            }
          />
        </div>
      </AppLayout>
    );
  }

  if (!u) {
    return (
      <AppLayout>
        <div className="flex justify-center p-10">
          <EmptyState
            icon={AlertCircle}
            title={`Unidade escolar não encontrada para o exercício ${exercicio} e programa básico.`}
            action={
              <Button variant="outline" onClick={() => navigate("/escolas")}>
                Voltar para o localizador
              </Button>
            }
          />
        </div>
      </AppLayout>
    );
  }

  const headerTitle = u.nome || u.designacao || "Unidade sem identificação";

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* TOP BAR — Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              to="/escolas"
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Unidades Escolares
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="max-w-[300px] truncate font-medium text-foreground">
              {u.designacao || "Detalhe"}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setDocsOpen(true)}>
              <FileText className="mr-2 h-4 w-4" /> Gerar documentos
            </Button>
          </div>
        </div>

        {/* HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/90 via-card/70 to-card/50 p-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Detalhe da Unidade
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {headerTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {u.inep && (
                  <span className="font-mono text-xs font-medium text-muted-foreground border border-border/50 bg-background/50 px-2 py-0.5 rounded-md">
                    INEP {u.inep}
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-semibold text-secondary-foreground border border-border/50">
                  Exercício {exercicio}
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                  {PROGRAMA_PADRAO === "basico" ? "PDDE BÁSICO" : `PDDE ${PROGRAMA_PADRAO.toUpperCase()}`}
                </span>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3 w-3" />
              Consulta Sincronizada
            </span>
          </div>
        </motion.div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* SIDEBAR — section nav */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <nav className="space-y-1 rounded-xl border border-border/60 bg-card/50 p-2 backdrop-blur-sm">
              <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Seções
              </p>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                      isActive
                        ? "bg-primary/10 text-foreground shadow-[inset_2px_0_0_hsl(var(--primary))]"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/70",
                      )}
                    />
                    <span className="flex-1 truncate font-medium">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN FORM */}
          <div className="space-y-5">
            {/* SECTION 1: Identificação */}
            <Card
              id="identificacao"
              ref={(el) => {
                sectionRefs.current["identificacao"] = el;
              }}
              className="scroll-mt-32"
            >
              <CardContent className="p-6">
                <SectionHeader
                  icon={User}
                  title="Identificação"
                  subtitle="Dados institucionais da unidade"
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Designação</Label>
                    <Input readOnly value={formatText(u.designacao)} className={readOnlyInputClass} />
                  </div>
                  
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nome Completo</Label>
                    <Input readOnly value={formatText(u.nome)} className={readOnlyInputClass} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>INEP</Label>
                    <Input readOnly value={formatText(u.inep)} className={cn(readOnlyInputClass, "font-mono tabular-nums")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>CNPJ</Label>
                    <Input readOnly value={formatText(u.cnpj)} className={cn(readOnlyInputClass, "font-mono tabular-nums")} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Diretor(a)</Label>
                    <Input readOnly value={formatText(u.diretor)} className={readOnlyInputClass} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Endereço</Label>
                    <Input readOnly value={formatText(u.endereco)} className={readOnlyInputClass} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Bancários */}
            <Card
              id="bancarios"
              ref={(el) => {
                sectionRefs.current["bancarios"] = el;
              }}
              className="scroll-mt-32"
            >
              <CardContent className="p-6">
                <SectionHeader
                  icon={Landmark}
                  title="Dados Bancários"
                  subtitle="Conta vinculada da unidade"
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label>Banco</Label>
                    <Input readOnly value={formatText(u.banco, "Banco do Brasil")} className={readOnlyInputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Agência</Label>
                    <Input readOnly value={formatText(u.agencia)} className={cn(readOnlyInputClass, "font-mono tabular-nums")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Conta corrente</Label>
                    <Input readOnly value={formatText(u.conta_corrente)} className={cn(readOnlyInputClass, "font-mono tabular-nums")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: Financeiros */}
            <Card
              id="financeiros"
              ref={(el) => {
                sectionRefs.current["financeiros"] = el;
              }}
              className="scroll-mt-32"
            >
              <CardContent className="p-6">
                <SectionHeader
                  icon={Coins}
                  title="Execução Financeira Importada"
                  subtitle={`Valores referentes a ${exercicio} - Programa ${PROGRAMA_PADRAO.toUpperCase()}`}
                />
                
                <div className="mb-6 rounded-lg border border-border/40 bg-muted/10 p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Reprogramado</p>
                      <p className="text-lg font-mono font-medium text-foreground">{formatMoney(u.total_reprogramado)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Parcelas</p>
                      <p className="text-lg font-mono font-medium text-foreground">{formatMoney(u.total_parcelas)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-primary">Disponível Inicial</p>
                      <p className="text-lg font-mono font-semibold text-primary">{formatMoney(u.total_disponivel_inicial)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs italic text-muted-foreground/70">
                    Valores exibidos conforme BASE importada para o exercício e programa selecionados.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Detalhamento Custeio × Capital
                  </p>
                  <div className="overflow-hidden rounded-md border border-border/40">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Componente</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custeio</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capital</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        <tr>
                          <td className="px-3 py-2.5 text-sm font-medium text-foreground">Saldo Reprogramado</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.reprogramado_custeio)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.reprogramado_capital)}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2.5 text-sm font-medium text-foreground">1ª Parcela</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.parcela_1_custeio)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.parcela_1_capital)}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2.5 text-sm font-medium text-foreground">2ª Parcela</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.parcela_2_custeio)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">{formatMoney(u.parcela_2_capital)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STICKY ACTION BAR */}
            <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-md">
              <p className="px-2 text-xs text-muted-foreground">
                Visão consolidada read-only.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => navigate("/escolas")}>
                  Voltar
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveClick}>
                  <Save className="mr-2 h-4 w-4" /> Edição em breve
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentsPanel
        open={docsOpen}
        onOpenChange={setDocsOpen}
        schoolName={u.designacao || "Unidade Escolar"}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
