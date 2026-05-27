import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

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

  const query = useQuery<UnidadeDetalhe[], Error>({
    queryKey: ["unidades-detalhe-lista", exercicioInt, programa],
    enabled: Number.isFinite(exercicioInt) && Boolean(programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidade_detalhe")
        .select(
          "unidade_id, designacao, nome, inep, cnpj, diretor, endereco, banco, agencia, conta_corrente, exercicio, programa, reprogramado_custeio, reprogramado_capital, parcela_1_custeio, parcela_1_capital, parcela_2_custeio, parcela_2_capital, total_reprogramado, total_parcelas, total_disponivel_inicial, updated_at",
        )
        .eq("exercicio", exercicioInt)
        .eq("programa", programa)
        .order("designacao", { ascending: true });

      if (error) throw new Error(error.message);
      return (data as UnidadeDetalhe[] | null) ?? [];
    },
  });

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
