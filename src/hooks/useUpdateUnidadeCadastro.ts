import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import type { UnidadeLocalizador } from "@/hooks/useUnidadesLocalizador";
import {
  normalizeOptionalText,
  normalizeRequiredText,
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

interface OptimisticSnapshot {
  detalheKey: readonly [string, string, number, string];
  detalheBefore: UnidadeDetalhe | null | undefined;
  localizadorBefore: UnidadeLocalizador[] | undefined;
}

export function useUpdateUnidadeCadastro({
  exercicio,
  programa,
}: UseUpdateUnidadeCadastroParams) {
  const queryClient = useQueryClient();
  const exercicioNumber = Number.parseInt(exercicio, 10);

  return useMutation<void, Error, UpdateUnidadeCadastroInput, OptimisticSnapshot>({
    // Optimistic UI: aplica novos valores no cache antes do servidor confirmar,
    // melhorando a percepcao de velocidade na edicao cadastral. Se a mutacao
    // falhar, onError restaura o snapshot anterior.
    onMutate: async ({ unidadeId, values }) => {
      const detalheKey = [
        "unidade-detalhe",
        unidadeId,
        exercicioNumber,
        programa,
      ] as const;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: detalheKey }),
        queryClient.cancelQueries({ queryKey: ["unidades-localizador"] }),
      ]);

      const detalheBefore = queryClient.getQueryData<UnidadeDetalhe | null>(detalheKey);
      const localizadorBefore = queryClient.getQueryData<UnidadeLocalizador[]>([
        "unidades-localizador",
      ]);

      const nome = normalizeRequiredText(values.nome);
      const diretor = normalizeOptionalText(values.diretor);
      const endereco = normalizeOptionalText(values.endereco);
      const banco = normalizeOptionalText(values.banco);
      const agencia = normalizeOptionalText(values.agencia);
      const contaCorrente = normalizeOptionalText(values.conta_corrente);

      if (detalheBefore) {
        queryClient.setQueryData<UnidadeDetalhe>(detalheKey, {
          ...detalheBefore,
          nome,
          diretor,
          endereco,
          banco: banco ?? detalheBefore.banco,
          agencia,
          conta_corrente: contaCorrente,
          updated_at: new Date().toISOString(),
        });
      }

      if (localizadorBefore) {
        queryClient.setQueryData<UnidadeLocalizador[]>(
          ["unidades-localizador"],
          localizadorBefore.map((row) =>
            row.id === unidadeId
              ? { ...row, nome, diretor }
              : row,
          ),
        );
      }

      return { detalheKey, detalheBefore, localizadorBefore };
    },
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
    onError: (_error, _variables, context) => {
      if (!context) return;
      // Rollback do optimistic update: restaura snapshot anterior.
      if (context.detalheBefore !== undefined) {
        queryClient.setQueryData(context.detalheKey, context.detalheBefore);
      }
      if (context.localizadorBefore !== undefined) {
        queryClient.setQueryData(
          ["unidades-localizador"],
          context.localizadorBefore,
        );
      }
    },
    onSettled: async (_data, _error, variables) => {
      // Garante reconciliacao com o servidor apos sucesso ou rollback.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["unidade-detalhe", variables.unidadeId, exercicioNumber, programa],
        }),
        queryClient.invalidateQueries({ queryKey: ["unidades-localizador"] }),
      ]);
    },
  });
}
