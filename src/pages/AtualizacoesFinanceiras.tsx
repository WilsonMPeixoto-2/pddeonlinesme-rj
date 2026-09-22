import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Database,
  Landmark,
  Search,
  WalletCards,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercicio } from "@/hooks/useExercicio";
import {
  buildRecentFinancialEvents,
  type FinancialEventStage,
} from "@/lib/financeiroPDDE";
import {
  financialFreshnessOptions,
  repassesFinanceirosOptions,
} from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const date = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTime.format(parsed);
}

const stageLabel: Record<FinancialEventStage, string> = {
  "credito-confirmado": "Crédito bancário confirmado",
  "pagamento-informado": "Pagamento informado",
  "ordem-emitida": "Ordem emitida",
};

const stageTone: Record<FinancialEventStage, string> = {
  "credito-confirmado": "border-success/30 bg-success/8 text-success",
  "pagamento-informado": "border-primary/30 bg-primary/8 text-primary",
  "ordem-emitida": "border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-300",
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export default function AtualizacoesFinanceiras() {
  const { exercicio } = useExercicio();
  const exercise = Number(exercicio);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [stage, setStage] = useState<FinancialEventStage | "all">("all");

  const repasses = useQuery(repassesFinanceirosOptions(exercise));
  const freshness = useQuery(financialFreshnessOptions(exercise));

  const events = useMemo(
    () => buildRecentFinancialEvents(repasses.data ?? [], exercise),
    [exercise, repasses.data],
  );

  const programs = useMemo(
    () => [...new Set(events.map((event) => event.programa))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [events],
  );

  const filtered = useMemo(() => {
    const query = normalized(search.trim());
    return events.filter((event) => {
      if (program !== "all" && event.programa !== program) return false;
      if (stage !== "all" && event.stage !== stage) return false;
      if (!query) return true;
      return normalized([
        event.designacao,
        event.nome,
        event.inep ?? "",
        event.programa,
        event.acao,
        event.parcela,
      ].join(" ")).includes(query);
    });
  }, [events, program, search, stage]);

  const latestDate = events[0]?.dataEvento ?? null;
  const schools = new Set(events.map((event) => event.unidadeId)).size;
  const paymentEvents = events.filter((event) => event.stage === "pagamento-informado").length;
  const bankCredits = events.filter((event) => event.stage === "credito-confirmado").length;
  const isLoading = repasses.isLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/60 to-card/40 px-6 py-8 backdrop-blur-sm sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="ds-eyebrow">Monitoramento financeiro · exercício {exercicio}</p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Atualizações financeiras</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Fatos financeiros mais recentes encontrados pelo motor e disponibilizados no layout.
              Pagamento informado, ordem emitida e crédito bancário confirmado permanecem estados distintos.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Último evento",
                  value: latestDate ? formatDate(latestDate) : "—",
                  icon: CalendarClock,
                },
                {
                  label: "Escolas com evento",
                  value: isLoading ? "…" : String(schools),
                  icon: Landmark,
                },
                {
                  label: "Pagamentos informados",
                  value: isLoading ? "…" : String(paymentEvents),
                  icon: WalletCards,
                },
                {
                  label: "Créditos confirmados",
                  value: isLoading ? "…" : String(bankCredits),
                  icon: Database,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-background/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {item.label}
                    </p>
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>
                Snapshot corrente: {formatDateTime(freshness.data?.enginePublishedAt ?? null)}
              </span>
              <span>
                Persistência: {freshness.data?.status === "CURRENT"
                  ? "sincronizada"
                  : freshness.data?.status === "STORAGE_LAG"
                    ? "atrasada, snapshot corrente mantido no layout"
                    : "estado não comprovado"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar escola, INEP, ação ou parcela"
              className="pl-9"
            />
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger aria-label="Filtrar por programa">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os programas</SelectItem>
              {programs.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={(value) => setStage(value as FinancialEventStage | "all")}>
            <SelectTrigger aria-label="Filtrar por estágio">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estágios</SelectItem>
              <SelectItem value="pagamento-informado">Pagamento informado</SelectItem>
              <SelectItem value="ordem-emitida">Ordem emitida</SelectItem>
              <SelectItem value="credito-confirmado">Crédito bancário confirmado</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : repasses.isError ? (
          <Card>
            <CardContent className="p-6 text-sm text-destructive">
              Não foi possível consultar as fontes financeiras correntes.
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum evento financeiro corresponde aos filtros atuais.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((event) => (
              <Link
                key={event.id}
                to={`/escolas/${event.unidadeId}/recursos`}
                viewTransition
                className="group block rounded-xl border border-border/60 bg-card/55 p-4 transition-colors hover:border-primary/35 hover:bg-card/80"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("font-normal", stageTone[event.stage])}>
                        {stageLabel[event.stage]}
                      </Badge>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDate(event.dataEvento)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">
                      {event.designacao} · {event.nome}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.inep ? `INEP ${event.inep} · ` : ""}
                      {event.programa} · {event.acao} · {event.parcela}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        Valor informado
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {event.valor === null ? "—" : money.format(event.valor)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
