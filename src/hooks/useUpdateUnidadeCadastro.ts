import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import {
  toContasBancariasUpdate,
  toUnidadesEscolaresUpdate,
  type UnidadeCadastroFormValues,
} from "@/lib/unidadeCadastro";

interface UseUpdateUnidadeCadastroParams {
  exercicio: string;
  programa: string;
}

interface UpdateUnidadeCadastroInput {
  unidadeId: string;
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
    mutationFn: async ({ unidadeId, values }: UpdateUnidadeCadastroInput) => {
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

      const contaUpdate: TablesUpdate<"contas_bancarias"> = {
        ...toContasBancariasUpdate(values),
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

      // TODO(Marco 6B): registrar alteracoes cadastrais em audit_logs quando
      // houver identidade institucional do revisor e trilha de auditoria real.
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
