import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  FileSpreadsheet,
  School,
  AlertTriangle,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Recente = { id: string; designacao: string };

export default function Dashboard() {
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);
  const [recentes, setRecentes] = useState<Recente[]>([]);
  const [loadingRecentes, setLoadingRecentes] = useState(true);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("unidades_escolares")
        .select("*", { count: "exact", head: true });
      setTotal(count ?? 0);

      const { data } = await supabase
        .from("unidades_escolares")
        .select("id, designacao")
        .order("updated_at", { ascending: false })
        .limit(4);
      setRecentes(data ?? []);
      setLoadingRecentes(false);
    })();
  }, []);

  const stats = [
    {
      label: "Unidades escolares",
      value: total,
      icon: School,
      hint: "Cadastradas na 4ª CRE",
      tone: "primary" as const,
    },
    {
      label: "Demonstrativos gerados",
      value: null,
      icon: CheckCircle2,
      hint: "Disponível em breve",
      tone: "success" as const,
    },
    {
      label: "Pendências",
      value: null,
      icon: AlertTriangle,
      hint: "Disponível em breve",
      tone: "warning" as const,
    },
    {
      label: "Última geração em lote",
      value: null,
      icon: FileSpreadsheet,
      hint: "Disponível em breve",
      tone: "muted" as const,
    },
  ];

  const toneRing: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Painel operacional
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Visão geral</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o estado da prestação de contas das unidades escolares da 4ª CRE.
            </p>
          </div>
          <Button onClick={() => navigate("/escolas")} className="self-start sm:self-auto">
            Unidades escolares
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            const isReady = s.value !== null && s.value !== undefined;
            return (
              <Card
                key={s.label}
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </p>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${toneRing[s.tone]}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                  </div>
                  <div className="mt-4">
                    {isReady ? (
                      <p className="text-3xl font-semibold tracking-tight tabular-nums">
                        {s.value}
                      </p>
                    ) : total === null && s.tone === "primary" ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-semibold tracking-tight text-muted-foreground/50">
                        —
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Atualizadas recentemente
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Últimas unidades escolares com modificações no cadastro.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/escolas")}
              className="text-xs"
            >
              Ver todas
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingRecentes ? (
              <ul className="divide-y divide-border/60">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex items-center justify-between py-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-7 w-16" />
                  </li>
                ))}
              </ul>
            ) : recentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Nenhuma unidade cadastrada ainda</p>
                <p className="text-xs text-muted-foreground">
                  Importe a BASE ou cadastre uma unidade para começar.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {r.designacao}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/escolas/${r.id}`)}
                    >
                      Abrir
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
