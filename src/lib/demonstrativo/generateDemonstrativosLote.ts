import JSZip from "jszip";
import { saveAs } from "file-saver";

import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { generateDemonstrativoBasico } from "./generateDemonstrativoBasico";
import {
  getCamposCadastraisPendentes,
  type CampoCadastroEssencial,
} from "./mapUnidadeToMemoria";

export type LoteFailure = {
  unidadeId: string;
  designacao: string;
  message: string;
};

export type CadastroPendente = {
  unidadeId: string;
  designacao: string;
  camposFaltantes: CampoCadastroEssencial[];
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
  pendenciasCadastrais: CadastroPendente[];
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

function getUnidadeLabel(unidade: UnidadeDetalhe) {
  return unidade.designacao ?? unidade.nome ?? unidade.unidade_id ?? "Unidade";
}

function collectPendenciasCadastrais(unidades: UnidadeDetalhe[]): CadastroPendente[] {
  return unidades.flatMap((unidade) => {
    const camposFaltantes = getCamposCadastraisPendentes(unidade);
    if (camposFaltantes.length === 0) return [];

    return [
      {
        unidadeId: unidade.unidade_id ?? "desconhecido",
        designacao: getUnidadeLabel(unidade),
        camposFaltantes,
      },
    ];
  });
}

function buildPendenciasReport(
  exercicio: string,
  total: number,
  pendencias: CadastroPendente[],
) {
  return [
    "Relatorio de pendencias cadastrais",
    `Exercicio: ${exercicio}`,
    `Total alvo: ${total}`,
    `Unidades com pendencia cadastral: ${pendencias.length}`,
    "",
    "Campos essenciais avaliados: designacao, cnpj, endereco, diretor, agencia, conta_corrente",
    "",
    "Detalhes das pendencias:",
    ...pendencias.map(
      (p, i) =>
        `${i + 1}. ${p.designacao} (id: ${p.unidadeId}) — campos faltantes: ${p.camposFaltantes.join(", ")}`,
    ),
  ].join("\n");
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
    throw new Error("Nenhuma unidade para geracao em lote.");
  }

  const zip = new JSZip();
  const folderName = `Demonstrativos_Basicos_${exercicio}`;
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("Nao foi possivel criar pasta no arquivo .zip.");
  }

  const failures: LoteFailure[] = [];
  const pendenciasCadastrais = collectPendenciasCadastrais(unidades);
  let done = 0;

  onProgress?.({ done, total, currentLabel: null, failures });

  const batches = chunk(unidades, batchSize);

  for (const batch of batches) {
    if (signal?.aborted) throw new LoteAbortError();

    await Promise.all(
      batch.map(async (unidade) => {
        if (signal?.aborted) return;

        const label = getUnidadeLabel(unidade);

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

  if (pendenciasCadastrais.length > 0) {
    folder.file(
      "_relatorio_pendencias_cadastrais.txt",
      buildPendenciasReport(exercicio, total, pendenciasCadastrais),
    );
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
    pendenciasCadastrais,
  };
}

export async function saveLoteResult(result: LoteResult): Promise<void> {
  saveAs(result.zipBlob, result.zipFileName);
}

export const __internals = {
  LoteAbortError,
  buildZipFileName,
  chunk,
  collectPendenciasCadastrais,
  buildPendenciasReport,
};
