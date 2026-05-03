import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Foundation v1: id e designacao sao NOT NULL na tabela-base (PK + UNIQUE INDEX),
// mas o gerador de types os marca nullable porque a view nao redeclara constraints.
// Filtramos no boundary do fetch para um tipo seguro a jusante.
export type DashboardUnidadeResumo = Tables<"vw_unidades_localizador"> & {
  id: string;
  designacao: string;
};

export interface DashboardUnidadesResumo {
  total: number;
  recentes: DashboardUnidadeResumo[];
  cadastroCompletoCount: number;
  cadastroIncompletoCount: number;
}

const RECENTES_LIMIT = 5;

const isPreenchido = (value: string | null | undefined) =>
  Boolean(value && value.trim());

/**
 * Marco 9B: resumo das unidades para o Dashboard a partir de
 * public.vw_unidades_localizador.
 *
 * Calcula:
 *   - total de unidades cadastradas;
 *   - 5 mais recentes por updated_at;
 *   - quantos cadastros estão completos (INEP + CNPJ + diretor preenchidos)
 *     vs. incompletos.
 *
 * Não consulta unidades_escolares diretamente.
 */
export function useDashboardUnidadesResumo() {
  return useQuery<DashboardUnidadesResumo, Error>({
    queryKey: ["dashboard-unidades-resumo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidades_localizador")
        .select("id, designacao, nome, inep, cnpj, diretor, updated_at")
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const unidades = (data ?? []).filter(
        (u): u is DashboardUnidadeResumo =>
          u.id !== null && u.designacao !== null,
      );

      const recentes = unidades.slice(0, RECENTES_LIMIT);

      let cadastroCompletoCount = 0;
      for (const u of unidades) {
        if (
          isPreenchido(u.inep) &&
          isPreenchido(u.cnpj) &&
          isPreenchido(u.diretor)
        ) {
          cadastroCompletoCount += 1;
        }
      }

      return {
        total: unidades.length,
        recentes,
        cadastroCompletoCount,
        cadastroIncompletoCount: unidades.length - cadastroCompletoCount,
      };
    },
  });
}
