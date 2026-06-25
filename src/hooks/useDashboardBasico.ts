import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dashboardBasicoOptions, queryKeys } from "@/lib/queryKeys";

export type { DashboardBasico } from "@/lib/queryKeys";

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
          void queryClient.invalidateQueries({
            queryKey: queryKeys.dashboardBasico(exercicioNumber, programa),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, exercicioNumber, programa]);

  return useQuery(dashboardBasicoOptions(exercicioNumber, programa));
}
