import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { parseSpreadsheet, BulkUpdateParseError } from "@/lib/bulk-update/parseSpreadsheet";
import { buildBulkUpdatePreview, inspectColumns } from "@/lib/bulk-update/buildBulkUpdatePreview";
import { sha256Hex } from "@/lib/bulk-update/sha256";
import type {
  BulkUpdateAllowedKey,
  BulkUpdatePreview,
  ApplyPartialBulkUpdateItem,
  ApplyPartialBulkUpdateResponse,
  ParsedSpreadsheet,
  RecognizedColumn,
} from "@/lib/bulk-update/types";

export type BulkUpdatePhase =
  | "idle"
  | "parsing"
  | "mapping_required"
  | "preview_loading"
  | "preview_ready"
  | "applying"
  | "done"
  | "error";

export type BulkUpdateState = {
  phase: BulkUpdatePhase;
  fileName: string | null;
  fileHash: string | null;
  parsed: ParsedSpreadsheet | null;
  recognizedColumns: RecognizedColumn[];
  availableKeys: BulkUpdateAllowedKey[];
  chosenKey: BulkUpdateAllowedKey | null;
  preview: BulkUpdatePreview | null;
  applyResult: ApplyPartialBulkUpdateResponse | null;
  affectedUnitIds: string[];
  errorMessage: string | null;
};

const INITIAL: BulkUpdateState = {
  phase: "idle",
  fileName: null,
  fileHash: null,
  parsed: null,
  recognizedColumns: [],
  availableKeys: [],
  chosenKey: null,
  preview: null,
  applyResult: null,
  affectedUnitIds: [],
  errorMessage: null,
};

export function useBulkUpdate() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BulkUpdateState>(INITIAL);

  const reset = useCallback(() => {
    setState(INITIAL);
  }, []);

  const setError = useCallback((message: string) => {
    setState((prev) => ({ ...prev, phase: "error", errorMessage: message }));
  }, []);

  const loadPreview = useCallback(
    async (parsed: ParsedSpreadsheet, chosenKey: BulkUpdateAllowedKey) => {
      setState((prev) => ({
        ...prev,
        phase: "preview_loading",
        chosenKey,
        errorMessage: null,
      }));
      try {
        const preview = await buildBulkUpdatePreview({ parsed, chosenKey });
        setState((prev) => ({
          ...prev,
          phase: "preview_ready",
          preview,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao montar a prévia.";
        setError(message);
      }
    },
    [setError],
  );

  const acceptFile = useCallback(
    async (file: File) => {
      setState({
        ...INITIAL,
        phase: "parsing",
        fileName: file.name,
      });

      try {
        const parsed = await parseSpreadsheet(file);
        const buffer = await file.arrayBuffer();
        const hash = await sha256Hex(buffer);

        const { recognizedColumns, availableKeys, fieldColumn } = inspectColumns(parsed);

        if (availableKeys.length === 0) {
          setError(
            "A planilha precisa conter ao menos uma coluna de chave reconhecida (designação, INEP ou CNPJ).",
          );
          return;
        }

        if (!fieldColumn) {
          setError(
            'A planilha precisa conter uma coluna "diretor" (ou alias) para que algo seja atualizado.',
          );
          return;
        }

        const initialKey: BulkUpdateAllowedKey | null =
          availableKeys.length === 1 ? availableKeys[0] : null;

        setState({
          phase: initialKey ? "preview_loading" : "mapping_required",
          fileName: file.name,
          fileHash: hash,
          parsed,
          recognizedColumns,
          availableKeys,
          chosenKey: initialKey,
          preview: null,
          applyResult: null,
          affectedUnitIds: [],
          errorMessage: null,
        });

        if (initialKey) {
          await loadPreview(parsed, initialKey);
        }
      } catch (err) {
        const message =
          err instanceof BulkUpdateParseError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Falha ao processar planilha.";
        setError(message);
      }
    },
    [setError, loadPreview],
  );

  const chooseKey = useCallback(
    async (key: BulkUpdateAllowedKey) => {
      if (!state.parsed) return;
      await loadPreview(state.parsed, key);
    },
    [state.parsed, loadPreview],
  );

  const apply = useCallback(async () => {
    if (!state.preview || !state.fileName || !state.fileHash) return;
    const readyItems: ApplyPartialBulkUpdateItem[] = state.preview.items
      .filter((i) => i.status === "ready" && i.unidadeId)
      .map((i) => ({
        rowNumber: i.rowNumber,
        unidadeId: i.unidadeId as string,
        field: i.field,
        newValue: i.newValue,
        keyType: i.keyType,
        keyValue: i.keyValue,
      }));

    if (readyItems.length === 0) {
      setError("Nenhuma linha pronta para aplicar.");
      return;
    }

    setState((prev) => ({ ...prev, phase: "applying", errorMessage: null }));

    try {
      const { data, error } = await supabase.rpc("apply_partial_bulk_update", {
        p_file_name: state.fileName,
        p_file_hash: state.fileHash,
        p_items: readyItems as unknown as never, // typed Json
      });

      if (error) throw new Error(error.message);

      const result = data as unknown as ApplyPartialBulkUpdateResponse;
      const affectedUnitIds = readyItems.map((i) => i.unidadeId);

      setState((prev) => ({
        ...prev,
        phase: "done",
        applyResult: result,
        affectedUnitIds,
      }));

      // Invalida caches que dependem de diretor / unidades.
      void queryClient.invalidateQueries({ queryKey: ["unidade-detalhe"] });
      void queryClient.invalidateQueries({ queryKey: ["unidades-localizador"] });
      void queryClient.invalidateQueries({ queryKey: ["unidades-detalhe-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["document-generation-runs"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao aplicar atualizações.";
      setError(message);
    }
  }, [state.preview, state.fileName, state.fileHash, queryClient, setError]);

  return {
    state,
    acceptFile,
    chooseKey,
    apply,
    reset,
  };
}
