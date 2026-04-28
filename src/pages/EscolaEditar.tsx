import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { NumberInput } from "@/components/inputs/NumberInput";
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
import { useExercicio } from "@/hooks/useExercicio";
import { cn } from "@/lib/utils";
import { fmtBRL } from "@/lib/formatters";

/* ─── Types ─── */

type Unidade = {
  id: string;
  designacao: string;
  nome: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  endereco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  alunos: number | null;
  ativo: boolean | null;
  exercicio: number;
  programa: string;
  reprogramado_custeio: number;
  reprogramado_capital: number;
  parcela_1_custeio: number;
  parcela_1_capital: number;
  parcela_2_custeio: number;
  parcela_2_capital: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
  saldo_estimado: number;
  updated_at: string | null;
};

type Errors = Partial<Record<keyof Unidade, string>>;

/* ─── Helpers ─── */

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Derivados locais a partir dos campos fonte editáveis (espelham o que a view calcula no banco).
const computeRecebido = (u: Unidade) =>
  Number(u.parcela_1_custeio || 0) +
  Number(u.parcela_1_capital || 0) +
  Number(u.parcela_2_custeio || 0) +
  Number(u.parcela_2_capital || 0);

const computeSaldoAnterior = (u: Unidade) =>
  Number(u.reprogramado_custeio || 0) + Number(u.reprogramado_capital || 0);

function validate(u: Unidade): Errors {
  const errs: Errors = {};
  if (!u.nome?.trim()) {
    errs.nome = "Informe o nome da unidade escolar.";
  } else if (u.nome.trim().length < 3) {
    errs.nome = "O nome deve ter pelo menos 3 caracteres.";
  }
  if (!u.designacao?.trim()) errs.designacao = "Informe o código administrativo (designação).";
  if (u.inep && onlyDigits(u.inep).length !== 8) errs.inep = "INEP deve ter 8 dígitos.";
  if (u.cnpj && onlyDigits(u.cnpj).length !== 14) errs.cnpj = "CNPJ deve ter 14 dígitos.";
  if (u.email && !isValidEmail(u.email)) errs.email = "E-mail inválido.";
  if (u.alunos !== null) {
    if (!Number.isFinite(Number(u.alunos)) || Number(u.alunos) < 0) {
      errs.alunos = "Informe um número inteiro ≥ 0.";
    }
  }
  const finFonte: (keyof Unidade)[] = [
    "reprogramado_custeio",
    "reprogramado_capital",
    "parcela_1_custeio",
    "parcela_1_capital",
    "parcela_2_custeio",
    "parcela_2_capital",
    "gasto",
  ];
  for (const f of finFonte) {
    if (Number(u[f] ?? 0) < 0) {
      errs[f] = "Valor não pode ser negativo.";
    }
  }
  if (Number(u.gasto || 0) > computeRecebido(u) + computeSaldoAnterior(u)) {
    errs.gasto = "Gasto excede saldo anterior + recebido.";
  }
  return errs;
}

function getStatusInfo(u: Unidade, hasErrors: boolean) {
  if (hasErrors) return { label: "Dados com erro", tone: "destructive" as const, icon: AlertTriangle };
  const hasFinancial =
    computeSaldoAnterior(u) + computeRecebido(u) + Number(u.gasto || 0) > 0;
  const hasIdentity =
    Boolean(u.nome?.trim()) && Boolean(u.designacao?.trim()) && Boolean(u.inep);
  if (hasIdentity && hasFinancial)
    return { label: "Cadastro completo", tone: "success" as const, icon: CheckCircle2 };
  if (hasIdentity || hasFinancial)
    return { label: "Cadastro parcial", tone: "warning" as const, icon: Clock };
  return { label: "Pendente", tone: "muted" as const, icon: AlertTriangle };
}

/** Conta quantos campos importantes da seção estão preenchidos. */
function sectionProgress(u: Unidade, section: "id" | "bank" | "fin"): { done: number; total: number } {
  if (section === "id") {
    const fields = [u.nome?.trim(), u.designacao?.trim(), u.inep, u.cnpj, u.diretor, u.email];
    return { done: fields.filter(Boolean).length, total: fields.length };
  }
  if (section === "bank") {
    const fields = [u.agencia, u.conta_corrente, u.endereco];
    return { done: fields.filter((v) => Boolean(v && String(v).trim())).length, total: fields.length };
  }
  const filled = [
    Number(u.alunos ?? 0) > 0,
    Number(u.reprogramado_custeio || 0) + Number(u.reprogramado_capital || 0) > 0,
    Number(u.parcela_1_custeio || 0) + Number(u.parcela_1_capital || 0) > 0,
    Number(u.parcela_2_custeio || 0) + Number(u.parcela_2_capital || 0) > 0,
    Number(u.gasto || 0) > 0,
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

/* ─── Main component ─── */

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exercicio } = useExercicio();
  const [u, setU] = useState<Unidade | null>(null);
  const [original, setOriginal] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<keyof Unidade>>(new Set());
  const [activeSection, setActiveSection] = useState<string>("identificacao");
  const [docsOpen, setDocsOpen] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const exercicioNum = Number(exercicio);
    (async () => {
      const { data, error } = await supabase
        .from("vw_unidades_escolares_frontend")
        .select(
          "id, designacao, nome, inep, cnpj, diretor, email, endereco, agencia, conta_corrente, alunos, ativo, exercicio, programa, reprogramado_custeio, reprogramado_capital, parcela_1_custeio, parcela_1_capital, parcela_2_custeio, parcela_2_capital, saldo_anterior, recebido, gasto, saldo_estimado, updated_at",
        )
        .eq("id", id)
        .eq("exercicio", exercicioNum)
        .eq("programa", "basico")
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        setU(null);
        setOriginal(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setU(null);
        setOriginal(null);
        setLoading(false);
        return;
      }

      const normalized: Unidade = {
        id: data.id ?? "",
        designacao: data.designacao ?? "",
        nome: data.nome ?? "",
        inep: data.inep ?? null,
        cnpj: data.cnpj ?? null,
        diretor: data.diretor ?? null,
        email: data.email ?? null,
        endereco: data.endereco ?? null,
        agencia: data.agencia ?? null,
        conta_corrente: data.conta_corrente ?? null,
        alunos: data.alunos ?? null,
        ativo: data.ativo ?? null,
        exercicio: data.exercicio ?? exercicioNum,
        programa: data.programa ?? "basico",
        reprogramado_custeio: Number(data.reprogramado_custeio ?? 0),
        reprogramado_capital: Number(data.reprogramado_capital ?? 0),
        parcela_1_custeio: Number(data.parcela_1_custeio ?? 0),
        parcela_1_capital: Number(data.parcela_1_capital ?? 0),
        parcela_2_custeio: Number(data.parcela_2_custeio ?? 0),
        parcela_2_capital: Number(data.parcela_2_capital ?? 0),
        saldo_anterior: Number(data.saldo_anterior ?? 0),
        recebido: Number(data.recebido ?? 0),
        gasto: Number(data.gasto ?? 0),
        saldo_estimado: Number(data.saldo_estimado ?? 0),
        updated_at: data.updated_at ?? null,
      };
      setU(normalized);
      setOriginal(normalized);
      setLoading(false);
    })();
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

  const setField = <K extends keyof Unidade>(k: K, v: Unidade[K]) => {
    setU((prev) => (prev ? { ...prev, [k]: v } : prev));
    setTouched((prev) => new Set(prev).add(k));
  };

  const errOf = (k: keyof Unidade) => (touched.has(k) ? errors[k] : undefined);
  const isDirty = (k: keyof Unidade) =>
    dirty && original && u ? (u[k] ?? "") !== (original[k] ?? "") : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u || !original) return;
    setTouched(new Set(Object.keys(u) as (keyof Unidade)[]));
    if (hasErrors) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }
    setSaving(true);
    const exercicioNum = Number(exercicio);

    // Operação A — dados cadastrais em unidades_escolares.
    const { error: errA } = await supabase
      .from("unidades_escolares")
      .update({
        designacao: u.designacao,
        nome: u.nome,
        inep: u.inep,
        cnpj: u.cnpj,
        diretor: u.diretor,
        email: u.email,
        endereco: u.endereco,
        agencia: u.agencia,
        conta_corrente: u.conta_corrente,
        alunos: u.alunos === null ? null : Number(u.alunos),
      })
      .eq("id", u.id);

    if (errA) {
      setSaving(false);
      toast.error(`Falha ao salvar dados cadastrais: ${errA.message}`);
      return;
    }

    // Operação B — dados financeiros em execucao_financeira (filtrada por unidade/exercicio/programa).
    const { data: dataB, error: errB } = await supabase
      .from("execucao_financeira")
      .update({
        reprogramado_custeio: Number(u.reprogramado_custeio),
        reprogramado_capital: Number(u.reprogramado_capital),
        parcela_1_custeio: Number(u.parcela_1_custeio),
        parcela_1_capital: Number(u.parcela_1_capital),
        parcela_2_custeio: Number(u.parcela_2_custeio),
        parcela_2_capital: Number(u.parcela_2_capital),
        gasto: Number(u.gasto),
      })
      .eq("unidade_id", u.id)
      .eq("exercicio", exercicioNum)
      .eq("programa", "basico")
      .select("id");

    setSaving(false);

    // Snapshot pós-A: cadastrais salvos, financeiros mantidos como original (B ainda não confirmou).
    const partialOriginal: Unidade = {
      ...original,
      designacao: u.designacao,
      nome: u.nome,
      inep: u.inep,
      cnpj: u.cnpj,
      diretor: u.diretor,
      email: u.email,
      endereco: u.endereco,
      agencia: u.agencia,
      conta_corrente: u.conta_corrente,
      alunos: u.alunos,
    };

    if (errB) {
      setOriginal(partialOriginal);
      toast.error(
        `Dados cadastrais salvos. Falha ao salvar dados financeiros: ${errB.message}`,
      );
      return;
    }

    if (!dataB || dataB.length === 0) {
      setOriginal(partialOriginal);
      toast.error(
        "Dados cadastrais salvos. Linha de execução financeira não encontrada para unidade/exercicio/programa.",
      );
      return;
    }

    setOriginal(u);
    toast.success("Cadastro e execução financeira salvos.");
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
            Unidade escolar não encontrada para o exercício {exercicio}.
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
  const recebidoLocal = computeRecebido(u);
  const saldoLocal = computeSaldoAnterior(u);

  const statusColors: Record<string, string> = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    muted: "border-border/50 bg-muted/30 text-muted-foreground",
  };

  // Overall progress
  const allProg = ["id", "fin"].reduce(
    (acc, k) => {
      const p = sectionProgress(u, k as "id" | "fin");
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
              {u.nome || u.designacao}
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
                {u.nome || "Unidade sem nome"}
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                Código {u.designacao || "—"}
                {u.inep && <span> · INEP {u.inep}</span>}
              </p>
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
                    <Label htmlFor="nome" className="flex items-center gap-2">
                      Nome da unidade
                      {isDirty("nome") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="nome"
                      value={u.nome}
                      onChange={(e) => setField("nome", e.target.value)}
                      onBlur={() => setTouched((p) => new Set(p).add("nome"))}
                      placeholder="EM EMA NEGRÃO DE LIMA"
                      className={cn(
                        errOf("nome") && "border-destructive focus-visible:ring-destructive",
                        isDirty("nome") && !errOf("nome") && "border-primary/40",
                      )}
                      aria-invalid={Boolean(errOf("nome"))}
                    />
                    <FieldError message={errOf("nome")} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="designacao" className="flex items-center gap-2">
                      Código administrativo (designação)
                      {isDirty("designacao") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="designacao"
                      value={u.designacao}
                      onChange={(e) => setField("designacao", e.target.value)}
                      onBlur={() => setTouched((p) => new Set(p).add("designacao"))}
                      placeholder="04.10.001"
                      className={cn(
                        "font-mono tabular-nums",
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
                      placeholder="00000000"
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
                      placeholder="00000000000000"
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
                      onChange={(e) => setField("diretor", e.target.value)}
                      className={cn(isDirty("diretor") && "border-primary/40")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      E-mail
                      {isDirty("email") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="unidade@sme.rio"
                      value={u.email ?? ""}
                      onChange={(e) => setField("email", e.target.value)}
                      onBlur={() => setTouched((p) => new Set(p).add("email"))}
                      className={cn(
                        errOf("email") && "border-destructive focus-visible:ring-destructive",
                        isDirty("email") && !errOf("email") && "border-primary/40",
                      )}
                      aria-invalid={Boolean(errOf("email"))}
                    />
                    <FieldError message={errOf("email")} />
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
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="agencia" className="flex items-center gap-2">
                      Agência
                      {isDirty("agencia") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="agencia"
                      value={u.agencia ?? ""}
                      placeholder="0000"
                      onChange={(e) => setField("agencia", e.target.value)}
                      className={cn("font-mono tabular-nums", isDirty("agencia") && "border-primary/40")}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="conta_corrente" className="flex items-center gap-2">
                      Conta corrente
                      {isDirty("conta_corrente") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="conta_corrente"
                      value={u.conta_corrente ?? ""}
                      placeholder="000000"
                      onChange={(e) => setField("conta_corrente", e.target.value)}
                      className={cn("font-mono tabular-nums", isDirty("conta_corrente") && "border-primary/40")}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="endereco" className="flex items-center gap-2">
                      Endereço
                      {isDirty("endereco") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <Input
                      id="endereco"
                      value={u.endereco ?? ""}
                      placeholder="Rua, número, bairro — CEP"
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
                    <Label htmlFor="alunos" className="flex items-center gap-2">
                      Nº de alunos
                      {isDirty("alunos") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <NumberInput
                      id="alunos"
                      value={u.alunos ?? 0}
                      onChange={(v) => setField("alunos", v)}
                      min={0}
                      error={errOf("alunos")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gasto" className="flex items-center gap-2">
                      Gasto executado
                      {isDirty("gasto") && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
                    </Label>
                    <CurrencyInput
                      id="gasto"
                      value={u.gasto}
                      onChange={(v) => setField("gasto", v)}
                      error={errOf("gasto")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      Saldo anterior
                      <span className="rounded-sm bg-muted/40 px-1 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/80">
                        derivado
                      </span>
                    </Label>
                    <div
                      className="flex h-10 items-center justify-end rounded-md border border-border/40 bg-muted/10 px-3 font-mono tabular-nums text-sm text-muted-foreground"
                      aria-readonly="true"
                      title="Calculado a partir das parcelas reprogramadas (custeio + capital)."
                    >
                      {fmtBRL(saldoLocal)}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      Soma de Reprogramado custeio + capital.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      Recebido no exercício
                      <span className="rounded-sm bg-muted/40 px-1 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/80">
                        derivado
                      </span>
                    </Label>
                    <div
                      className="flex h-10 items-center justify-end rounded-md border border-border/40 bg-muted/10 px-3 font-mono tabular-nums text-sm text-muted-foreground"
                      aria-readonly="true"
                      title="Calculado a partir das parcelas 1 e 2 (custeio + capital)."
                    >
                      {fmtBRL(recebidoLocal)}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      Soma das parcelas 1 e 2 (custeio + capital).
                    </p>
                  </div>
                </div>

                {/* Detalhamento Custeio × Capital — fontes editáveis */}
                <div className="mt-5 rounded-lg border border-dashed border-border/50 bg-muted/5 p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Detalhamento Custeio × Capital
                  </p>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        <tr>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground/80">Saldo Reprogramado</td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="reprogramado_custeio"
                              value={u.reprogramado_custeio}
                              onChange={(v) => setField("reprogramado_custeio", v)}
                              error={errOf("reprogramado_custeio")}
                              className={cn(
                                isDirty("reprogramado_custeio") && !errOf("reprogramado_custeio") && "border-primary/40",
                              )}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="reprogramado_capital"
                              value={u.reprogramado_capital}
                              onChange={(v) => setField("reprogramado_capital", v)}
                              error={errOf("reprogramado_capital")}
                              className={cn(
                                isDirty("reprogramado_capital") && !errOf("reprogramado_capital") && "border-primary/40",
                              )}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground/80">1ª Parcela</td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="parcela_1_custeio"
                              value={u.parcela_1_custeio}
                              onChange={(v) => setField("parcela_1_custeio", v)}
                              error={errOf("parcela_1_custeio")}
                              className={cn(
                                isDirty("parcela_1_custeio") && !errOf("parcela_1_custeio") && "border-primary/40",
                              )}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="parcela_1_capital"
                              value={u.parcela_1_capital}
                              onChange={(v) => setField("parcela_1_capital", v)}
                              error={errOf("parcela_1_capital")}
                              className={cn(
                                isDirty("parcela_1_capital") && !errOf("parcela_1_capital") && "border-primary/40",
                              )}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground/80">2ª Parcela</td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="parcela_2_custeio"
                              value={u.parcela_2_custeio}
                              onChange={(v) => setField("parcela_2_custeio", v)}
                              error={errOf("parcela_2_custeio")}
                              className={cn(
                                isDirty("parcela_2_custeio") && !errOf("parcela_2_custeio") && "border-primary/40",
                              )}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <CurrencyInput
                              id="parcela_2_capital"
                              value={u.parcela_2_capital}
                              onChange={(v) => setField("parcela_2_capital", v)}
                              error={errOf("parcela_2_capital")}
                              className={cn(
                                isDirty("parcela_2_capital") && !errOf("parcela_2_capital") && "border-primary/40",
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs italic text-muted-foreground/70">
                    Fontes editáveis. Saldo anterior e Recebido são calculados automaticamente a partir destes valores.
                  </p>
                </div>
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
        schoolName={u.nome}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
