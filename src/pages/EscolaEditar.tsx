import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  User,
  Landmark,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useExercicio } from "@/hooks/useExercicio";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type UnidadeDetalheRow = Tables<"vw_unidade_detalhe">;

type Unidade = Omit<UnidadeDetalheRow, "unidade_id" | "designacao"> & {
  unidade_id: string;
  designacao: string;
};

type Errors = Partial<Record<keyof Unidade, string>>;
type EditableField =
  | "designacao"
  | "nome"
  | "inep"
  | "cnpj"
  | "diretor"
  | "endereco"
  | "banco"
  | "agencia"
  | "conta_corrente";

/* ─── Helpers ─── */

const PROGRAMA_PADRAO = "basico";
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const financialFields = [
  "reprogramado_custeio",
  "reprogramado_capital",
  "parcela_1_custeio",
  "parcela_1_capital",
  "parcela_2_custeio",
  "parcela_2_capital",
  "total_reprogramado",
  "total_parcelas",
  "total_disponivel_inicial",
] satisfies (keyof Unidade)[];

const accountFields = ["banco", "agencia", "conta_corrente"] satisfies (keyof Unidade)[];

const nullableText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const formatMoney = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? moneyFormatter.format(value) : "—";

function normalizeUnidade(row: UnidadeDetalheRow | null): Unidade | null {
  if (!row?.unidade_id) return null;
  return {
    ...row,
    unidade_id: row.unidade_id,
    designacao: row.designacao ?? "",
  };
}

function validate(u: Unidade): Errors {
  const errs: Errors = {};
  if (!u.designacao?.trim()) errs.designacao = "Informe a designação da unidade.";
  if (u.inep && onlyDigits(u.inep).length !== 8) errs.inep = "INEP deve ter 8 dígitos.";
  if (u.cnpj && onlyDigits(u.cnpj).length !== 14) errs.cnpj = "CNPJ deve ter 14 dígitos.";
  financialFields.forEach((field) => {
    if (toNumber(u[field] as number | null) < 0) {
      errs[field] = "Valor financeiro não pode ser negativo.";
    }
  });
  return errs;
}

function getStatusInfo(u: Unidade, hasErrors: boolean) {
  if (hasErrors) return { label: "Dados com erro", tone: "destructive" as const, icon: AlertTriangle };
  const hasFinancial = financialFields.some((field) => u[field] !== null);
  const hasIdentity = u.designacao?.trim() && u.inep;
  if (hasIdentity && hasFinancial)
    return { label: "Cadastro completo", tone: "success" as const, icon: CheckCircle2 };
  if (hasIdentity || hasFinancial)
    return { label: "Cadastro parcial", tone: "warning" as const, icon: Clock };
  return { label: "Pendente", tone: "muted" as const, icon: AlertTriangle };
}

/** Conta quantos campos importantes da seção estão preenchidos. */
function sectionProgress(u: Unidade, section: "id" | "bank" | "fin"): { done: number; total: number } {
  if (section === "id") {
    const fields = [u.designacao?.trim(), u.nome, u.inep, u.cnpj, u.diretor];
    return { done: fields.filter(Boolean).length, total: fields.length };
  }
  if (section === "bank") {
    const fields = [u.banco, u.agencia, u.conta_corrente, u.endereco];
    return { done: fields.filter((v) => Boolean(v && String(v).trim())).length, total: fields.length };
  }
  // fin
  const filled = [
    u.reprogramado_custeio !== null || u.reprogramado_capital !== null,
    u.parcela_1_custeio !== null || u.parcela_1_capital !== null,
    u.parcela_2_custeio !== null || u.parcela_2_capital !== null,
    u.total_reprogramado !== null,
    u.total_parcelas !== null,
    u.total_disponivel_inicial !== null,
  ];
  return { done: filled.filter(Boolean).length, total: filled.length };
}

/* ─── Section navigation ─── */

const SECTIONS = [
  { id: "identificacao", label: "Identificação", icon: User, key: "id" as const },
  { id: "bancarios", label: "Bancários & Local.", icon: Landmark, key: "bank" as const },
  { id: "financeiros", label: "Financeiros", icon: Coins, key: "fin" as const },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="h-3 w-3" aria-hidden /> {message}
    </p>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  done,
  total,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  done: number;
  total: number;
}) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  const complete = done === total && total > 0;
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md ring-1 transition-colors",
          complete
            ? "bg-success/10 text-success ring-success/20"
            : "bg-primary/10 text-primary ring-primary/20",
        )}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {done}/{total}
        </p>
        <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted/40">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              complete ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ReadOnlyMoneyField({
  id,
  value,
  placeholder = "Aguardando importação",
}: {
  id: string;
  value: number | null | undefined;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      value={typeof value === "number" && Number.isFinite(value) ? formatMoney(value) : ""}
      placeholder={placeholder}
      readOnly
      className="font-mono text-right tabular-nums"
    />
  );
}

function DetalheBreakdown({ unidade }: { unidade: Unidade }) {
  const rows = [
    {
      label: "Saldo Reprogramado",
      custeio: unidade.reprogramado_custeio,
      capital: unidade.reprogramado_capital,
      total: unidade.total_reprogramado,
    },
    {
      label: "1ª Parcela",
      custeio: unidade.parcela_1_custeio,
      capital: unidade.parcela_1_capital,
      total:
        unidade.parcela_1_custeio !== null || unidade.parcela_1_capital !== null
          ? toNumber(unidade.parcela_1_custeio) + toNumber(unidade.parcela_1_capital)
          : null,
    },
    {
      label: "2ª Parcela",
      custeio: unidade.parcela_2_custeio,
      capital: unidade.parcela_2_capital,
      total:
        unidade.parcela_2_custeio !== null || unidade.parcela_2_capital !== null
          ? toNumber(unidade.parcela_2_custeio) + toNumber(unidade.parcela_2_capital)
          : null,
    },
  ];
  const hasImportedValues = rows.some((row) => row.custeio !== null || row.capital !== null);

  return (
    <div className="mt-5 rounded-lg border border-dashed border-border/50 bg-muted/5 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Detalhamento Custeio × Capital
        </p>
        <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">
          {unidade.programa ?? "Não informado"}
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Componente
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Custeio
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Capital
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-3 py-2.5 text-sm text-muted-foreground/80">{row.label}</td>
                <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                  {formatMoney(row.custeio)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                  {formatMoney(row.capital)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm font-medium tabular-nums">
                  {formatMoney(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/40 bg-muted/20">
              <td className="px-3 py-2.5 text-sm font-medium">Total disponível inicial</td>
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold tabular-nums">
                {formatMoney(unidade.total_disponivel_inicial)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {!hasImportedValues && (
        <p className="mt-3 text-xs italic text-muted-foreground/70">
          Aguardando importação financeira para este exercício e programa.
        </p>
      )}
    </div>
  );
}

/* ─── Main component ─── */

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<Unidade | null>(null);
  const [original, setOriginal] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<keyof Unidade>>(new Set());
  const { exercicio } = useExercicio();
  const [activeSection, setActiveSection] = useState<string>("identificacao");
  const [docsOpen, setDocsOpen] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setU(null);
        setOriginal(null);
        setLoading(false);
        return;
      }

      const exercicioFiltro = Number.parseInt(exercicio, 10);
      if (!Number.isFinite(exercicioFiltro)) {
        toast.error("Exercício inválido para consulta da unidade.");
        setU(null);
        setOriginal(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("vw_unidade_detalhe")
        .select("*")
        .eq("unidade_id", id)
        .eq("exercicio", exercicioFiltro)
        .eq("programa", PROGRAMA_PADRAO)
        .maybeSingle();

      if (cancelled) return;
      if (error) toast.error(error.message);
      const unidade = normalizeUnidade(data);
      setU(unidade);
      setOriginal(unidade);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, exercicio]);

  // Scroll-spy: observe sections
  useEffect(() => {
    if (loading) return;
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
  }, [loading]);

  const errors = useMemo(() => (u ? validate(u) : {}), [u]);
  const hasErrors = Object.keys(errors).length > 0;

  const dirty = useMemo(() => {
    if (!u || !original) return false;
    return JSON.stringify(u) !== JSON.stringify(original);
  }, [u, original]);

  const setField = <K extends EditableField>(k: K, v: Unidade[K]) => {
    setU((prev) => (prev ? { ...prev, [k]: v } : prev));
    setTouched((prev) => new Set(prev).add(k));
  };

  const errOf = (k: keyof Unidade) => (touched.has(k) ? errors[k] : undefined);
  const isDirty = (k: keyof Unidade) =>
    dirty && original && u ? (u[k] ?? "") !== (original[k] ?? "") : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u) return;
    setTouched(new Set(Object.keys(u) as (keyof Unidade)[]));
    if (hasErrors) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }
    setSaving(true);
    const { error: unidadeError } = await supabase
      .from("unidades_escolares")
      .update({
        designacao: u.designacao,
        nome: nullableText(u.nome),
        inep: u.inep,
        cnpj: u.cnpj,
        diretor: u.diretor,
        endereco: u.endereco,
        agencia: u.agencia,
        conta_corrente: u.conta_corrente,
      })
      .eq("id", u.unidade_id);

    if (unidadeError) {
      setSaving(false);
      return toast.error(unidadeError.message);
    }

    const accountChanged = original
      ? accountFields.some((field) => (u[field] ?? "") !== (original[field] ?? ""))
      : false;

    if (accountChanged) {
      const { data: existingAccount, error: accountLookupError } = await supabase
        .from("contas_bancarias")
        .select("id")
        .eq("unidade_id", u.unidade_id)
        .eq("principal", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (accountLookupError) {
        setSaving(false);
        return toast.error(accountLookupError.message);
      }

      const accountPayload = {
        banco: nullableText(u.banco),
        agencia: nullableText(u.agencia),
        conta_corrente: nullableText(u.conta_corrente),
      };
      const hasAccountData = Object.values(accountPayload).some(Boolean);

      if (existingAccount) {
        const { error: accountUpdateError } = await supabase
          .from("contas_bancarias")
          .update(accountPayload)
          .eq("id", existingAccount.id);

        if (accountUpdateError) {
          setSaving(false);
          return toast.error(accountUpdateError.message);
        }
      } else if (hasAccountData) {
        const { error: accountInsertError } = await supabase
          .from("contas_bancarias")
          .insert({
            unidade_id: u.unidade_id,
            principal: true,
            ...accountPayload,
          });

        if (accountInsertError) {
          setSaving(false);
          return toast.error(accountInsertError.message);
        }
      }
    }

    setSaving(false);
    setOriginal(u);
    toast.success("Cadastro salvo na BASE central");
  };

  const scrollTo = (sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
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

  if (!u) {
    return (
      <AppLayout>
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-10 text-center">
          <p className="text-sm font-medium">
            Unidade escolar não encontrada para o exercício {exercicio} e programa {PROGRAMA_PADRAO}.
          </p>
          <Button variant="link" onClick={() => navigate("/escolas")}>
            Voltar para o cadastro
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = getStatusInfo(u, hasErrors);
  const StatusIcon = status.icon;
  const unidadeNome = u.designacao.trim() || u.nome?.trim() || "Unidade sem designação";

  const statusColors: Record<string, string> = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    muted: "border-border/50 bg-muted/30 text-muted-foreground",
  };

  // Overall progress
  const allProg = ["id", "bank", "fin"].reduce(
    (acc, k) => {
      const p = sectionProgress(u, k as "id" | "bank" | "fin");
      return { done: acc.done + p.done, total: acc.total + p.total };
    },
    { done: 0, total: 0 },
  );
  const overallPct = allProg.total > 0 ? (allProg.done / allProg.total) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* TOP BAR — Breadcrumb (O1) */}
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
              {unidadeNome}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                <Circle className="h-2 w-2 animate-pulse fill-warning text-warning" />
                Alterações não salvas
              </span>
            )}
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
                Cadastro · 4ª CRE · Exercício {exercicio}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {unidadeNome}
              </h1>
              {u.inep && (
                <p className="font-mono text-xs text-muted-foreground">INEP {u.inep}</p>
              )}
            </div>

            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                statusColors[status.tone],
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          {/* Overall progress */}
          <div className="relative mt-5 space-y-2">
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Preenchimento geral
              </span>
              <span className="font-mono tabular-nums text-foreground">
                {overallPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="sheen-overlay" aria-hidden />
              </motion.div>
            </div>
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
                const prog = sectionProgress(u, s.key);
                const complete = prog.done === prog.total && prog.total > 0;
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
                    {complete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                        {prog.done}/{prog.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN FORM */}
          <form onSubmit={handleSave} noValidate className="space-y-5">
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
                  subtitle="Dados cadastrais da unidade escolar"
                  done={sectionProgress(u, "id").done}
                  total={sectionProgress(u, "id").total}
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="designacao" className="flex items-center gap-2">
                      Designação
                      {isDirty("designacao") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="designacao"
                      value={u.designacao}
                      placeholder="Não informado"
                      onChange={(e) => setField("designacao", e.target.value)}
                      onBlur={() => setTouched((p) => new Set(p).add("designacao"))}
                      className={cn(
                        errOf("designacao") && "border-destructive focus-visible:ring-destructive",
                        isDirty("designacao") && !errOf("designacao") && "border-primary/40",
                      )}
                      aria-invalid={Boolean(errOf("designacao"))}
                    />
                    <FieldError message={errOf("designacao")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inep" className="flex items-center gap-2">
                      INEP
                      {isDirty("inep") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="inep"
                      value={u.inep ?? ""}
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Não informado"
                      onChange={(e) => setField("inep", onlyDigits(e.target.value))}
                      onBlur={() => setTouched((p) => new Set(p).add("inep"))}
                      className={cn(
                        "font-mono tabular-nums",
                        errOf("inep") && "border-destructive focus-visible:ring-destructive",
                        isDirty("inep") && !errOf("inep") && "border-primary/40",
                      )}
                      aria-invalid={Boolean(errOf("inep"))}
                    />
                    <FieldError message={errOf("inep")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cnpj" className="flex items-center gap-2">
                      CNPJ
                      {isDirty("cnpj") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="cnpj"
                      value={u.cnpj ?? ""}
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="Não informado"
                      onChange={(e) => setField("cnpj", onlyDigits(e.target.value))}
                      onBlur={() => setTouched((p) => new Set(p).add("cnpj"))}
                      className={cn(
                        "font-mono tabular-nums",
                        errOf("cnpj") && "border-destructive focus-visible:ring-destructive",
                        isDirty("cnpj") && !errOf("cnpj") && "border-primary/40",
                      )}
                      aria-invalid={Boolean(errOf("cnpj"))}
                    />
                    <FieldError message={errOf("cnpj")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="diretor" className="flex items-center gap-2">
                      Diretor(a)
                      {isDirty("diretor") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="diretor"
                      value={u.diretor ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("diretor", e.target.value)}
                      className={cn(isDirty("diretor") && "border-primary/40")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="flex items-center gap-2">
                      Nome
                      {isDirty("nome") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="nome"
                      value={u.nome ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("nome", e.target.value)}
                      className={cn(isDirty("nome") && "border-primary/40")}
                    />
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
                  title="Dados Bancários e Localização"
                  subtitle="Agência, conta corrente e endereço"
                  done={sectionProgress(u, "bank").done}
                  total={sectionProgress(u, "bank").total}
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="banco" className="flex items-center gap-2">
                      Banco
                      {isDirty("banco") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="banco"
                      value={u.banco ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("banco", e.target.value)}
                      className={cn(isDirty("banco") && "border-primary/40")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agencia" className="flex items-center gap-2">
                      Agência
                      {isDirty("agencia") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="agencia"
                      value={u.agencia ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("agencia", e.target.value)}
                      className={cn("font-mono tabular-nums", isDirty("agencia") && "border-primary/40")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="conta_corrente" className="flex items-center gap-2">
                      Conta corrente
                      {isDirty("conta_corrente") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="conta_corrente"
                      value={u.conta_corrente ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("conta_corrente", e.target.value)}
                      className={cn("font-mono tabular-nums", isDirty("conta_corrente") && "border-primary/40")}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-4">
                    <Label htmlFor="endereco" className="flex items-center gap-2">
                      Endereço
                      {isDirty("endereco") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="endereco"
                      value={u.endereco ?? ""}
                      placeholder="Não informado"
                      onChange={(e) => setField("endereco", e.target.value)}
                      className={cn(isDirty("endereco") && "border-primary/40")}
                    />
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
                  title="Dados Financeiros e Operacionais"
                  subtitle="Saldos, parcelas e execução do exercício"
                  done={sectionProgress(u, "fin").done}
                  total={sectionProgress(u, "fin").total}
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="programa">Programa</Label>
                    <Input
                      id="programa"
                      value={u.programa ?? ""}
                      placeholder="Não informado"
                      readOnly
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="total_reprogramado">Total reprogramado</Label>
                    <ReadOnlyMoneyField
                      id="total_reprogramado"
                      value={u.total_reprogramado}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="total_parcelas">Total parcelas</Label>
                    <ReadOnlyMoneyField
                      id="total_parcelas"
                      value={u.total_parcelas}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="total_disponivel_inicial">Total disponível inicial</Label>
                    <ReadOnlyMoneyField
                      id="total_disponivel_inicial"
                      value={u.total_disponivel_inicial}
                    />
                  </div>
                </div>

                <DetalheBreakdown unidade={u} />
              </CardContent>
            </Card>

            {/* STICKY ACTION BAR */}
            <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-md">
              <p className="px-2 text-xs text-muted-foreground">
                {hasErrors
                  ? "Há campos com erro. Corrija antes de salvar."
                  : dirty
                    ? "Alterações pendentes."
                    : "Tudo sincronizado."}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => navigate("/escolas")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || (!dirty && !hasErrors)}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DocumentsPanel
        open={docsOpen}
        onOpenChange={setDocsOpen}
        schoolName={unidadeNome}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
