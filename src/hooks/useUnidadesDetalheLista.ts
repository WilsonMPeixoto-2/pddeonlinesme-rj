import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { unidadesDetalheListaOptions } from "@/lib/queryKeys";
import type { UnidadeDetalhe } from "@/lib/queryKeys";

export type { UnidadeDetalhe } from "@/lib/queryKeys";

interface UseUnidadesDetalheListaParams {
  exercicio: string;
  programa: string;
}

export interface UnidadesDetalheStats {
  total: number;
  comDadosFinanceiros: number;
  semDadosFinanceiros: number;
  totalReprogramado: number;
  totalParcelas: number;
  totalDisponivelInicial: number;
}

export function useUnidadesDetalheLista({
  exercicio,
  programa,
}: UseUnidadesDetalheListaParams) {
  const exercicioInt = Number.parseInt(exercicio, 10);

  const query = useQuery(unidadesDetalheListaOptions(exercicioInt, programa));

  const stats: UnidadesDetalheStats | null = useMemo(() => {
    if (!query.data) return null;

    let totalReprogramado = 0;
    let totalParcelas = 0;
    let totalDisponivelInicial = 0;
    let comDados = 0;

    for (const u of query.data) {
      const reprog = u.total_reprogramado ?? 0;
      const parcelas = u.total_parcelas ?? 0;
      const disp = u.total_disponivel_inicial ?? 0;

      totalReprogramado += reprog;
      totalParcelas += parcelas;
      totalDisponivelInicial += disp;

      if (disp > 0 || reprog > 0 || parcelas > 0) comDados += 1;
    }

    return {
      total: query.data.length,
      comDadosFinanceiros: comDados,
      semDadosFinanceiros: query.data.length - comDados,
      totalReprogramado,
      totalParcelas,
      totalDisponivelInicial,
    };
  }, [query.data]);

  const topReprogramados = useMemo(() => {
    if (!query.data) return [];
    return [...query.data]
      .filter((u) => (u.total_reprogramado ?? 0) > 0)
      .sort((a, b) => (b.total_reprogramado ?? 0) - (a.total_reprogramado ?? 0))
      .slice(0, 5);
  }, [query.data]);

  return {
    ...query,
    stats,
    topReprogramados,
  };
}
