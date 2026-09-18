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
            paymentInformedDate: null,
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

describe("valor informado, ordem e pagamento permanecem independentes", () => {
  it("publica valor e composição informados mesmo sem data de pagamento", () => {
    const snapshot = {
      publishedAt: manifest.publishedAt,
      source: manifest.source,
      portfolio: { fiscalYear: 2026 },
      schools: {
        "33069247": school("33069247", "0410001", "0001"),
      },
    };

    const payload = buildNormalizedPublicationPayload(snapshot, manifest);
    const first = payload.repasses.find((row) => row.installment === "1ª Parcela");
    expect(first).toEqual(expect.objectContaining({
      paid: 100,
      paidCusteio: 40,
      paidCapital: 60,
      paymentDate: null,
      paymentOrderDate: "2026-08-04",
    }));
  });
});

describe("evidência automática de ordem no payload financeiro", () => {
  it("preserva ordem P2 e composição sem transformar ordem em pagamento", () => {
    const snapshot = {
      publishedAt: manifest.publishedAt,
      source: manifest.source,
      portfolio: { fiscalYear: 2026 },
      schools: {
        "33136947": {
          school: { inep: "33136947", sme: "0410601", name: "EM Exemplo" },
          accounts: [
            { program: "PDDE", bank: "001", agency: "0249", account: "0000000001" },
          ],
          programs: [
            {
              name: "PDDE / PDDE Básico - Primeira Infância",
              installments: [
                {
                  installment: "P2",
                  programmedCents: 277500,
                  paymentInformedCents: 277500,
                  paymentInformedDate: null,
                  paymentOrderDate: "2026-09-14",
                  breakdown: {
                    programmedCusteioCents: 111000,
                    programmedCapitalCents: 166500,
                    paidCusteioCents: 111000,
                    paidCapitalCents: 166500,
                  },
                  account: null,
                },
              ],
            },
          ],
        },
      },
    };

    const payload = buildNormalizedPublicationPayload(snapshot, manifest);
    expect(payload.repasses).toEqual([
      expect.objectContaining({
        inep: "33136947",
        program: "PDDE BÁSICO",
        action: "PDDE Básico — Primeira Infância",
        installment: "P2",
        programmed: 2775,
        paid: 2775,
        programmedCusteio: 1110,
        programmedCapital: 1665,
        paidCusteio: 1110,
        paidCapital: 1665,
        paymentDate: null,
        paymentOrderDate: "2026-09-14",
      }),
    ]);
  });
});

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
