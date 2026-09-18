import { describe, expect, it } from "vitest";

import {
  buildSegundaParcelaOverview,
  type RepasseFinanceiro,
} from "@/lib/financeiroPDDE";

const base = (overrides: Partial<RepasseFinanceiro>): RepasseFinanceiro => ({
  id: "r",
  unidade_id: "u",
  designacao: "04.10.001 — Escola",
  nome: "Escola",
  inep: "33000001",
  exercicio: 2026,
  programa: "PDDE BÁSICO",
  acao: "PDDE Básico — Primeira Infância",
  parcela: "P2",
  ordem_exibicao: 2,
  valor_programado: 100,
  valor_pago: 100,
  data_pagamento: null,
  data_ordem_pagamento: "2026-09-14",
  conta_bancaria_id: null,
  banco: null,
  agencia: null,
  conta_corrente: null,
  custeio_programado: 60,
  capital_programado: 40,
  custeio_pago: 60,
  capital_pago: 40,
  ...overrides,
});

describe("buildSegundaParcelaOverview", () => {
  it("consolida escolas, composição e ordem sem inventar crédito", () => {
    const overview = buildSegundaParcelaOverview([
      base({ id: "a", unidade_id: "u1", designacao: "04.10.001 — Escola A", valor_pago: 120, custeio_pago: 70, capital_pago: 50 }),
      base({ id: "b", unidade_id: "u2", designacao: "04.10.002 — Escola B", valor_pago: 80, custeio_pago: 30, capital_pago: 50 }),
    ], 2026);

    expect(overview.totalInformado).toBe(200);
    expect(overview.custeioTotal).toBe(100);
    expect(overview.capitalTotal).toBe(100);
    expect(overview.escolas).toHaveLength(2);
    expect(overview.ordensIdentificadas).toBe(2);
    expect(overview.pagamentosIdentificados).toBe(0);
    expect(overview.ultimaDataOrdem).toBe("2026-09-14");
    expect(overview.ultimaDataPagamento).toBeNull();
    expect(overview.escolas[0]).toEqual(expect.objectContaining({
      designacao: "04.10.001 — Escola A",
      status: "ordem-emitida",
      valorInformado: 120,
    }));
  });

  it("promove somente a unidade com data de crédito para pagamento identificado", () => {
    const overview = buildSegundaParcelaOverview([
      base({ id: "a", unidade_id: "u1" }),
      base({
        id: "b",
        unidade_id: "u2",
        designacao: "04.10.002 — Escola B",
        data_pagamento: "2026-09-18",
      }),
    ], 2026);

    expect(overview.pagamentosIdentificados).toBe(1);
    expect(overview.ultimaDataPagamento).toBe("2026-09-18");
    expect(overview.escolas.find((row) => row.unidadeId === "u1")?.status).toBe("ordem-emitida");
    expect(overview.escolas.find((row) => row.unidadeId === "u2")?.status).toBe("pagamento-identificado");
  });

  it("preserva composição ausente como ausência", () => {
    const overview = buildSegundaParcelaOverview([
      base({ id: "a", unidade_id: "u1", custeio_pago: null }),
    ], 2026);

    expect(overview.custeioTotal).toBeNull();
    expect(overview.capitalTotal).toBe(40);
    expect(overview.escolas[0].custeio).toBeNull();
  });
});
