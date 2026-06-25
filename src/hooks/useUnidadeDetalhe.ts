import { useQuery } from "@tanstack/react-query";
import { unidadeDetalheOptions } from "@/lib/queryKeys";

export type { UnidadeDetalhe } from "@/lib/queryKeys";

interface UseUnidadeDetalheParams {
  unidadeId: string | undefined;
  exercicio: string;
  programa: string;
}

export function useUnidadeDetalhe({ unidadeId, exercicio, programa }: UseUnidadeDetalheParams) {
  const exercicioNumber = Number.parseInt(exercicio, 10);

  return useQuery(unidadeDetalheOptions(unidadeId, exercicioNumber, programa));
}
