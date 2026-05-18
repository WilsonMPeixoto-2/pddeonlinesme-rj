/**
 * Parser de planilha parcial para o fluxo de Atualizacao Parcial Assistida.
 *
 * Aceita .xlsx (via ExcelJS lazy import) e .csv (via Papa Parse).
 *
 * Para .csv:
 *   - detecta delimitador `;` ou `,` automaticamente;
 *   - aceita UTF-8 e Latin-1 (tenta UTF-8 primeiro; fallback Latin-1 se houver
 *     `�` no resultado);
 *   - tolera BOM no inicio;
 *   - preserva zeros a esquerda como texto.
 *
 * Limites v1: arquivo nao vazio, max 200 linhas (sem header).
 */
import Papa from "papaparse";
import type { ParsedSpreadsheet } from "./types";

const MAX_ROWS = 200;
const XLSX_EXT = /\.xlsx$/i;
const CSV_EXT = /\.csv$/i;

export class BulkUpdateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BulkUpdateParseError";
  }
}

/** Detecta extensao por nome do arquivo. */
function detectFormat(fileName: string): "xlsx" | "csv" {
  if (XLSX_EXT.test(fileName)) return "xlsx";
  if (CSV_EXT.test(fileName)) return "csv";
  throw new BulkUpdateParseError(
    "Formato nao suportado. Use .xlsx ou .csv.",
  );
}

/** Decodifica buffer como UTF-8; volta para Latin-1 se detectar mojibake. */
function decodeText(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (utf8.includes("�")) {
    return new TextDecoder("latin1").decode(buffer);
  }
  // Remove BOM se presente.
  return utf8.replace(/^\uFEFF/, "");
}

async function parseXlsx(file: File): Promise<ParsedSpreadsheet> {
  const { default: ExcelJS } = await import("exceljs");
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  // Primeira aba — alinhado com convencao do baseImporter.
  const ws = wb.worksheets[0];
  if (!ws) {
    throw new BulkUpdateParseError("Nenhuma planilha encontrada no arquivo.");
  }

  const headerRow = ws.getRow(1);
  const headersRaw: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const v = cell.value;
    headersRaw[col - 1] = v == null ? "" : String(v).trim();
  });

  if (headersRaw.length === 0) {
    throw new BulkUpdateParseError("A primeira linha precisa conter cabecalhos.");
  }

  const rows: Array<Record<string, unknown>> = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const header = headersRaw[col - 1];
      if (!header) return;
      const value = unwrapCellValue(cell.value);
      obj[header] = value;
      if (value != null && String(value).trim().length > 0) hasValue = true;
    });
    if (hasValue) rows.push(obj);
  });

  if (rows.length > MAX_ROWS) {
    throw new BulkUpdateParseError(
      `Limite v1 e ${MAX_ROWS} linhas. Arquivo possui ${rows.length} linhas com dados.`,
    );
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    headersRaw: headersRaw.filter((h) => h && h.length > 0),
    rows,
    totalRows: rows.length,
  };
}

function unwrapCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("result" in obj && obj.result !== undefined) return unwrapCellValue(obj.result);
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return obj.richText.map((r: { text?: string }) => r.text ?? "").join("");
    }
    if (value instanceof Date) return value;
    if ("text" in obj && typeof obj.text === "string") return obj.text;
  }
  return value;
}

async function parseCsv(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const text = decodeText(buffer);

  if (text.trim().length === 0) {
    throw new BulkUpdateParseError("Arquivo CSV vazio.");
  }

  // Papa.parse com header:true + delimiter auto-detect
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    // Quando delimiter nao e passado, Papa detecta automaticamente.
  });

  if (result.errors.length > 0) {
    // Apenas reporta o primeiro erro relevante.
    const first = result.errors.find((e) => e.type !== "FieldMismatch") ?? result.errors[0];
    if (first) {
      throw new BulkUpdateParseError(
        `CSV invalido na linha ${first.row ?? "?"}: ${first.message}`,
      );
    }
  }

  const headersRaw = result.meta.fields ?? [];
  if (headersRaw.length === 0) {
    throw new BulkUpdateParseError("CSV sem cabecalho na primeira linha.");
  }

  const rows = (result.data ?? []).filter((row) =>
    Object.values(row).some((v) => v != null && String(v).trim().length > 0),
  );

  if (rows.length > MAX_ROWS) {
    throw new BulkUpdateParseError(
      `Limite v1 e ${MAX_ROWS} linhas. Arquivo possui ${rows.length} linhas com dados.`,
    );
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    headersRaw,
    rows: rows as Array<Record<string, unknown>>,
    totalRows: rows.length,
  };
}

/** Ponto de entrada do parser. Detecta formato e despacha. */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  if (file.size === 0) {
    throw new BulkUpdateParseError("Arquivo vazio.");
  }
  const format = detectFormat(file.name);
  if (format === "xlsx") return parseXlsx(file);
  return parseCsv(file);
}

export { MAX_ROWS as BULK_UPDATE_MAX_ROWS };
