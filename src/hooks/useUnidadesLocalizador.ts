import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Foundation v1: id e designacao sao NOT NULL na tabela-base (PK + UNIQUE INDEX),
// mas o gerador de types os marca nullable porque a view nao redeclara constraints.
// Filtramos no boundary do fetch para um tipo seguro a jusante.
export type UnidadeLocalizador = Tables<"vw_unidades_localizador"> & {
  id: string;
  designacao: string;
};

/**
 * Lista todas as unidades escolares para o localizador /escolas.
 * Le de public.vw_unidades_localizador (Foundation v1).
 *
 * Nao traz dados financeiros nem bancarios — esses ficam na pagina individual
 * via vw_unidade_detalhe.
 */
export function useUnidadesLocalizador() {
  return useQuery<UnidadeLocalizador[], Error>({
    queryKey: ["unidades-localizador"],
    queryFn: async (): Promise<UnidadeLocalizador[]> => {
      const { data, error } = await supabase
        .from("vw_unidades_localizador")
        .select("id, designacao, nome, inep, cnpj, diretor")
        .order("designacao");
      if (error) {
        throw new Error(error.message);
      }
      return (data ?? []).filter(
        (u): u is UnidadeLocalizador =>
          u.id !== null && u.designacao !== null,
      );
    },
  });
}
