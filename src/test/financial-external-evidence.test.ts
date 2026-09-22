import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  compareExternalFinancialEvidence,
  externalEvidenceReasonLabel,
  parseExternalFinancialEvidence,
  type ExternalFinancialEvidence,
} from "@/lib/financialExternalEvidence";
import type { RepasseFinanceiro } from "@/lib/financeiroPDDE";

function repasse(overrides: Partial<RepasseFinanceiro> = {}): RepasseFinanceiro {
  return {
    id: "r1",
    unidade_id: "u1",
    designacao: "EM TESTE",
    nome: "EM TESTE",
    inep: "33000001",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "2ª Parcela",
    ordem_exibicao: 2,
    valor_programado: 100,
    valor_pago: null,
    data_pagamento: null,
    data_ordem_pagamento: null,
    conta_bancaria_id: null,
    banco: null,
    agencia: null,
    conta_corrente: null,
    custeio_programado: null,
    capital_programado: null,
    custeio_pago: null,
    capital_pago: null,
    ...overrides,
  };
}

async function workbookFile(
  name: string,
  rows: unknown[][],
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Financeiro");
  rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("parser de evidência financeira externa", () => {
  it("lê planilha realista com cabeçalho deslocado, regular e P2, datas e moeda formatada", async () => {
    const file = await workbookFile("evidencia.xlsx", [
      ["Relatório financeiro da 4ª CRE"],
      [],
      [
        "Código INEP",
        "Recebido 2ª Parcela",
        "Data Ordem/Pagamento 2ª Parcela",
        "Recebido Primeira Infância P2",
        "Data Ordem/Pagamento Primeira Infância P2",
      ],
      ["33000001", "R$ 1.234,56", "17/09/2026", 0, ""],
      ["33000002", 0, "", 2500, new Date("2026-09-18T00:00:00Z")],
      ["INEP INVÁLIDO", 999, "17/09/2026", 0, ""],
      ["33000003", 0, "", 0, ""],
    ]);

    const evidence = await parseExternalFinancialEvidence(file);

    expect(evidence).toEqual([
      {
        rowNumber: 4,
        inep: "33000001",
        track: "REGULAR",
        amount: 1234.56,
        evidenceDate: "2026-09-17",
      },
      {
        rowNumber: 5,
        inep: "33000002",
        track: "PRIMEIRA_INFANCIA",
        amount: 2500,
        evidenceDate: "2026-09-18",
      },
    ]);
  });

  it("aceita cabeçalhos alternativos e preserva zero quando existe data como evidência temporal", async () => {
    const file = await workbookFile("alternativa.XLSX", [
      ["INEP", "Recebido Segunda Parcela", "Data 2 Parcela"],
      ["33000004", 0, "2026-09-19"],
    ]);

    await expect(parseExternalFinancialEvidence(file)).resolves.toEqual([
      {
        rowNumber: 2,
        inep: "33000004",
        track: "REGULAR",
        amount: 0,
        evidenceDate: "2026-09-19",
      },
    ]);
  });

  it("rejeita extensão diferente de xlsx", async () => {
    const file = new File(["x"], "evidencia.csv", { type: "text/csv" });
    await expect(parseExternalFinancialEvidence(file)).rejects.toThrow(/arquivo \.xlsx/i);
  });

  it("rejeita planilha sem cabeçalhos financeiros reconhecíveis", async () => {
    const file = await workbookFile("sem-cabecalho.xlsx", [
      ["Escola", "Valor qualquer"],
      ["EM TESTE", 100],
    ]);
    await expect(parseExternalFinancialEvidence(file)).rejects.toThrow(/cabeçalhos reconhecíveis/i);
  });
});

describe("detector de evidência financeira externa", () => {
  it("sinaliza quando a planilha informa pagamento e a base corrente não", () => {
    const evidence: ExternalFinancialEvidence[] = [{
      rowNumber: 2,
      inep: "33000001",
      track: "REGULAR",
      amount: 100,
      evidenceDate: "2026-09-17",
    }];

    const comparison = compareExternalFinancialEvidence(evidence, [repasse()]);

    expect(comparison.matchedRows).toBe(0);
    expect(comparison.divergences).toHaveLength(1);
    expect(comparison.divergences[0].reason).toBe("MISSING_CURRENT_PAYMENT");
  });

  it("sinaliza valor divergente, data não refletida e unidade ausente", () => {
    const evidence: ExternalFinancialEvidence[] = [
      {
        rowNumber: 3,
        inep: "33000001",
        track: "REGULAR",
        amount: 120,
        evidenceDate: null,
      },
      {
        rowNumber: 4,
        inep: "33000002",
        track: "REGULAR",
        amount: 100,
        evidenceDate: "2026-09-17",
      },
      {
        rowNumber: 5,
        inep: "33000003",
        track: "REGULAR",
        amount: 100,
        evidenceDate: "2026-09-17",
      },
    ];

    const comparison = compareExternalFinancialEvidence(evidence, [
      repasse({ inep: "33000001", valor_pago: 100 }),
      repasse({ id: "r2", unidade_id: "u2", inep: "33000002", valor_pago: 100 }),
    ]);

    expect(comparison.matchedRows).toBe(0);
    expect(comparison.divergences.map((row) => row.reason)).toEqual([
      "AMOUNT_MISMATCH",
      "DATE_EVIDENCE_NOT_REFLECTED",
      "SCHOOL_NOT_FOUND",
    ]);
  });

  it("considera compatível o pagamento já refletido no snapshot corrente", () => {
    const evidence: ExternalFinancialEvidence[] = [{
      rowNumber: 2,
      inep: "33000001",
      track: "REGULAR",
      amount: 100,
      evidenceDate: "2026-09-17",
    }];

    const comparison = compareExternalFinancialEvidence(evidence, [repasse({
      valor_pago: 100,
      data_pagamento: "2026-09-17",
    })]);

    expect(comparison.matchedRows).toBe(1);
    expect(comparison.divergences).toHaveLength(0);
  });

  it("não confunde P2 de Primeira Infância com a 2ª parcela regular", () => {
    const evidence: ExternalFinancialEvidence[] = [{
      rowNumber: 7,
      inep: "33000001",
      track: "PRIMEIRA_INFANCIA",
      amount: 250,
      evidenceDate: "2026-09-17",
    }];

    const comparison = compareExternalFinancialEvidence(evidence, [repasse({
      acao: "PDDE Básico — Primeira Infância",
      parcela: "P2",
      valor_programado: 250,
      valor_pago: 250,
      data_pagamento: "2026-09-17",
    })]);

    expect(comparison.matchedRows).toBe(1);
    expect(comparison.divergences).toHaveLength(0);
  });

  it("expõe rótulos humanos para todos os motivos de divergência", () => {
    expect(externalEvidenceReasonLabel("MISSING_CURRENT_PAYMENT")).toMatch(/planilha informa pagamento/i);
    expect(externalEvidenceReasonLabel("AMOUNT_MISMATCH")).toMatch(/valor da planilha diverge/i);
    expect(externalEvidenceReasonLabel("DATE_EVIDENCE_NOT_REFLECTED")).toMatch(/contém data/i);
    expect(externalEvidenceReasonLabel("SCHOOL_NOT_FOUND")).toMatch(/não foi localizada/i);
  });
});
