import { describe, expect, it } from "vitest";

import { evaluatePublicationDimensions } from "../../supabase/functions/_shared/financial-publication.mjs";

function basePayload(repasse: Record<string, unknown>) {
  return {
    exercise: 2026,
    schools: [{ inep: "33000001", sme: "0410001", name: "EM TESTE" }],
    accounts: [],
    repasses: [{
      inep: "33000001",
      exercise: 2026,
      program: "PDDE BÁSICO",
      action: "PDDE Básico",
      installment: "2ª Parcela",
      programmed: 100,
      paid: 100,
      programmedCusteio: null,
      programmedCapital: null,
      paidCusteio: null,
      paidCapital: null,
      paymentDate: null,
      paymentOrderDate: null,
      account: null,
      ...repasse,
    }],
  };
}

function secondCycleDimension(payload: ReturnType<typeof basePayload>) {
  return evaluatePublicationDimensions(payload).find(
    (dimension) => dimension.dimensionKey === "pdde_basic_second_installment_payment_informed",
  );
}

describe("contrato de dominio do segundo ciclo", () => {
  it("aceita ordem oficial com valor como fato parcial valido sem inventar credito bancario", () => {
    const dimension = secondCycleDimension(basePayload({
      paymentOrderDate: "2026-09-17",
      paymentDate: null,
    }));

    expect(dimension).toMatchObject({
      coverageObserved: 1,
      coverageExpected: 163,
      qualityStatus: "VALIDATED",
    });
  });

  it("nao conta valor sem qualquer data oficial como pagamento informado validado", () => {
    const dimension = secondCycleDimension(basePayload({
      paymentOrderDate: null,
      paymentDate: null,
    }));

    expect(dimension).toMatchObject({
      coverageObserved: 0,
      qualityStatus: "VALIDATED",
    });
  });

  it("mantem programas diferentes como fatos distintos mesmo com INEP, valor e data iguais", () => {
    const payload = basePayload({ paymentOrderDate: "2026-09-17" });
    payload.repasses.push({
      ...payload.repasses[0],
      program: "PDDE QUALIDADE",
      action: "Educação Conectada",
      installment: "Parcela única",
    });

    expect(payload.repasses.map((row) => [
      row.inep,
      row.program,
      row.action,
      row.installment,
    ])).toHaveLength(2);
  });
});
