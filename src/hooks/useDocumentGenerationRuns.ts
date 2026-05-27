import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DocumentGenerationRun =
  Database["public"]["Tables"]["document_generation_runs"]["Row"];

export type DocumentGenerationRunStatus = "em_execucao" | "concluido" | "falha" | "cancelado";

interface UseDocumentGenerationRunsParams {
  limit?: number;
}

export function useDocumentGenerationRuns({
  limit = 10,
}: UseDocumentGenerationRunsParams = {}) {
  return useQuery<DocumentGenerationRun[], Error>({
    queryKey: ["document-generation-runs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_generation_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as DocumentGenerationRun[] | null) ?? [];
    },
  });
}
