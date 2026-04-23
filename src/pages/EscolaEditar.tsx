import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { NumberInput } from "@/components/inputs/NumberInput";
import { DocumentMenu } from "@/components/DocumentMenu";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  ChevronDown,
  User,
  Landmark,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type Unidade = {
  id: string;
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  alunos: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
};

type Errors = Partial<Record<keyof Unidade, string>>;

/* ─── Helpers ─── */

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function validate(u: Unidade): Errors {
  const errs: Errors = {};
  if (!u.designacao?.trim()) errs.designacao = "Informe a designação da unidade.";
  if (u.inep && onlyDigits(u.inep).length !== 8) errs.inep = "INEP deve ter 8 dígitos.";
  if (u.cnpj && onlyDigits(u.cnpj).length !== 14) errs.cnpj = "CNPJ deve ter 14 dígitos.";
  if (u.email && !isValidEmail(u.email)) errs.email = "E-mail inválido.";
  if (!Number.isFinite(Number(u.alunos)) || Number(u.alunos) < 0)
    errs.alunos = "Informe um número inteiro ≥ 0.";
  if (Number(u.saldo_anterior) < 0) errs.saldo_anterior = "Saldo não pode ser negativo.";
  if (Number(u.recebido) < 0) errs.recebido = "Valor recebido não pode ser negativo.";
  if (Number(u.gasto) < 0) errs.gasto = "Valor gasto não pode ser negativo.";
  if (Number(u.gasto) > Number(u.saldo_anterior) + Number(u.recebido))
    errs.gasto = "Gasto excede saldo anterior + recebido.";
  return errs;
}

function getStatusInfo(u: Unidade, hasErrors: boolean) {
  if (hasErrors) return { label: "Dados com erro", tone: "destructive" as const, icon: AlertTriangle };
  const hasFinancial = Number(u.saldo_anterior) + Number(u.recebido) + Number(u.gasto) > 0;
  const hasIdentity = u.designacao?.trim() && u.inep;
  if (hasIdentity && hasFinancial) return { label: "Dados completos", tone: "success" as const, icon: CheckCircle2 };
  if (hasIdentity || hasFinancial) return { label: "Dados parciais", tone: "warning" as const, icon: Clock };
  return { label: "Pendente", tone: "muted" as const, icon: AlertTriangle };
}

/* ─── Sub-components ─── */

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
  isOpen,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  isOpen: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/8 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </div>
  );
}

/* ─── Main component ─── */

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<keyof Unidade>>(new Set());
  const [exercicio, setExercicio] = useState("2026");

  // Collapsible sections
  const [openId, setOpenId] = useState(true);
  const [openBank, setOpenBank] = useState(false);
  const [openFin, setOpenFin] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) toast.error(error.message);
      setU(data as Unidade | null);
      setLoading(false);
    })();
  }, [id]);

  const errors = useMemo(() => (u ? validate(u) : {}), [u]);
  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof Unidade>(k: K, v: Unidade[K]) => {
    setU((prev) => (prev ? { ...prev, [k]: v } : prev));
    setTouched((prev) => new Set(prev).add(k));
  };

  const errOf = (k: keyof Unidade) => (touched.has(k) ? errors[k] : undefined);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u) return;
    setTouched(new Set(Object.keys(u) as (keyof Unidade)[]));
    if (hasErrors) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("unidades_escolares")
      .update({
        designacao: u.designacao,
        inep: u.inep,
        cnpj: u.cnpj,
        diretor: u.diretor,
        email: u.email,
        alunos: Number(u.alunos),
        saldo_anterior: Number(u.saldo_anterior),
        recebido: Number(u.recebido),
        gasto: Number(u.gasto),
      })
      .eq("id", u.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro salvo na BASE central");
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-9 w-32" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
            <CardContent>
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
      </AppLayout>
    );
  }

  /* ─── Not found state ─── */
  if (!u) {
    return (
      <AppLayout>
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-10 text-center">
          <p className="text-sm font-medium">Unidade escolar não encontrada.</p>
          <Button variant="link" onClick={() => navigate("/escolas")}>
            Voltar para o cadastro
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = getStatusInfo(u, hasErrors);
  const StatusIcon = status.icon;

  const statusColors: Record<string, string> = {
    success: "bg-success/10 border-success/20 text-success",
    warning: "bg-warning/10 border-warning/20 text-warning",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    muted: "bg-muted/30 border-border/50 text-muted-foreground",
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ─── Top bar ─── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/escolas")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Select value={exercicio} onValueChange={setExercicio}>
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <DocumentMenu schoolName={u.designacao} variant="button" />
          </div>
        </div>

        {/* ─── Main card ─── */}
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Cadastro · 4ª CRE · Exercício {exercicio}
                </p>
                <CardTitle className="text-lg">{u.designacao || "Unidade sem designação"}</CardTitle>
              </div>
              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0",
                  statusColors[status.tone]
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleSave} noValidate>
              {/* ─── Section 1: Identificação ─── */}
              <Collapsible open={openId} onOpenChange={setOpenId}>
                <CollapsibleTrigger className="w-full hover:bg-muted/20 -mx-1 px-1 rounded-md transition-colors">
                  <SectionHeader
                    icon={User}
                    title="Identificação"
                    subtitle="Dados cadastrais da unidade escolar"
                    isOpen={openId}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 pb-6 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="designacao">Designação</Label>
                      <Input
                        id="designacao"
                        value={u.designacao}
                        onChange={(e) => setField("designacao", e.target.value)}
                        onBlur={() => setTouched((p) => new Set(p).add("designacao"))}
                        className={cn(errOf("designacao") && "border-destructive focus-visible:ring-destructive")}
                        aria-invalid={Boolean(errOf("designacao"))}
                      />
                      <FieldError message={errOf("designacao")} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="inep">INEP</Label>
                      <Input
                        id="inep"
                        value={u.inep ?? ""}
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="00000000"
                        onChange={(e) => setField("inep", onlyDigits(e.target.value))}
                        onBlur={() => setTouched((p) => new Set(p).add("inep"))}
                        className={cn("font-mono tabular-nums", errOf("inep") && "border-destructive focus-visible:ring-destructive")}
                        aria-invalid={Boolean(errOf("inep"))}
                      />
                      <FieldError message={errOf("inep")} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={u.cnpj ?? ""}
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="00000000000000"
                        onChange={(e) => setField("cnpj", onlyDigits(e.target.value))}
                        onBlur={() => setTouched((p) => new Set(p).add("cnpj"))}
                        className={cn("font-mono tabular-nums", errOf("cnpj") && "border-destructive focus-visible:ring-destructive")}
                        aria-invalid={Boolean(errOf("cnpj"))}
                      />
                      <FieldError message={errOf("cnpj")} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="diretor">Diretor(a)</Label>
                      <Input
                        id="diretor"
                        value={u.diretor ?? ""}
                        onChange={(e) => setField("diretor", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="unidade@sme.rio"
                        value={u.email ?? ""}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => setTouched((p) => new Set(p).add("email"))}
                        className={cn(errOf("email") && "border-destructive focus-visible:ring-destructive")}
                        aria-invalid={Boolean(errOf("email"))}
                      />
                      <FieldError message={errOf("email")} />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t border-border/40" />

              {/* ─── Section 2: Dados Bancários e Endereço (editorial preview) ─── */}
              <Collapsible open={openBank} onOpenChange={setOpenBank}>
                <CollapsibleTrigger className="w-full hover:bg-muted/20 -mx-1 px-1 rounded-md transition-colors">
                  <SectionHeader
                    icon={Landmark}
                    title="Dados Bancários e Localização"
                    subtitle="Agência, conta corrente e endereço da unidade"
                    isOpen={openBank}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pb-6">
                    <div className="rounded-lg border border-dashed border-border/50 bg-muted/5 p-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-muted-foreground">Agência</Label>
                          <div className="h-10 rounded-md border border-border/30 bg-muted/10 px-3 flex items-center">
                            <span className="text-sm text-muted-foreground/60 font-mono">0000-0</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-muted-foreground">Conta corrente</Label>
                          <div className="h-10 rounded-md border border-border/30 bg-muted/10 px-3 flex items-center">
                            <span className="text-sm text-muted-foreground/60 font-mono">00000000-0</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className="text-muted-foreground">Banco</Label>
                          <div className="h-10 rounded-md border border-border/30 bg-muted/10 px-3 flex items-center">
                            <span className="text-sm text-muted-foreground/60">Banco do Brasil</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <Label className="text-muted-foreground">Endereço</Label>
                        <div className="h-10 rounded-md border border-border/30 bg-muted/10 px-3 flex items-center">
                          <span className="text-sm text-muted-foreground/60">Endereço completo da unidade escolar</span>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground/70 italic">
                        Disponível na próxima versão — após migração do schema de dados.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t border-border/40" />

              {/* ─── Section 3: Dados Financeiros ─── */}
              <Collapsible open={openFin} onOpenChange={setOpenFin}>
                <CollapsibleTrigger className="w-full hover:bg-muted/20 -mx-1 px-1 rounded-md transition-colors">
                  <SectionHeader
                    icon={Coins}
                    title="Dados Financeiros e Operacionais"
                    subtitle="Saldos, parcelas e execução do exercício"
                    isOpen={openFin}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-5 pb-6">
                    {/* Functional fields (current schema) */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="alunos">Nº de alunos</Label>
                        <NumberInput
                          id="alunos"
                          value={u.alunos}
                          onChange={(v) => setField("alunos", v)}
                          min={0}
                          error={errOf("alunos")}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="saldo_anterior">Saldo anterior</Label>
                        <CurrencyInput
                          id="saldo_anterior"
                          value={u.saldo_anterior}
                          onChange={(v) => setField("saldo_anterior", v)}
                          error={errOf("saldo_anterior")}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="recebido">Recebido</Label>
                        <CurrencyInput
                          id="recebido"
                          value={u.recebido}
                          onChange={(v) => setField("recebido", v)}
                          error={errOf("recebido")}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="gasto">Gasto</Label>
                        <CurrencyInput
                          id="gasto"
                          value={u.gasto}
                          onChange={(v) => setField("gasto", v)}
                          error={errOf("gasto")}
                        />
                      </div>
                    </div>

                    {/* Editorial preview: Custeio × Capital breakdown */}
                    <div className="rounded-lg border border-dashed border-border/50 bg-muted/5 p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
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
                            {[
                              "Saldo Reprogramado",
                              "1ª Parcela",
                              "2ª Parcela",
                            ].map((row) => (
                              <tr key={row}>
                                <td className="px-3 py-2.5 text-sm text-muted-foreground/80">{row}</td>
                                <td className="px-3 py-2.5 text-right text-sm text-muted-foreground/40 font-mono tabular-nums">—</td>
                                <td className="px-3 py-2.5 text-right text-sm text-muted-foreground/40 font-mono tabular-nums">—</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground/70 italic">
                        Detalhamento financeiro disponível após migração da BASE.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* ─── Footer ─── */}
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  {hasErrors
                    ? "Há campos com erro. Corrija antes de salvar."
                    : "Todos os campos válidos."}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => navigate("/escolas")}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
