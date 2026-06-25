import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type DashboardBasico = Tables<"vw_dashboard_basico">;
export type UnidadeDetalhe = Tables<"vw_unidade_detalhe">;
export type DocumentGenerationRun =
  Database["public"]["Tables"]["document_generation_runs"]["Row"];

export type UnidadeLocalizador = Tables<"vw_unidades_localizador"> & {
  id: string;
  designacao: string;
};

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

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AdminUserRow {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  roles: AppRole[];
}

export const queryKeys = {
  dashboardBasico: (exercicio: number, programa: string) =>
    ["dashboard-basico", exercicio, programa] as const,
  dashboardUnidadesResumo: () => ["dashboard-unidades-resumo"] as const,
  unidadesDetalheLista: (exercicio: number, programa: string) =>
    ["unidades-detalhe-lista", exercicio, programa] as const,
  unidadeDetalhe: (
    unidadeId: string | undefined,
    exercicio: number,
    programa: string,
  ) => ["unidade-detalhe", unidadeId, exercicio, programa] as const,
  unidadesLocalizador: () => ["unidades-localizador"] as const,
  documentGenerationRuns: {
    all: () => ["document-generation-runs"] as const,
    list: (
      limit: number,
      page: number,
      status: string | undefined,
      exercicio: string | number | undefined,
    ) => ["document-generation-runs", limit, page, status, exercicio] as const,
  },
  adminUsers: () => ["admin", "users"] as const,
};

const UNIDADE_DETALHE_COLUMNS = [
  "unidade_id",
  "designacao",
  "nome",
  "inep",
  "cnpj",
  "diretor",
  "endereco",
  "banco",
  "agencia",
  "conta_corrente",
  "exercicio",
  "programa",
  "reprogramado_custeio",
  "reprogramado_capital",
  "parcela_1_custeio",
  "parcela_1_capital",
  "parcela_2_custeio",
  "parcela_2_capital",
  "total_reprogramado",
  "total_parcelas",
  "total_disponivel_inicial",
  "updated_at",
].join(", ");

export const dashboardBasicoOptions = (exercicio: number, programa: string) =>
  queryOptions<DashboardBasico | null, Error>({
    queryKey: queryKeys.dashboardBasico(exercicio, programa),
    enabled: Number.isFinite(exercicio) && Boolean(programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_dashboard_basico")
        .select(
          "exercicio, programa, total_unidades, total_reprogramado_custeio, total_reprogramado_capital, total_reprogramado, total_parcela_1_custeio, total_parcela_1_capital, total_parcela_2_custeio, total_parcela_2_capital, total_parcelas, total_disponivel_inicial, updated_at_max",
        )
        .eq("exercicio", exercicio)
        .eq("programa", programa)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

const RECENTES_LIMIT = 5;

export const dashboardUnidadesResumoOptions = () =>
  queryOptions<DashboardUnidadesResumo, Error>({
    queryKey: queryKeys.dashboardUnidadesResumo(),
    queryFn: async () => {
      const [recentesResult, totalResult, completosResult] = await Promise.all([
        supabase
          .from("vw_unidades_localizador")
          .select("id, designacao, nome, inep, cnpj, diretor, updated_at")
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(RECENTES_LIMIT),
        supabase
          .from("vw_unidades_localizador")
          .select("id", { count: "exact", head: true }),
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
    staleTime: 0,
    refetchOnMount: "always",
  });

export const unidadesDetalheListaOptions = (
  exercicio: number,
  programa: string,
) =>
  queryOptions<UnidadeDetalhe[], Error>({
    queryKey: queryKeys.unidadesDetalheLista(exercicio, programa),
    enabled: Number.isFinite(exercicio) && Boolean(programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidade_detalhe")
        .select(UNIDADE_DETALHE_COLUMNS)
        .eq("exercicio", exercicio)
        .eq("programa", programa)
        .order("designacao", { ascending: true });

      if (error) throw new Error(error.message);
      return (data as UnidadeDetalhe[] | null) ?? [];
    },
  });

export const unidadeDetalheOptions = (
  unidadeId: string | undefined,
  exercicio: number,
  programa: string,
) =>
  queryOptions<UnidadeDetalhe | null, Error>({
    queryKey: queryKeys.unidadeDetalhe(unidadeId, exercicio, programa),
    enabled: Boolean(unidadeId && Number.isFinite(exercicio) && programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidade_detalhe")
        .select(UNIDADE_DETALHE_COLUMNS)
        .eq("unidade_id", unidadeId!)
        .eq("exercicio", exercicio)
        .eq("programa", programa)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },
  });

export const unidadesLocalizadorOptions = () =>
  queryOptions<UnidadeLocalizador[], Error>({
    queryKey: queryKeys.unidadesLocalizador(),
    queryFn: async () => {
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

interface DocumentGenerationRunsParams {
  limit?: number;
  page?: number;
  status?: string;
  exercicio?: string | number;
}

export const documentGenerationRunsOptions = ({
  limit = 10,
  page = 1,
  status,
  exercicio,
}: DocumentGenerationRunsParams = {}) =>
  queryOptions<{ runs: DocumentGenerationRun[]; count: number }, Error>({
    queryKey: queryKeys.documentGenerationRuns.list(
      limit,
      page,
      status,
      exercicio,
    ),
    queryFn: async () => {
      let query = supabase
        .from("document_generation_runs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (exercicio && exercicio !== "all") {
        const exVal =
          typeof exercicio === "string" ? parseInt(exercicio, 10) : exercicio;
        if (!isNaN(exVal)) {
          query = query.eq("exercicio", exVal);
        }
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        runs: (data as DocumentGenerationRun[] | null) ?? [],
        count: count ?? 0,
      };
    },
  });

export const adminUsersOptions = () =>
  queryOptions<AdminUserRow[], Error>({
    queryKey: queryKeys.adminUsers(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admin_users");
      if (error) throw new Error(error.message);
      if (!Array.isArray(data)) return [];

      return data.map((row) => {
        const r = row as {
          user_id: string;
          email: string;
          created_at: string;
          last_sign_in_at: string | null;
          email_confirmed_at: string | null;
          roles: string[] | null;
        };

        return {
          user_id: r.user_id,
          email: r.email,
          created_at: r.created_at,
          last_sign_in_at: r.last_sign_in_at,
          email_confirmed_at: r.email_confirmed_at,
          roles: (r.roles ?? []).filter(
            (role): role is AppRole =>
              role === "admin" || role === "operador",
          ),
        };
      });
    },
  });
