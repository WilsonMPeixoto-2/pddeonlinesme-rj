import { describe, expect, it } from "vitest";

import { buildNormalizedPublicationPayload } from "../../scripts/lib/financial-publication.mjs";

interface NormalizedAccount {
  program: string;
  account: string;
  primary: boolean;
}

interface NormalizedRepasse {
  program: string;
  action: string;
  installment: string;
  programmed: number;
  paid: number | null;
  paidCusteio: number | null;
  paidCapital: number | null;
  paymentDate: string | null;
}

interface NormalizedPayload {
  exercise: number;
  accounts: NormalizedAccount[];
  repasses: NormalizedRepasse[];
  source: {
    origin: string;
    publishedAt: string;
    workflowRunId: number;
    artifactId: number;
    artifactName: string;
  };
}

const manifest = {
  encoding: "gzip-base64-parts",
  parts: ["/data/pdde-2026-snapshot.part01.txt"],
  publishedAt: "2026-09-09T13:50:50.872Z",
  source: {
    workflowRunId: 34355577593,
    artifactId: 10107480089,
    artifactName: "sigef-full-163-2026",
  },
};

const snapshot = {
  publishedAt: manifest.publishedAt,
  source: manifest.source,
  portfolio: { fiscalYear: 2026, schoolCount: 1 },
  schools: {
    "33069093": {
      fiscalYear: 2026,
      school: {
        inep: "33069093",
        sme: "0410002",
        name: "EM ALBINO SOUZA CRUZ",
        uex: "CEC DA EM ALBINO SOUZA CRUZ",
        cnpj: "01856391000103",
      },
      programs: [
        {
          name: "PDDE / PDDE Básico",
          installments: [
            {
              installment: "1ª Parcela",
              programmedCents: 506500,
              paymentInformedCents: 506500,
              breakdown: {
                programmedCusteioCents: 101300,
                programmedCapitalCents: 405200,
                adjustmentCusteioCents: null,
                adjustmentCapitalCents: null,
                paidCusteioCents: 101300,
                paidCapitalCents: 405200,
              },
              paymentInformedDate: "2026-08-05",
              paymentOrderDate: "2026-08-04",
              account: { bank: "001", agency: "0249", number: "0000549797" },
              creditEvidence: { status: "Crédito localizado", date: "2026-08-06", amountCents: 506500, document: "OB123" },
              note: null,
            },
            {
              installment: "2ª Parcela",
              programmedCents: 506500,
              paymentInformedCents: 0,
              breakdown: {
                programmedCusteioCents: null,
                programmedCapitalCents: null,
                adjustmentCusteioCents: null,
                adjustmentCapitalCents: null,
                paidCusteioCents: null,
                paidCapitalCents: null,
              },
              paymentInformedDate: null,
              paymentOrderDate: null,
              account: { bank: "001", agency: "0249", number: "0000549797" },
              creditEvidence: { status: "Pagamento não informado", date: null, amountCents: null, document: null },
              note: null,
            },
          ],
        },
        {
          name: "PDDE QUALIDADE / Educação Conectada 2026",
          installments: [
            {
              installment: null,
              programmedCents: 332800,
              paymentInformedCents: 0,
              paymentInformedDate: null,
              paymentOrderDate: null,
              account: { bank: "001", agency: "0249", number: "0000546032" },
              creditEvidence: { status: "Pagamento não informado", date: null, amountCents: null, document: null },
              note: null,
            },
          ],
        },
      ],
      accounts: [
        { program: "PDDE", bank: "001", agency: "0249", account: "0000549797", positions: [], latestPosition: null, movements: [], note: null },
        { program: "PDDE", bank: "001", agency: "0249", account: "0000549798", positions: [], latestPosition: null, movements: [], note: null },
        { program: "PDDE QUALIDADE", bank: "001", agency: "0249", account: "0000546032", positions: [], latestPosition: null, movements: [], note: null },
      ],
      accounting: [],
      followUp: [],
    },
  },
};

describe("buildNormalizedPublicationPayload", () => {
  it("preserva múltiplas contas e classifica programa/ação sem colapsar identidade", () => {
    const payload = buildNormalizedPublicationPayload(snapshot, manifest) as NormalizedPayload;

    expect(payload.accounts).toHaveLength(3);
    expect(payload.accounts.filter((account) => account.program === "PDDE BÁSICO")).toHaveLength(2);
    expect(payload.accounts.filter((account) => account.primary)).toHaveLength(1);
    expect(payload.accounts.find((account) => account.account === "0000546032")?.program).toBe("PDDE QUALIDADE");

    expect(payload.repasses.map((repasse) => [repasse.program, repasse.action, repasse.installment])).toEqual([
      ["PDDE BÁSICO", "PDDE Básico", "1ª Parcela"],
      ["PDDE BÁSICO", "PDDE Básico", "2ª Parcela"],
      ["PDDE QUALIDADE", "Educação Conectada", "Parcela única"],
    ]);
  });

  it("converte centavos para reais e mantém pagamento não informado como null", () => {
    const payload = buildNormalizedPublicationPayload(snapshot, manifest) as NormalizedPayload;
    const first = payload.repasses[0];
    const second = payload.repasses[1];
    const qualidade = payload.repasses[2];

    expect(first.programmed).toBe(5065);
    expect(first.paid).toBe(5065);
    expect(first.paidCusteio).toBe(1013);
    expect(first.paidCapital).toBe(4052);
    expect(first.paymentDate).toBe("2026-08-05");

    expect(second.programmed).toBe(5065);
    expect(second.paid).toBeNull();
    expect(second.paidCusteio).toBeNull();
    expect(second.paidCapital).toBeNull();
    expect(qualidade.paid).toBeNull();
  });

  it("carrega proveniência somente no payload de backend", () => {
    const payload = buildNormalizedPublicationPayload(snapshot, manifest) as NormalizedPayload;

    expect(payload.exercise).toBe(2026);
    expect(payload.source).toEqual({
      origin: "pdde-repasse-conciliador",
      publishedAt: manifest.publishedAt,
      workflowRunId: manifest.source.workflowRunId,
      artifactId: manifest.source.artifactId,
      artifactName: manifest.source.artifactName,
    });
  });
});
