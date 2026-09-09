import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, WalletCards } from "lucide-react";

import { RecursosPDDEPanel } from "@/components/RecursosPDDEPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useExercicio } from "@/hooks/useExercicio";
import { financeiroUnidadeOptions } from "@/lib/queryKeys";
import EscolaEditar from "./EscolaEditar";

export default function EscolaEditarComRecursos() {
  const { id } = useParams();
  const { exercicio } = useExercicio();
  const [open, setOpen] = useState(false);
  const exercicioNumero = Number(exercicio);

  const financeiro = useQuery({
    ...financeiroUnidadeOptions(id, exercicioNumero),
    enabled: open && Boolean(id) && Number.isFinite(exercicioNumero),
  });

  return (
    <>
      <EscolaEditar />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-5 right-5 z-40 shadow-lg"
            aria-label="Abrir Recursos PDDE desta unidade"
          >
            <WalletCards className="mr-2 h-4 w-4" aria-hidden="true" />
            Recursos PDDE
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[96vw] overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>Recursos PDDE · {exercicio}</SheetTitle>
            <SheetDescription>
              Contas, ações, parcelas, valores e datas disponíveis para esta unidade.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            <RecursosPDDEPanel
              programas={financeiro.data?.programas ?? []}
              isLoading={financeiro.isLoading}
              error={financeiro.isError ? financeiro.error.message : null}
            />
          </div>

          {id ? (
            <div className="mt-5 border-t border-border/60 pt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to={`/escolas/${id}/recursos`} viewTransition>
                  Abrir visão completa
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
