import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyPublishedFinancialState } from "../../scripts/sync-financial-snapshot.mjs";

const env = {
  SUPABASE_URL: "https://raluxyojqosfzrfozmpz.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
};

function payload() {
  return {
    exercise: 2026,
    source: {
      workflowRunId: 35588440300,
      artifactId: 10634545689,
    },
    repasses: Array.from({ length: 163 }, (_, index) => ({
      inep: String(33000000 + index).padStart(8, "0"),
      program: "PDDE BÁSICO",
      action: "PDDE Básico",
      installment: "2ª Parcela",
      paid: 100,
      paymentDate: null,
      paymentOrderDate: "2026-09-17",
    })),
  };
}

function viewRows(count = 163) {
  return Array.from({ length: count }, (_, index) => ({
    inep: String(33000000 + index).padStart(8, "0"),
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "2ª Parcela",
    valor_pago: 100,
    data_pagamento: null,
    data_ordem_pagamento: "2026-09-17",
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("read-after-write financeiro", () => {
  it("confirma a mesma proveniência, 163 escolas, valor e semântica na view operacional", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("vw_repasses_financeiros_unidade")) {
        return new Response(JSON.stringify(viewRows()), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("integracoes_financeiras_runs")) {
        return new Response(JSON.stringify([{
          workflow_run_id: 35588440300,
          artifact_id: 10634545689,
          publication_result: "PUBLISHED",
          criado_em: "2026-09-21T10:40:00Z",
        }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      throw new Error(`URL inesperada: ${url}`);
    }));

    await expect(verifyPublishedFinancialState(payload(), env)).resolves.toMatchObject({
      workflowRunId: 35588440300,
      artifactId: 10634545689,
      secondInstallmentSchools: 163,
      secondInstallmentTotal: 16300,
      semanticRowsVerified: 163,
    });
  });

  it("falha quando a view operacional deixa uma escola para trás", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("vw_repasses_financeiros_unidade")) {
        return new Response(JSON.stringify(viewRows(162)), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify([{
        workflow_run_id: 35588440300,
        artifact_id: 10634545689,
        publication_result: "PUBLISHED",
        criado_em: "2026-09-21T10:40:00Z",
      }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }));

    await expect(verifyPublishedFinancialState(payload(), env)).rejects.toThrow(
      /2º ciclo diverge entre snapshot e view operacional/,
    );
  });
});
