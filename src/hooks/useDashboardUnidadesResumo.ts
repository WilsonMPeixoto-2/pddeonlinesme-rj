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
  return useQuery<DashboardUnidadesResumo, Error>({
    queryKey: ["dashboard-unidades-resumo"],
    queryFn: async () => {
      const [recentesResult, totalResult, completosResult] = await Promise.all([
        // 1. 5 mais recentes (apenas o necessário para exibição)
        supabase
          .from("vw_unidades_localizador")
          .select("id, designacao, nome, inep, cnpj, diretor, updated_at")
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(RECENTES_LIMIT),

        // 2. Total de unidades (HEAD — sem transferência de linhas)
        supabase
          .from("vw_unidades_localizador")
          .select("id", { count: "exact", head: true }),

        // 3. Cadastros completos: INEP + CNPJ + diretor todos não-nulos (HEAD)
        //    Nota: a verificação é de valor não-nulo; strings vazias devem
        //    ser normalizadas para null pelo importador da BASE.
        supabase
          .from("vw_unidades_localizador")
          .select("id", { count: "exact", head: true })
          .not("inep", "is", null)
          .not("cnpj", "is", null)
          .not("diretor", "is", null),
      ]);

      if (recentesResult.error) throw new Error(recentesResult.error.message);
      if (totalResult.error) throw new Error(totalResult.error.message);
      if (completosResult.error) throw new Error(completosResult.error.message);

      const recentes = (recentesResult.data ?? []).filter(
        (u): u is DashboardUnidadeResumo =>
          u.id !== null && u.designacao !== null,
      );

      const total = totalResult.count ?? 0;
      const cadastroCompletoCount = completosResult.count ?? 0;

      return {
        total,
        recentes,
        cadastroCompletoCount,
        cadastroIncompletoCount: total - cadastroCompletoCount,
      };
    },
  });
}
