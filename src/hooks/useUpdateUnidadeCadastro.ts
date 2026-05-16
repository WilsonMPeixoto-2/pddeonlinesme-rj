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
        const { data: contaAtualizada, error } = await supabase
          .from("contas_bancarias")
          .update(contaUpdate)
          .eq("id", contaPrincipal.id)
          .select("id");

        if (error) {
          throw new Error(error.message);
        }
        // RLS pode filtrar UPDATE silenciosamente (HTTP 200 com array vazio)
        // se o usuario nao tiver role admin/operador em user_roles.
        if (!contaAtualizada || contaAtualizada.length === 0) {
          throw new Error(
            "Conta bancaria nao pode ser atualizada. Verifique se sua sessao tem permissao (role operador ou admin).",
          );
        }
      } else if (hasContaData) {
        const { data: contaCriada, error } = await supabase
          .from("contas_bancarias")
          .insert({
            ...contaUpdate,
            unidade_id: unidadeId,
          })
          .select("id");

        if (error) {
          throw new Error(error.message);
        }
        if (!contaCriada || contaCriada.length === 0) {
          throw new Error(
            "Conta bancaria nao pode ser criada. Verifique se sua sessao tem permissao (role operador ou admin).",
          );
        }
      }

      const { data: unidadeAtualizada, error: unidadeError } = await supabase
        .from("unidades_escolares")
        .update(unidadeUpdate)
        .eq("id", unidadeId)
        .select("id");

      if (unidadeError) {
        throw new Error(unidadeError.message);
      }
      // RLS pode filtrar UPDATE silenciosamente. Sem essa verificacao,
      // o frontend mostraria sucesso enquanto nada foi salvo.
      if (!unidadeAtualizada || unidadeAtualizada.length === 0) {
        throw new Error(
          "Unidade escolar nao pode ser atualizada. Verifique se sua sessao tem permissao (role operador ou admin).",
        );
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
