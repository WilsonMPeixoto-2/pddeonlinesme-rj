import { describe, expect, it } from "vitest";

import { evaluatePublicationDimensions } from "../../scripts/lib/financial-publication.mjs";

type Repasse = {
  inep: string;
  program: string;
  action: string;
  installment: string;
  programmed: number;
  paid: number | null;
  paidCusteio: number | null;
  paidCapital: number | null;
  paymentDate: string | null;
  paymentOrderDate: string | null;
};

type Account = {
  inep: string;
  program: string;
  bank: string | null;
  agency: string | null;
  account: string | null;
};

function buildPayload(count = 163) {
  const schools = Array.from({ length: count }, (_, index) => ({
    inep: String(33000000 + index).padStart(8, "0"),
    name: `Escola ${index + 1}`,
  }));
  const accounts: Account[] = schools.map((school) => ({
    inep: school.inep,
    program: "PDDE BÁSICO",
    bank: "001",
    agency: "0249",
    account: `0000${school.inep}`,
  }));
  const repasses: Repasse[] = schools.flatMap((school) => [
    {
      inep: school.inep,
      program: "PDDE BÁSICO",
      action: "PDDE Básico",
      installment: "1ª Parcela",
      programmed: 5000,
      paid: 5000,
      paidCusteio: 1000,
      paidCapital: 4000,
      paymentDate: "2026-08-05",
      paymentOrderDate: "2026-08-04",
    },
    {
      inep: school.inep,
      program: "PDDE BÁSICO",
      action: "PDDE Básico",
      installment: "2ª Parcela",
      programmed: 5000,
      paid: 5000,
      paidCusteio: 1000,
      paidCapital: 4000,
      paymentDate: "2026-09-17",
      paymentOrderDate: "2026-09-16",
    },
  ]);

  return { exercise: 2026, schools, accounts, repasses };
}

function byKey(statuses: Array<{ dimensionKey: string }>, key: string) {
  const status = statuses.find((item) => item.dimensionKey === key);
  if (!status) throw new Error(`Dimensão ausente: ${key}`);
  return status as {
    dimensionKey: string;
    coverageObserved: number;
    coverageExpected: number;
    coverageRatio: number;
    qualityStatus: string;
    publicationStatus: string;
    referenceDateMin: string | null;
    referenceDateMax: string | null;
  };
}

describe("evaluatePublicationDimensions", () => {
  it("marca como MATURE as seis dimensões quando a cobertura é 163/163", () => {
    const statuses = evaluatePublicationDimensions(buildPayload());

    expect(statuses.map((item: { dimensionKey: string }) => item.dimensionKey)).toEqual([
      "bank_accounts",
      "scheduled_repasses",
      "pdde_basic_first_installment",
      "pdde_basic_first_installment_breakdown",
      "pdde_basic_second_installment_programmed",
      "pdde_basic_second_installment_payment_informed",
    ]);

    for (const status of statuses) {
      expect(status.coverageObserved).toBe(163);
      expect(status.coverageExpected).toBe(163);
      expect(status.coverageRatio).toBe(1);
      expect(status.qualityStatus).toBe("MATURE");
      expect(status.publicationStatus).toBe("UNPUBLISHED");
    }

    expect(byKey(statuses, "pdde_basic_first_installment").referenceDateMin).toBe("2026-08-05");
    expect(byKey(statuses, "pdde_basic_first_installment").referenceDateMax).toBe("2026-08-05");
    expect(byKey(statuses, "pdde_basic_second_installment_payment_informed").referenceDateMin).toBe("2026-09-17");
    expect(byKey(statuses, "pdde_basic_second_installment_payment_informed").referenceDateMax).toBe("2026-09-17");
  });

  it("não promove ordem de pagamento como pagamento informado", () => {
    const payload = buildPayload();
    const second = payload.repasses.find(
      (row) => row.inep === payload.schools[162].inep && row.installment === "2ª Parcela",
    );
    if (!second) throw new Error("fixture inválida");
    second.paymentDate = null;
    second.paymentOrderDate = "2026-09-17";

    const status = byKey(
      evaluatePublicationDimensions(payload),
      "pdde_basic_second_installment_payment_informed",
    );

    expect(status.coverageObserved).toBe(162);
    expect(status.qualityStatus).toBe("VALIDATED");
  });

  it("não promove pagamento informado do 2º ciclo quando falta uma unidade", () => {
    const payload = buildPayload();
    const second = payload.repasses.find(
      (row) => row.inep === payload.schools[162].inep && row.installment === "2ª Parcela",
    );
    if (!second) throw new Error("fixture inválida");
    second.paid = null;
    second.paidCusteio = null;
    second.paidCapital = null;
    second.paymentOrderDate = null;

    const status = byKey(
      evaluatePublicationDimensions(payload),
      "pdde_basic_second_installment_payment_informed",
    );

    expect(status.coverageObserved).toBe(162);
    expect(status.qualityStatus).toBe("VALIDATED");
  });

  it("mantém primeira parcela VALIDATED quando há apenas 162/163 escolas, sem promover silenciosamente", () => {
    const payload = buildPayload();
    payload.repasses = payload.repasses.filter((row) =>
      !(row.inep === payload.schools[162].inep && row.installment === "1ª Parcela"),
    );

    const status = byKey(evaluatePublicationDimensions(payload), "pdde_basic_first_installment");

    expect(status.coverageObserved).toBe(162);
    expect(status.coverageRatio).toBeCloseTo(162 / 163);
    expect(status.qualityStatus).toBe("VALIDATED");
    expect(status.publicationStatus).toBe("UNPUBLISHED");
  });

  it("não considera breakdown maduro quando um pagamento não possui custeio/capital completos", () => {
    const payload = buildPayload();
    const first = payload.repasses.find((row) => row.installment === "1ª Parcela");
    if (!first) throw new Error("fixture inválida");
    first.paidCapital = null;

    const statuses = evaluatePublicationDimensions(payload);

    expect(byKey(statuses, "pdde_basic_first_installment").qualityStatus).toBe("MATURE");
    const breakdown = byKey(statuses, "pdde_basic_first_installment_breakdown");
    expect(breakdown.coverageObserved).toBe(162);
    expect(breakdown.qualityStatus).toBe("VALIDATED");
  });

  it("rejeita o breakdown quando componentes conhecidos não somam o valor pago", () => {
    const payload = buildPayload();
    const first = payload.repasses.find((row) => row.installment === "1ª Parcela");
    if (!first) throw new Error("fixture inválida");
    first.paidCapital = 3999;

    const breakdown = byKey(
      evaluatePublicationDimensions(payload),
      "pdde_basic_first_installment_breakdown",
    );

    expect(breakdown.qualityStatus).toBe("REJECTED");
    expect(breakdown.publicationStatus).toBe("UNPUBLISHED");
  });

  it("rejeita bank_accounts quando qualquer conta recebida tem identidade incompleta", () => {
    const payload = buildPayload();
    payload.accounts.push({
      inep: payload.schools[0].inep,
      program: "PDDE QUALIDADE",
      bank: null,
      agency: "0249",
      account: "99999-9",
    });

    const accounts = byKey(evaluatePublicationDimensions(payload), "bank_accounts");

    expect(accounts.coverageObserved).toBe(163);
    expect(accounts.qualityStatus).toBe("REJECTED");
    expect(accounts.publicationStatus).toBe("UNPUBLISHED");
  });
});
