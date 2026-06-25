import { useQuery } from "@tanstack/react-query";
import { dashboardUnidadesResumoOptions } from "@/lib/queryKeys";

export type {
  DashboardUnidadeResumo,
  DashboardUnidadesResumo,
} from "@/lib/queryKeys";

/**
 * Marco 9B: resumo das unidades para o Dashboard a partir de
 * public.vw_unidades_localizador.
 *
 * Usa três queries paralelas para minimizar payload e latência:
 *   1. 5 mais recentes por updated_at (limit server-side).
 *   2. Contagem total via HEAD (sem transferência de linhas).
 *   3. Contagem de cadastros completos (INEP + CNPJ + diretor não-nulos) via HEAD.
 *
 * Não consulta unidades_escolares diretamente.
 */
export function useDashboardUnidadesResumo() {
  return useQuery(dashboardUnidadesResumoOptions());
}
