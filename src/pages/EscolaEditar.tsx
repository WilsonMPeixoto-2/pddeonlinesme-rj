import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { NumberInput } from "@/components/inputs/NumberInput";
import { ArrowLeft, FileSpreadsheet, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="h-3 w-3" aria-hidden /> {message}
    </p>
  );
}

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<keyof Unidade>>(new Set());

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
    // Marca todos como tocados para revelar erros
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

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-9 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
            </CardHeader>
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

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/escolas")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info(`Em breve: gerar DEMONSTRATIVO BÁSICO - ${u.designacao}.xlsx`)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar demonstrativo
          </Button>
        </div>

        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Cadastro · 4ª CRE
            </p>
            <CardTitle className="text-lg">{u.designacao || "Unidade sem designação"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2" onSubmit={handleSave} noValidate>
              {/* Identificação */}
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Identificação
                </p>
              </div>

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

              {/* Dados financeiros */}
              <div className="sm:col-span-2 pt-3">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Dados financeiros e operacionais
                </p>
              </div>

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

              <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
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
