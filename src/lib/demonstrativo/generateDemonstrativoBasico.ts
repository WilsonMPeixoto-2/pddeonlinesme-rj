import type { Cell, CellFormulaValue, Workbook, Worksheet } from "exceljs";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import {
  BASE_SHEET_NAME,
  DEMONSTRATIVO_SHEET_NAME,
  DEMONSTRATIVO_TEMPLATE_URL,
  MEMORIA_CELLS,
  MEMORIA_SHEET_NAME,
  XLSX_MIME_TYPE,
} from "./templateCells";
import {
  mapUnidadeToMemoria,
  type DemonstrativoMemoriaData,
} from "./mapUnidadeToMemoria";

/**
 * Extrai a referência de célula de uma fórmula simples apontando para a aba MEMORIA.
 *
 * Aceita variantes comuns emitidas por diferentes versões do Excel/ExcelJS:
 *   MEMORIA!B2        → B2
 *   =MEMORIA!B2       → B2
 *   MEMORIA!$B$2      → B2
 *   'MEMORIA'!B2      → B2
 *   'MEMORIA'!$B$2    → B2
 *
 * Retorna `null` para fórmulas compostas (ex.: SUM(MEMORIA!B2)),
 * referências a outras abas, ou strings vazias.
 */
export function extractMemoriaRef(formula: string): string | null {
  const normalized = formula.trim().replace(/^=/, "");
  const match = normalized.match(/^'?MEMORIA'?!\$?([A-Z]+)\$?(\d+)$/i);
  if (!match) return null;
  return `${match[1].toUpperCase()}${match[2]}`;
}

/** Type guard: extrai a string de fórmula de uma célula ExcelJS, independente do formato interno. */
function getCellFormula(cell: Cell): string {
  if (cell.formula) return cell.formula;
  const val = cell.value;
  if (val && typeof val === "object" && "formula" in val) {
    return (val as CellFormulaValue).formula;
  }
  return "";
}

function clearCachedFormulaResults(workbook: Workbook) {
  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const formula = getCellFormula(cell);
        if (!formula) return;

        cell.value = { formula };
      });
    });
  });
}

export interface GeneratedDemonstrativo {
  blob: Blob;
  fileName: string;
  memoria: DemonstrativoMemoriaData;
}

let templateBufferPromise: Promise<ArrayBuffer> | null = null;

const fetchTemplate = async () => {
  const response = await fetch(DEMONSTRATIVO_TEMPLATE_URL);

  if (!response.ok) {
    throw new Error(
      `Template do Demonstrativo Basico nao encontrado (${response.status}).`,
    );
  }

  return response.arrayBuffer();
};

const getTemplateBuffer = async () => {
  templateBufferPromise ??= fetchTemplate();
  const templateBuffer = await templateBufferPromise;

  return templateBuffer.slice(0);
};

const setCell = (worksheet: Worksheet, address: string, value: string | number) => {
  worksheet.getCell(address).value = value;
};

const fillMemoria = (worksheet: Worksheet, data: DemonstrativoMemoriaData) => {
  setCell(worksheet, MEMORIA_CELLS.nome, data.nome);
  setCell(worksheet, MEMORIA_CELLS.cnpj, data.cnpj);
  setCell(worksheet, MEMORIA_CELLS.endereco, data.endereco);
  setCell(worksheet, MEMORIA_CELLS.agencia, data.agencia);
  setCell(worksheet, MEMORIA_CELLS.contaCorrente, data.contaCorrente);
  setCell(worksheet, MEMORIA_CELLS.reprogramadoCusteio, data.reprogramadoCusteio);
  setCell(worksheet, MEMORIA_CELLS.reprogramadoCapital, data.reprogramadoCapital);
  setCell(worksheet, MEMORIA_CELLS.parcela1Custeio, data.parcela1Custeio);
  setCell(worksheet, MEMORIA_CELLS.parcela1Capital, data.parcela1Capital);
  setCell(worksheet, MEMORIA_CELLS.parcela2Custeio, data.parcela2Custeio);
  setCell(worksheet, MEMORIA_CELLS.parcela2Capital, data.parcela2Capital);
  setCell(worksheet, MEMORIA_CELLS.diretor, data.diretor);
};

const isFormulaValue = (value: unknown): value is CellFormulaValue =>
  Boolean(value && typeof value === "object" && "formula" in value);

const resolveMemoriaCellValue = (
  worksheet: Worksheet,
  address: string,
  seen = new Set<string>(),
): Cell["value"] => {
  const normalizedAddress = address.toUpperCase();
  if (seen.has(normalizedAddress)) return "";
  seen.add(normalizedAddress);

  const value = worksheet.getCell(normalizedAddress).value;
  if (!isFormulaValue(value)) return value ?? "";

  const parts = value.formula.split("+").map((part) => part.trim().toUpperCase());
  if (parts.length === 0 || parts.some((part) => !/^\$?[A-Z]+\$?\d+$/.test(part))) {
    return "";
  }

  let total = 0;
  for (const part of parts) {
    const ref = part.replace(/\$/g, "");
    const resolved = resolveMemoriaCellValue(worksheet, ref, seen);

    if (resolved === "—") return "—";
    if (typeof resolved !== "number" || !Number.isFinite(resolved)) return "";

    total += resolved;
  }

  return total;
};

const materializeSimpleMemoriaRefs = (
  workbook: Workbook,
  memoriaWorksheet: Worksheet,
) => {
  workbook.eachSheet((worksheet) => {
    if (worksheet.name === MEMORIA_SHEET_NAME) return;

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const formula = getCellFormula(cell);
        if (!formula) return;

        const memRef = extractMemoriaRef(formula);
        if (!memRef) return;

        cell.value = resolveMemoriaCellValue(memoriaWorksheet, memRef);
      });
    });
  });
};

export async function generateDemonstrativoBasico(
  unidade: UnidadeDetalhe,
  exercicio: string,
): Promise<GeneratedDemonstrativo> {
  const templateBuffer = await getTemplateBuffer();
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(templateBuffer);
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;
  clearCachedFormulaResults(workbook);

  const memoriaWorksheet = workbook.getWorksheet(MEMORIA_SHEET_NAME);
  const demonstrativoWorksheet = workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME);

  if (!memoriaWorksheet) {
    throw new Error(`Aba ${MEMORIA_SHEET_NAME} nao encontrada no template.`);
  }

  if (!demonstrativoWorksheet) {
    throw new Error(`Aba ${DEMONSTRATIVO_SHEET_NAME} nao encontrada no template.`);
  }

  const { fileName, memoria } = mapUnidadeToMemoria(unidade, exercicio);
  fillMemoria(memoriaWorksheet, memoria);

  // The individual workbook must not carry the legacy consolidated BASE sheet.
  // Once MEMORIA is filled with literal values, BASE is no longer required.
  const baseWorksheet = workbook.getWorksheet(BASE_SHEET_NAME);
  if (baseWorksheet) {
    workbook.removeWorksheet(baseWorksheet.id);
  }

  // Workaround para falhas de recálculo (cache) em visualizadores web/Google Sheets:
  // Substituímos fórmulas simples que buscam na MEMORIA por valores literais.
  materializeSimpleMemoriaRefs(workbook, memoriaWorksheet);

  const outputBuffer = await workbook.xlsx.writeBuffer();

  return {
    blob: new Blob([outputBuffer as BlobPart], { type: XLSX_MIME_TYPE }),
    fileName,
    memoria,
  };
}
