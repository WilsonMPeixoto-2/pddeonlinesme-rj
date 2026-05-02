import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type UnidadeDetalhe = Tables<"vw_unidade_detalhe">;

interface UseUnidadeDetalheParams {
  unidadeId: string | undefined;
  exercicio: string;
  programa: string;
}

export function useUnidadeDetalhe({ unidadeId, exercicio, programa }: UseUnidadeDetalheParams) {
  const exercicioNumber = Number.parseInt(exercicio, 10);

  return useQuery<UnidadeDetalhe | null, Error>({
    queryKey: ["unidade-detalhe", unidadeId, exercicioNumber, programa],
    enabled: Boolean(unidadeId && Number.isFinite(exercicioNumber) && programa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_unidade_detalhe")
        .select(
          "unidade_id, designacao, nome, inep, cnpj, diretor, endereco, banco, agencia, conta_corrente, exercicio, programa, reprogramado_custeio, reprogramado_capital, parcela_1_custeio, parcela_1_capital, parcela_2_custeio, parcela_2_capital, total_reprogramado, total_parcelas, total_disponivel_inicial, updated_at"
        )
        .eq("unidade_id", unidadeId!)
        .eq("exercicio", exercicioNumber)
        .eq("programa", programa)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ?? null;
    },
  });
}
