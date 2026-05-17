import JSZip from "jszip";
import { saveAs } from "file-saver";

import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { generateDemonstrativoBasico } from "./generateDemonstrativoBasico";

export type LoteFailure = {
  unidadeId: string;
  designacao: string;
  message: string;
};

export type LoteProgress = {
  done: number;
  total: number;
  currentLabel: string | null;
  failures: LoteFailure[];
};

export type LoteResult = {
  zipBlob: Blob;
  zipFileName: string;
  totalAlvo: number;
  totalSucesso: number;
  totalFalha: number;
  failures: LoteFailure[];
};

export interface GenerateDemonstrativosLoteOptions {
  unidades: UnidadeDetalhe[];
  exercicio: string;
  signal?: AbortSignal;
  onProgress?: (progress: LoteProgress) => void;
  batchSize?: number;
  zipFileNameOverride?: string;
}

const DEFAULT_BATCH_SIZE = 6;

class LoteAbortError extends Error {
  constructor() {
    super("Geracao em lote cancelada pelo usuario.");
    this.name = "LoteAbortError";
  }
}

function buildZipFileName(exercicio: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .replace(/\..+$/, "");
  return `Demonstrativos_Basicos_4CRE_${exercicio}_${timestamp}.zip`;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function generateDemonstrativosLote({
  unidades,
  exercicio,
  signal,
  onProgress,
  batchSize = DEFAULT_BATCH_SIZE,
  zipFileNameOverride,
}: GenerateDemonstrativosLoteOptions): Promise<LoteResult> {
  if (signal?.aborted) throw new LoteAbortError();

  const total = unidades.length;
  if (total === 0) {
    throw new Error("Nenhuma unidade elegivel para geracao em lote.");
  }

  const zip = new JSZip();
  const folderName = `Demonstrativos_Basicos_${exercicio}`;
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("Nao foi possivel criar pasta no arquivo .zip.");
  }

  const failures: LoteFailure[] = [];
  let done = 0;

  onProgress?.({ done, total, currentLabel: null, failures });

  const batches = chunk(unidades, batchSize);

  for (const batch of batches) {
    if (signal?.aborted) throw new LoteAbortError();

    await Promise.all(
      batch.map(async (unidade) => {
        if (signal?.aborted) return;

        const label = unidade.designacao ?? unidade.nome ?? unidade.unidade_id ?? "Unidade";

        try {
          const { blob, fileName } = await generateDemonstrativoBasico(unidade, exercicio);

          if (signal?.aborted) return;

          const arrayBuffer = await blob.arrayBuffer();
          folder.file(fileName, arrayBuffer);
        } catch (err) {
          failures.push({
            unidadeId: unidade.unidade_id ?? "desconhecido",
            designacao: label,
            message: err instanceof Error ? err.message : String(err),
          });
        } finally {
          done += 1;
          onProgress?.({ done, total, currentLabel: label, failures: [...failures] });
        }
      }),
    );
  }

  if (signal?.aborted) throw new LoteAbortError();

  if (failures.length > 0) {
    const summary = [
      "Relatorio de geracao em lote",
      `Exercicio: ${exercicio}`,
      `Total alvo: ${total}`,
      `Sucesso: ${total - failures.length}`,
      `Falhas: ${failures.length}`,
      "",
      "Detalhes das falhas:",
      ...failures.map(
        (f, i) => `${i + 1}. ${f.designacao} (id: ${f.unidadeId}) — ${f.message}`,
      ),
    ].join("\n");
    folder.file("_relatorio_falhas.txt", summary);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFileName = zipFileNameOverride ?? buildZipFileName(exercicio);

  return {
    zipBlob,
    zipFileName,
    totalAlvo: total,
    totalSucesso: total - failures.length,
    totalFalha: failures.length,
    failures,
  };
}

export async function saveLoteResult(result: LoteResult): Promise<void> {
  saveAs(result.zipBlob, result.zipFileName);
}

export const __internals = { LoteAbortError, buildZipFileName, chunk };
