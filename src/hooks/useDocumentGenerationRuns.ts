import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { documentGenerationRunsOptions, queryKeys } from "@/lib/queryKeys";

export type { DocumentGenerationRun } from "@/lib/queryKeys";

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
          void queryClient.invalidateQueries({
            queryKey: queryKeys.documentGenerationRuns.all(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery(
    documentGenerationRunsOptions({ limit, page, status, exercicio }),
  );
}
