import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DashboardBasico = Tables<"vw_dashboard_basico">;

interface UseDashboardBasicoParams {
  exercicio: string;
  programa?: string;
}

/**
 * Marco 9B: indicadores agregados do Dashboard a partir de public.vw_dashboard_basico.
 *
 * Retorna totais de unidades, reprogramado (custeio/capital), parcelas e
 * disponível inicial do exercício/programa selecionado. Não consulta
 * unidades_escolares diretamente.
 *
 * Observação institucional: total_parcelas pode legitimamente ser 0 quando
 * a BASE importada não traz valores lançados nas colunas de parcelas.
 */
export function useDashboardBasico({
  exercicio,
  programa = "basico",
}: UseDashboardBasicoParams) {
  const exercicioNumber = Number.parseInt(exercicio, 10);

  return useQuery<DashboardBasico | null, Error>({
    queryKey: ["dashboard-basico", exercicioNumber, programa],
    enabled: Number.isFinite(exercicioNumber) && Boolean(programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_dashboard_basico")
        .select(
          "exercicio, programa, total_unidades, total_reprogramado_custeio, total_reprogramado_capital, total_reprogramado, total_parcelas, total_disponivel_inicial, updated_at_max",
        )
        .eq("exercicio", exercicioNumber)
        .eq("programa", programa)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },
  });
}
