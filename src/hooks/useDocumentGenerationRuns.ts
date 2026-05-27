import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DocumentGenerationRun =
  Database["public"]["Tables"]["document_generation_runs"]["Row"];

export type DocumentGenerationRunStatus = "em_execucao" | "concluido" | "falha" | "cancelado";

interface UseDocumentGenerationRunsParams {
  limit?: number;
  page?: number;
  status?: string;
  exercicio?: string | number;
}

export function useDocumentGenerationRuns({
  limit = 10,
  page = 1,
  status,
  exercicio,
}: UseDocumentGenerationRunsParams = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("document-runs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_generation_runs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["document-generation-runs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<{ runs: DocumentGenerationRun[]; count: number }, Error>({
    queryKey: ["document-generation-runs", limit, page, status, exercicio],
    queryFn: async () => {
      let query = supabase
        .from("document_generation_runs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (exercicio && exercicio !== "all") {
        const exVal = typeof exercicio === "string" ? parseInt(exercicio, 10) : exercicio;
        if (!isNaN(exVal)) {
          query = query.eq("exercicio", exVal);
        }
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        runs: (data as DocumentGenerationRun[] | null) ?? [],
        count: count ?? 0,
      };
    },
  });
}
