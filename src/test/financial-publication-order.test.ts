import { describe, expect, it } from "vitest";

import { buildNormalizedPublicationPayload } from "../../scripts/lib/financial-publication.mjs";

const manifest = {
  publishedAt: "2026-09-12T07:00:00Z",
  source: {
    workflowRunId: 9001,
    artifactId: 9002,
    artifactName: "sigef-full-163-2026",
  },
};

function school(inep: string, sme: string, account: string) {
  return {
    school: { inep, sme, name: `Escola ${inep}` },
    accounts: [
      { program: "PDDE", bank: "001", agency: "0001", account },
    ],
    programs: [
      {
        name: "PDDE / PDDE Básico",
        installments: [
          {
            installment: "2ª Parcela",
            programmedCents: 20000,
            paymentInformedCents: 0,
            paymentInformedDate: null,
            paymentOrderDate: null,
            breakdown: {},
            account: null,
          },
          {
            installment: "1ª Parcela",
            programmedCents: 10000,
            paymentInformedCents: 10000,
            paymentInformedDate: "2026-08-05",
            paymentOrderDate: "2026-08-04",
            breakdown: {
              programmedCusteioCents: 4000,
              programmedCapitalCents: 6000,
              paidCusteioCents: 4000,
              paidCapitalCents: 6000,
            },
            account: null,
          },
        ],
      },
    ],
  };
}

describe("ordenação canônica da publicação financeira", () => {
  it("produz o mesmo conteúdo de negócio quando a fonte chega em ordem diferente", () => {
    const first = {
      publishedAt: manifest.publishedAt,
      source: manifest.source,
      portfolio: { fiscalYear: 2026 },
      schools: {
        "22222222": school("22222222", "042", "0002"),
        "11111111": school("11111111", "041", "0001"),
      },
    };

    const second = {
      publishedAt: manifest.publishedAt,
      source: manifest.source,
      portfolio: { fiscalYear: 2026 },
      schools: {
        "11111111": school("11111111", "041", "0001"),
        "22222222": school("22222222", "042", "0002"),
      },
    };

    const a = buildNormalizedPublicationPayload(first, manifest);
    const b = buildNormalizedPublicationPayload(second, manifest);

    expect({ schools: a.schools, accounts: a.accounts, repasses: a.repasses }).toEqual({
      schools: b.schools,
      accounts: b.accounts,
      repasses: b.repasses,
    });

    expect(a.schools.map((row) => row.inep)).toEqual(["11111111", "22222222"]);
    expect(a.accounts.map((row) => row.inep)).toEqual(["11111111", "22222222"]);
    expect(a.repasses.map((row) => `${row.inep}|${row.action}|${row.installment}`)).toEqual([
      "11111111|PDDE Básico|1ª Parcela",
      "11111111|PDDE Básico|2ª Parcela",
      "22222222|PDDE Básico|1ª Parcela",
      "22222222|PDDE Básico|2ª Parcela",
    ]);
  });
});
