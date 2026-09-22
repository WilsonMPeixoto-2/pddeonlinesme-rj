import { describe, expect, it } from "vitest";

import {
  mergeEngineSnapshotRepasses,
  type EngineFinancialSnapshot,
} from "@/lib/engineFinancialSnapshot";
import type { RepasseFinanceiro } from "@/lib/financeiroPDDE";

describe("reconciliação do snapshot financeiro corrente", () => {
  it("faz o fato novo do motor prevalecer sobre um Supabase defasado sem inventar crédito bancário", () => {
    const databaseRows: RepasseFinanceiro[] = [{
      id: "db-second",
      unidade_id: "unit-1",
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
      conta_bancaria_id: "account-1",
      banco: "001",
      agencia: "0249",
      conta_corrente: "0000000001",
      custeio_programado: 40,
      capital_programado: 60,
      custeio_pago: null,
      capital_pago: null,
    }];

    const snapshot: EngineFinancialSnapshot = {
      publishedAt: "2026-09-21T10:39:16.102Z",
      source: {
        workflowRunId: 35588440300,
        artifactId: 10634545689,
        artifactName: "sigef-full-163-2026",
      },
      portfolio: { fiscalYear: 2026 },
      schools: {
        "33000001": {
          school: {
            inep: "33000001",
            sme: "0410001",
            name: "EM TESTE",
          },
          programs: [{
            name: "PDDE Básico",
            installments: [{
              installment: "2ª Parcela",
              programmedCents: 10000,
              paymentInformedCents: 10000,
              paymentInformedDate: "2026-09-17",
              paymentOrderDate: null,
              account: {
                bank: "001",
                agency: "0249",
                number: "0000000001",
              },
              creditEvidence: {
                status: "Consulta inconclusiva",
                date: null,
                amountCents: null,
                document: null,
              },
              breakdown: {
                programmedCusteioCents: 4000,
                programmedCapitalCents: 6000,
                paidCusteioCents: 4000,
                paidCapitalCents: 6000,
              },
            }],
          }],
        },
      },
    };

    const merged = mergeEngineSnapshotRepasses({
      databaseRows,
      units: [{
        id: "unit-1",
        designacao: "EM TESTE",
        nome: "EM TESTE",
        inep: "33000001",
      }],
      snapshot,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: "db-second",
      valor_pago: 100,
      custeio_pago: 40,
      capital_pago: 60,
      data_ordem_pagamento: null,
      data_pagamento: "2026-09-17",
      credito_bancario_confirmado: false,
      data_credito_bancario: null,
    });
  });
});
