import { useCallback, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import {
  generateDemonstrativosLote,
  saveLoteResult,
  type CadastroPendente,
  type LoteFailure,
  type LoteProgress,
} from "@/lib/demonstrativo/generateDemonstrativosLote";

const DOC_GEN_RUNS = "document_generation_runs" as const;

type RunStatus = "em_execucao" | "concluido" | "falha" | "cancelado";

export type LoteRunMeta = {
  runId: string | null;
  persistedHistory: boolean;
  historyError?: string;
};

export type LoteState =
  | { phase: "idle"; progress: null; result: null; error: null; meta: null }
  | {
      phase: "running";
      progress: LoteProgress;
      result: null;
      error: null;
      meta: LoteRunMeta;
    }
  | {
      phase: "done";
      progress: LoteProgress;
      result: {
        totalAlvo: number;
        totalSucesso: number;
        totalFalha: number;
        failures: LoteFailure[];
        pendenciasCadastrais: CadastroPendente[];
        zipFileName: string;
      };
      error: null;
      meta: LoteRunMeta;
    }
  | {
      phase: "error";
      progress: LoteProgress | null;
      result: null;
      error: { message: string; aborted: boolean };
      meta: LoteRunMeta | null;
    };

const initialState: LoteState = {
  phase: "idle",
  progress: null,
  result: null,
  error: null,
  meta: null,
};

interface StartParams {
  unidades: UnidadeDetalhe[];
  exercicio: string;
  programa: string;
  totalCadastrado: number;
}

export function useGerarDemonstrativosLote() {
  const [state, setState] = useState<LoteState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const startRun = useCallback(
    async ({
      unidades,
      exercicio,
      programa,
      totalCadastrado,
    }: StartParams): Promise<{ id: string } | null> => {
      try {
        const exercicioInt = Number.parseInt(exercicio, 10);
        const { data, error } = await supabase
          .from(DOC_GEN_RUNS)
          .insert([
            {
              doc_type: "demonstrativo_basico_lote",
              exercicio: exercicioInt,
              programa,
              total_alvo: unidades.length,
              status: "em_execucao",
              metadata: {
                total_cadastrado: totalCadastrado,
                batch_size: 6,
                origem: "painel-gad-v1",
              },
            },
          ])
          .select("id")
          .maybeSingle();

        if (error) throw error;
        return data as { id: string } | null;
      } catch (err) {
        // Best-effort: nao impedir a geracao se a tabela ainda nao existe ou
        // se o usuario nao tem permissao. Reportamos via meta.historyError.
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) =>
          prev.phase === "running" || prev.phase === "done"
            ? {
                ...prev,
                meta: prev.meta
                  ? { ...prev.meta, persistedHistory: false, historyError: message }
                  : { runId: null, persistedHistory: false, historyError: message },
              }
            : prev,
        );
        return null;
      }
    },
    [],
  );

  const updateRun = useCallback(
    async (
      runId: string,
      patch: {
        status: RunStatus;
        total_sucesso?: number;
        total_falha?: number;
        falhas?: unknown;
        completed_at?: string | null;
      },
    ) => {
      try {
        const { error } = await supabase
          .from(DOC_GEN_RUNS)
          .update(patch)
          .eq("id", runId);
        if (error) throw error;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) =>
          prev.meta
            ? {
                ...prev,
                meta: { ...prev.meta, persistedHistory: false, historyError: message },
              }
            : prev,
        );
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(initialState);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(
    async ({ unidades, exercicio, programa, totalCadastrado }: StartParams) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const run = await startRun({ unidades, exercicio, programa, totalCadastrado });
      const runId = run?.id ?? null;

      const initialProgress: LoteProgress = {
        done: 0,
        total: unidades.length,
        currentLabel: null,
        failures: [],
      };

      setState({
        phase: "running",
        progress: initialProgress,
        result: null,
        error: null,
        meta: { runId, persistedHistory: Boolean(runId) },
      });

      try {
        const result = await generateDemonstrativosLote({
          unidades,
          exercicio,
          signal: controller.signal,
          onProgress: (progress) => {
            setState((prev) =>
              prev.phase === "running"
                ? { ...prev, progress }
                : prev,
            );
          },
        });

        await saveLoteResult(result);

        if (runId) {
          await updateRun(runId, {
            status: "concluido",
            total_sucesso: result.totalSucesso,
            total_falha: result.totalFalha,
            falhas: {
              errosGeracao: result.failures,
              pendenciasCadastrais: result.pendenciasCadastrais,
            },
            completed_at: new Date().toISOString(),
          });
        }

        setState({
          phase: "done",
          progress: {
            done: result.totalAlvo,
            total: result.totalAlvo,
            currentLabel: null,
            failures: result.failures,
          },
          result: {
            totalAlvo: result.totalAlvo,
            totalSucesso: result.totalSucesso,
            totalFalha: result.totalFalha,
            failures: result.failures,
            pendenciasCadastrais: result.pendenciasCadastrais,
            zipFileName: result.zipFileName,
          },
          error: null,
          meta: { runId, persistedHistory: Boolean(runId) },
        });
      } catch (err) {
        const aborted = controller.signal.aborted;
        const message =
          err instanceof Error ? err.message : "Erro desconhecido na geracao em lote.";

        if (runId) {
          await updateRun(runId, {
            status: aborted ? "cancelado" : "falha",
            completed_at: new Date().toISOString(),
          });
        }

        setState({
          phase: "error",
          progress: null,
          result: null,
          error: { message, aborted },
          meta: { runId, persistedHistory: Boolean(runId) },
        });
      } finally {
        abortRef.current = null;
      }
    },
    [startRun, updateRun],
  );

  return useMemo(
    () => ({
      ...state,
      start,
      cancel,
      reset,
    }),
    [state, start, cancel, reset],
  );
}
