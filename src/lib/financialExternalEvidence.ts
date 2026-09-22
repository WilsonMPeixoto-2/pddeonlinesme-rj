import type { RepasseFinanceiro } from "@/lib/financeiroPDDE";

export type ExternalSecondCycleTrack = "REGULAR" | "PRIMEIRA_INFANCIA";

export interface ExternalFinancialEvidence {
  rowNumber: number;
  inep: string;
  track: ExternalSecondCycleTrack;
  amount: number;
  evidenceDate: string | null;
}

export interface FinancialEvidenceDivergence {
  rowNumber: number;
  inep: string;
  track: ExternalSecondCycleTrack;
  externalAmount: number;
  currentAmount: number | null;
  externalDate: string | null;
  currentPaymentDate: string | null;
  currentOrderDate: string | null;
  reason: "MISSING_CURRENT_PAYMENT" | "AMOUNT_MISMATCH" | "DATE_EVIDENCE_NOT_REFLECTED" | "SCHOOL_NOT_FOUND";
}

export interface ExternalEvidenceComparison {
  evidenceRows: number;
  matchedRows: number;
  divergences: FinancialEvidenceDivergence[];
}

function normalized(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function digits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function cellPrimitive(value: unknown): unknown {
  if (value && typeof value === "object") {
    const candidate = value as {
      result?: unknown;
      text?: unknown;
      richText?: Array<{ text?: unknown }>;
    };
    if (candidate.result !== undefined) return candidate.result;
    if (candidate.text !== undefined) return candidate.text;
    if (candidate.richText) return candidate.richText.map((item) => item.text ?? "").join("");
  }
  return value;
}

function moneyValue(value: unknown): number | null {
  const primitive = cellPrimitive(value);
  if (typeof primitive === "number" && Number.isFinite(primitive)) return primitive;
  const text = String(primitive ?? "").trim();
  if (!text) return null;
  const normalizedNumber = text
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalizedNumber);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value: unknown): string | null {
  const primitive = cellPrimitive(value);
  if (primitive instanceof Date && !Number.isNaN(primitive.getTime())) {
    return primitive.toISOString().slice(0, 10);
  }
  const text = String(primitive ?? "").trim();
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function isHeader(value: string, expected: string[]): boolean {
  return expected.includes(normalized(value));
}

const HEADERS = {
  inep: ["CODIGO INEP", "INEP"],
  regularAmount: ["RECEBIDO 2 PARCELA", "RECEBIDO SEGUNDA PARCELA"],
  regularDate: [
    "DATA ORDEM PAGAMENTO 2 PARCELA",
    "DATA ORDEM PAGAMENTO SEGUNDA PARCELA",
    "DATA 2 PARCELA",
  ],
  infancyAmount: [
    "RECEBIDO PRIMEIRA INFANCIA P2",
    "RECEBIDO PDDE BASICO PRIMEIRA INFANCIA P2",
  ],
  infancyDate: [
    "DATA ORDEM PAGAMENTO PRIMEIRA INFANCIA P2",
    "DATA PRIMEIRA INFANCIA P2",
  ],
} as const;

type ColumnMap = {
  inep: number;
  regularAmount: number | null;
  regularDate: number | null;
  infancyAmount: number | null;
  infancyDate: number | null;
};

function locateColumns(headers: unknown[]): ColumnMap | null {
  const normalizedHeaders = headers.map((value) => normalized(cellPrimitive(value)));
  const indexOf = (candidates: readonly string[]) => {
    const index = normalizedHeaders.findIndex((header) => candidates.includes(header));
    return index >= 0 ? index + 1 : null;
  };
  const inep = indexOf(HEADERS.inep);
  const regularAmount = indexOf(HEADERS.regularAmount);
  const infancyAmount = indexOf(HEADERS.infancyAmount);
  if (!inep || (!regularAmount && !infancyAmount)) return null;
  return {
    inep,
    regularAmount,
    regularDate: indexOf(HEADERS.regularDate),
    infancyAmount,
    infancyDate: indexOf(HEADERS.infancyDate),
  };
}

export async function parseExternalFinancialEvidence(file: File): Promise<ExternalFinancialEvidence[]> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error("A evidência financeira deve ser fornecida em arquivo .xlsx.");
  }
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  for (const worksheet of workbook.worksheets) {
    const scanLimit = Math.min(15, worksheet.rowCount);
    for (let headerRowNumber = 1; headerRowNumber <= scanLimit; headerRowNumber += 1) {
      const headerRow = worksheet.getRow(headerRowNumber);
      const columns = locateColumns(
        Array.from({ length: worksheet.columnCount }, (_, index) => headerRow.getCell(index + 1).value),
      );
      if (!columns) continue;

      const evidence: ExternalFinancialEvidence[] = [];
      for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const inep = digits(cellPrimitive(row.getCell(columns.inep).value));
        if (inep.length !== 8) continue;

        if (columns.regularAmount) {
          const amount = moneyValue(row.getCell(columns.regularAmount).value);
          if (amount !== null) {
            evidence.push({
              rowNumber,
              inep,
              track: "REGULAR",
              amount,
              evidenceDate: columns.regularDate
                ? isoDate(row.getCell(columns.regularDate).value)
                : null,
            });
          }
        }

        if (columns.infancyAmount) {
          const amount = moneyValue(row.getCell(columns.infancyAmount).value);
          if (amount !== null) {
            evidence.push({
              rowNumber,
              inep,
              track: "PRIMEIRA_INFANCIA",
              amount,
              evidenceDate: columns.infancyDate
                ? isoDate(row.getCell(columns.infancyDate).value)
                : null,
            });
          }
        }
      }

      if (evidence.length > 0) return evidence;
    }
  }

  throw new Error(
    "Não encontrei cabeçalhos reconhecíveis de INEP e 2ª parcela/P2 na planilha enviada.",
  );
}

function secondCycleRepasse(
  repasses: readonly RepasseFinanceiro[],
  evidence: ExternalFinancialEvidence,
): RepasseFinanceiro | null {
  return repasses.find((row) => (
    row.inep === evidence.inep
    && row.programa === "PDDE BÁSICO"
    && (
      evidence.track === "REGULAR"
        ? row.acao === "PDDE Básico" && row.parcela === "2ª Parcela"
        : row.acao === "PDDE Básico — Primeira Infância" && row.parcela === "P2"
    )
  )) ?? null;
}

function amountEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.005;
}

export function compareExternalFinancialEvidence(
  evidence: readonly ExternalFinancialEvidence[],
  repasses: readonly RepasseFinanceiro[],
): ExternalEvidenceComparison {
  const divergences: FinancialEvidenceDivergence[] = [];
  let matchedRows = 0;

  for (const item of evidence) {
    const current = secondCycleRepasse(repasses, item);
    if (!current) {
      divergences.push({
        rowNumber: item.rowNumber,
        inep: item.inep,
        track: item.track,
        externalAmount: item.amount,
        currentAmount: null,
        externalDate: item.evidenceDate,
        currentPaymentDate: null,
        currentOrderDate: null,
        reason: "SCHOOL_NOT_FOUND",
      });
      continue;
    }

    if (current.valor_pago === null && item.amount > 0) {
      divergences.push({
        rowNumber: item.rowNumber,
        inep: item.inep,
        track: item.track,
        externalAmount: item.amount,
        currentAmount: null,
        externalDate: item.evidenceDate,
        currentPaymentDate: current.data_pagamento,
        currentOrderDate: current.data_ordem_pagamento,
        reason: "MISSING_CURRENT_PAYMENT",
      });
      continue;
    }

    if (current.valor_pago !== null && !amountEqual(current.valor_pago, item.amount)) {
      divergences.push({
        rowNumber: item.rowNumber,
        inep: item.inep,
        track: item.track,
        externalAmount: item.amount,
        currentAmount: current.valor_pago,
        externalDate: item.evidenceDate,
        currentPaymentDate: current.data_pagamento,
        currentOrderDate: current.data_ordem_pagamento,
        reason: "AMOUNT_MISMATCH",
      });
      continue;
    }

    if (
      item.evidenceDate
      && !current.data_pagamento
      && !current.data_ordem_pagamento
    ) {
      divergences.push({
        rowNumber: item.rowNumber,
        inep: item.inep,
        track: item.track,
        externalAmount: item.amount,
        currentAmount: current.valor_pago,
        externalDate: item.evidenceDate,
        currentPaymentDate: null,
        currentOrderDate: null,
        reason: "DATE_EVIDENCE_NOT_REFLECTED",
      });
      continue;
    }

    matchedRows += 1;
  }

  return {
    evidenceRows: evidence.length,
    matchedRows,
    divergences,
  };
}

export function externalEvidenceReasonLabel(reason: FinancialEvidenceDivergence["reason"]): string {
  switch (reason) {
    case "MISSING_CURRENT_PAYMENT":
      return "A planilha informa pagamento, mas a base corrente não.";
    case "AMOUNT_MISMATCH":
      return "O valor da planilha diverge do valor corrente.";
    case "DATE_EVIDENCE_NOT_REFLECTED":
      return "A planilha contém data e a base corrente não possui evidência temporal.";
    case "SCHOOL_NOT_FOUND":
      return "A unidade/parcela não foi localizada na base corrente.";
  }
}
