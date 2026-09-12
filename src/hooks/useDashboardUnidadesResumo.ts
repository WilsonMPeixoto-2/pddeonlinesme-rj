import { useQuery } from "@tanstack/react-query";
import { dashboardUnidadesResumoOptions } from "@/lib/queryKeys";

export type {
  DashboardUnidadeResumo,
  DashboardUnidadesResumo,
} from "@/lib/queryKeys";

/**
 * Resumo cadastral do Dashboard a partir de public.vw_unidades_localizador.
 *
 * A carteira da 4ª CRE é pequena e predominantemente estática. Uma única
 * leitura consolidada substitui as três chamadas anteriores (lista recente +
 * dois COUNT exact), e o React Query mantém o resultado fresco por 15 minutos.
 * O resumo e os cinco registros recentes são derivados em memória.
 */
export function useDashboardUnidadesResumo() {
  return useQuery(dashboardUnidadesResumoOptions());
}
