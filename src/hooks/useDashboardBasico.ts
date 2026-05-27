import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DashboardBasico = Tables<"vw_dashboard_basico">;

interface UseDashboardBasicoParams {
  exercicio: string;
  programa?: string;
}

export function useDashboardBasico({
  exercicio,
  programa = "basico",
}: UseDashboardBasicoParams) {
  const exercicioNumber = Number.parseInt(exercicio, 10);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-finance-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "execucao_financeira" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-basico", exercicioNumber, programa] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, exercicioNumber, programa]);

  return useQuery<DashboardBasico | null, Error>({
    queryKey: ["dashboard-basico", exercicioNumber, programa],
    enabled: Number.isFinite(exercicioNumber) && Boolean(programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_dashboard_basico")
        .select(
          "exercicio, programa, total_unidades, total_reprogramado_custeio, total_reprogramado_capital, total_reprogramado, total_parcela_1_custeio, total_parcela_1_capital, total_parcela_2_custeio, total_parcela_2_capital, total_parcelas, total_disponivel_inicial, updated_at_max",
        )
        .eq("exercicio", exercicioNumber)
        .eq("programa", programa)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}
