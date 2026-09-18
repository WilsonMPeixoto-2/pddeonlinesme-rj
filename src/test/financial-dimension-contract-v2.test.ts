import { describe, expect, it } from "vitest";

import { evaluatePublicationDimensions } from "../../scripts/lib/financial-publication.mjs";

const CORE_CONTRACTS = [
  ["bank_accounts", "bank_accounts_v1"],
  ["scheduled_repasses", "scheduled_repasses_v1"],
  ["pdde_basic_first_installment", "pdde_basic_first_installment_v1"],
  ["pdde_basic_first_installment_breakdown", "pdde_basic_first_installment_breakdown_v1"],
  ["pdde_basic_second_installment_programmed", "pdde_basic_second_installment_programmed_v1"],
].map(([dimensionKey, validatorKey]) => ({
  dimensionKey,
  exercise: 2026,
  contractVersion: 2,
  coverageExpected: 1,
  coverageRequiredRatio: 1,
  requirements: {},
  enabled: true,
  requiredForCorePublication: true,
  validatorKey,
}));

const OPTIONAL_PENDING = {
  dimensionKey: "bank_balance_positions",
  exercise: 2026,
  contractVersion: 2,
  coverageExpected: 163,
  coverageRequiredRatio: 1,
  requirements: { requires_reference_date: true },
  enabled: true,
  requiredForCorePublication: false,
  validatorKey: "pending",
};

function payload() {
  return {
    exercise: 2026,
    schools: [{ inep: "33000001", sme: "0410001", name: "EM TESTE" }],
    accounts: [
      {
        inep: "33000001",
        exercise: 2026,
        program: "PDDE BÁSICO",
        bank: "001",
        agency: "0001",
        account: "12345",
        primary: true,
      },
    ],
    repasses: [
      {
        inep: "33000001",
        exercise: 2026,
        program: "PDDE BÁSICO",
        action: "PDDE Básico",
        installment: "1ª Parcela",
        programmed: 100,
        paid: 100,
        paidCusteio: 40,
        paidCapital: 60,
        paymentDate: "2026-08-05",
        account: null,
      },
      {
        inep: "33000001",
        exercise: 2026,
        program: "PDDE BÁSICO",
        action: "PDDE Básico",
        installment: "2ª Parcela",
        programmed: 100,
        paid: null,
        paidCusteio: null,
        paidCapital: null,
        paymentDate: null,
        account: null,
      },
    ],
  };
}

describe("Financial Dimension Contract V2", () => {
  it("usa coverageExpected e coverageRequiredRatio recebidos do contrato", () => {
    const contracts = CORE_CONTRACTS.map((contract) =>
      contract.dimensionKey === "pdde_basic_second_installment_programmed"
        ? { ...contract, coverageExpected: 2, coverageRequiredRatio: 0.5 }
        : contract,
    );

    const dimensions = evaluatePublicationDimensions(payload(), contracts);
    const second = dimensions.find(
      (dimension) => dimension.dimensionKey === "pdde_basic_second_installment_programmed",
    );

    expect(second).toMatchObject({
      coverageObserved: 1,
      coverageExpected: 2,
      coverageRatio: 0.5,
      qualityStatus: "MATURE",
    });
  });

  it("falha fechado quando um contrato obrigatório está ausente", () => {
    const contracts = CORE_CONTRACTS.filter((contract) => contract.dimensionKey !== "bank_accounts");

    expect(() => evaluatePublicationDimensions(payload(), contracts)).toThrow(/contrato.*bank_accounts/i);
  });

  it("não promove contrato opcional pending no conjunto de dimensões nucleares", () => {
    const dimensions = evaluatePublicationDimensions(payload(), [...CORE_CONTRACTS, OPTIONAL_PENDING]);

    expect(dimensions).toHaveLength(5);
    expect(dimensions.every((dimension) => dimension.qualityStatus === "MATURE")).toBe(true);
    expect(dimensions.some((dimension) => dimension.dimensionKey === "bank_balance_positions")).toBe(false);
  });

  it("rejeita contrato obrigatório sem validador semântico conhecido", () => {
    const contracts = CORE_CONTRACTS.map((contract) =>
      contract.dimensionKey === "bank_accounts"
        ? { ...contract, validatorKey: "pending" }
        : contract,
    );

    expect(() => evaluatePublicationDimensions(payload(), contracts)).toThrow(/validador.*bank_accounts/i);
  });
});
