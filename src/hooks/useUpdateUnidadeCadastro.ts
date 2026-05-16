import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import {
  normalizeOptionalText,
  toUnidadesEscolaresUpdate,
  type UnidadeCadastroFormValues,
} from "@/lib/unidadeCadastro";

interface UseUpdateUnidadeCadastroParams {
  exercicio: string;
  programa: string;
}

interface UpdateUnidadeCadastroInput {
  unidadeId: string;
  bancoAtual?: string | null;
  values: UnidadeCadastroFormValues;
}

interface ContaPrincipal {
  id: string;
}

export function useUpdateUnidadeCadastro({
  exercicio,
  programa,
}: UseUpdateUnidadeCadastroParams) {
  const queryClient = useQueryClient();
  const exercicioNumber = Number.parseInt(exercicio, 10);

  return useMutation({
    mutationFn: async ({ unidadeId, bancoAtual, values }: UpdateUnidadeCadastroInput) => {
      const unidadeUpdate = toUnidadesEscolaresUpdate(values);

      const { data: contaPrincipal, error: contaError } = await supabase
        .from("contas_bancarias")
        .select("id")
        .eq("unidade_id", unidadeId)
        .order("principal", { ascending: false })
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ContaPrincipal>();

      if (contaError) {
        throw new Error(contaError.message);
      }

      const banco = normalizeOptionalText(bancoAtual ?? "");
      const contaUpdate: TablesUpdate<"contas_bancarias"> = {
        banco,
        agencia: unidadeUpdate.agencia,
        conta_corrente: unidadeUpdate.conta_corrente,
        principal: true,
      };

      const hasContaData = Boolean(
        contaUpdate.banco || contaUpdate.agencia || contaUpdate.conta_corrente,
      );

      if (contaPrincipal?.id) {
        const { error } = await supabase
          .from("contas_bancarias")
          .update(contaUpdate)
          .eq("id", contaPrincipal.id);

        if (error) {
          throw new Error(error.message);
        }
      } else if (hasContaData) {
        const { error } = await supabase
          .from("contas_bancarias")
          .insert({
            ...contaUpdate,
            unidade_id: unidadeId,
          });

        if (error) {
          throw new Error(error.message);
        }
      }

      const { error: unidadeError } = await supabase
        .from("unidades_escolares")
        .update(unidadeUpdate)
        .eq("id", unidadeId);

      if (unidadeError) {
        throw new Error(unidadeError.message);
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["unidade-detalhe", variables.unidadeId, exercicioNumber, programa],
        }),
        queryClient.invalidateQueries({ queryKey: ["unidades-localizador"] }),
      ]);
    },
  });
}
