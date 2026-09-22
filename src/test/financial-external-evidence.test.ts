import { describe, expect, it } from "vitest";

import {
  compareExternalFinancialEvidence,
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
});
