import { useQuery } from "@tanstack/react-query";
import { unidadesLocalizadorOptions } from "@/lib/queryKeys";

export type { UnidadeLocalizador } from "@/lib/queryKeys";

/**
 * Lista todas as unidades escolares para o localizador /escolas.
 * Le de public.vw_unidades_localizador (Foundation v1).
 *
 * Nao traz dados financeiros nem bancarios — esses ficam na pagina individual
 * via vw_unidade_detalhe.
 */
export function useUnidadesLocalizador() {
  return useQuery(unidadesLocalizadorOptions());
}
