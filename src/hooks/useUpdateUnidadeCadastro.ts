import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import type { UnidadeLocalizador } from "@/hooks/useUnidadesLocalizador";
import {
  normalizeOptionalText,
  normalizeRequiredText,
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

  return useMutation<string, Error, UpdateUnidadeCadastroInput, OptimisticSnapshot>({
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
    // Salvamento atomico via RPC public.update_unidade_cadastro_minima
    // (migration 20260516120000). A RPC atualiza unidades_escolares e
    // contas_bancarias em uma unica transacao, eliminando o risco de estado
    // parcial que existia no fluxo anterior de duas escritas sequenciais.
    mutationFn: async ({ unidadeId, values }: UpdateUnidadeCadastroInput) => {
      const { data, error } = await supabase.rpc(
        "update_unidade_cadastro_minima",
        {
          p_unidade_id: unidadeId,
          p_nome: normalizeRequiredText(values.nome),
          p_diretor: normalizeOptionalText(values.diretor),
          p_endereco: normalizeOptionalText(values.endereco),
          p_banco: normalizeOptionalText(values.banco),
          p_agencia: normalizeOptionalText(values.agencia),
          p_conta_corrente: normalizeOptionalText(values.conta_corrente),
        },
      );

      if (error) {
        // A RPC traduz cenarios de falha em mensagens claras:
        // - 42501 (insufficient_privilege): role admin/operador ausente
        // - P0002 (no_data_found): unidade nao encontrada
        // - outras: rollback automatico pela transacao SQL
        throw new Error(error.message);
      }

      if (!data) {
        // Defensivo: RPC bem-sucedida deve sempre retornar o unidade_id.
        // Cobre o caso (improvavel) de RLS filtrar o retorno mesmo apos COMMIT.
        throw new Error(
          "Salvamento nao confirmado. Verifique sua sessao ou tente novamente.",
        );
      }

      return data;
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
