import { ArrowLeft, Landmark, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import AppLayout from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { RecursosPDDEPanel } from "@/components/RecursosPDDEPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { financeiroUnidadeOptions } from "@/lib/queryKeys";

export default function EscolaRecursos() {
  const { id } = useParams();
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);

  const {
    data: unidade,
    isLoading: loadingUnidade,
  } = useUnidadeDetalhe({
    unidadeId: id,
    exercicio,
    programa: "basico",
  });

  const financeiro = useQuery(financeiroUnidadeOptions(id, exercicioNumero));

  const title =
    unidade?.nome ||
    unidade?.designacao ||
    financeiro.data?.repasses[0]?.nome ||
    financeiro.data?.repasses[0]?.designacao ||
    "Unidade escolar";

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Navegação estrutural">
            <Link
              to={id ? `/escolas/${id}` : "/escolas"}
              viewTransition
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Ficha da unidade
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium text-foreground">Recursos PDDE</span>
          </nav>

          <Button
            size="sm"
            variant="outline"
            onClick={() => financeiro.refetch()}
            disabled={financeiro.isFetching}
            aria-busy={financeiro.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${financeiro.isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
        </div>

        <header className="border-b border-border/60 pb-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Recursos PDDE · {exercicio}
              </p>
              {loadingUnidade ? (
                <Skeleton className="mt-2 h-8 w-72 max-w-full" />
              ) : (
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
              )}
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Contas, ações, parcelas, valores e datas disponíveis para a unidade no exercício selecionado.
              </p>
            </div>
          </div>
        </header>

        {financeiro.isError ? (
          <EmptyState
            icon={Landmark}
            title="Não foi possível carregar os recursos da unidade"
            description={financeiro.error.message}
            action={
              <Button onClick={() => financeiro.refetch()} disabled={financeiro.isFetching}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <RecursosPDDEPanel
            programas={financeiro.data?.programas ?? []}
            isLoading={financeiro.isLoading}
          />
        )}
      </div>
    </AppLayout>
  );
}
