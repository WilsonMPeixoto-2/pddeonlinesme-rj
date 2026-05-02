import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UnidadeLocalizador =
  Database["public"]["Views"]["vw_unidades_localizador"]["Row"];

export function useUnidadesLocalizador() {
  return useQuery({
    queryKey: ["unidades-localizador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidades_localizador")
        .select("*")
        .order("designacao");

      if (error) {
        throw new Error(error.message);
      }

      return data ?? [];
    },
  });
}
