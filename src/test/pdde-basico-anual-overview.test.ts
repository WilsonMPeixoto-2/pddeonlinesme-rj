import { describe, expect, it } from "vitest";

import {
  buildPDDEBasicoAnualOverview,
  type RepasseFinanceiro,
} from "@/lib/financeiroPDDE";

const base = (overrides: Partial<RepasseFinanceiro>): RepasseFinanceiro => ({
  id: "r",
  unidade_id: "u1",
  designacao: "04.10.001 — Escola A",
  nome: "Escola A",
  inep: "33000001",
  exercicio: 2026,
  programa: "PDDE BÁSICO",
  acao: "PDDE Básico",
  parcela: "1ª Parcela",
  ordem_exibicao: 1,
  valor_programado: 1000,
  valor_pago: 1000,
  data_pagamento: "2026-08-05",
  data_ordem_pagamento: "2026-08-04",
  conta_bancaria_id: null,
  banco: null,
  agencia: null,
  conta_corrente: null,
  custeio_programado: 700,
  capital_programado: 300,
  custeio_pago: 700,
  capital_pago: 300,
  ...overrides,
});

describe("buildPDDEBasicoAnualOverview", () => {
  it("soma os dois ciclos de repasses por unidade sem depender de crédito bancário", () => {
    const overview = buildPDDEBasicoAnualOverview([
      base({ id: "a1", unidade_id: "u1", valor_pago: 1000 }),
      base({
        id: "a2",
        unidade_id: "u1",
        parcela: "2ª Parcela",
        ordem_exibicao: 2,
        valor_pago: 800,
        data_pagamento: "2026-09-17",
        credito_bancario_confirmado: false,
      }),
      base({
        id: "b1",
        unidade_id: "u2",
        designacao: "04.10.002 — Escola B",
        nome: "Escola B",
        acao: "PDDE Básico — Primeira Infância",
        parcela: "P1",
        valor_pago: 500,
        data_pagamento: "2026-04-30",
      }),
      base({
        id: "b2",
        unidade_id: "u2",
        designacao: "04.10.002 — Escola B",
        nome: "Escola B",
        acao: "PDDE Básico — Primeira Infância",
        parcela: "P2",
        ordem_exibicao: 2,
        valor_pago: 500,
        data_pagamento: "2026-09-15",
      }),
    ], 2026);

    expect(overview.totalPrimeiroCiclo).toBe(1500);
    expect(overview.totalSegundoCiclo).toBe(1300);
    expect(overview.totalAnual).toBe(2800);
    expect(overview.escolasComDoisCiclos).toBe(2);
    expect(overview.escolas).toHaveLength(2);
    expect(overview.escolas.find((row) => row.unidadeId === "u1")).toMatchObject({
      primeiroCiclo: 1000,
      segundoCiclo: 800,
      totalAnual: 1800,
    });
  });

  it("não promove ordem sem data de pagamento ao total anual recebido", () => {
    const overview = buildPDDEBasicoAnualOverview([
      base({
        id: "order-only",
        parcela: "2ª Parcela",
        valor_pago: 900,
        data_pagamento: null,
        data_ordem_pagamento: "2026-09-16",
      }),
    ], 2026);

    expect(overview.totalAnual).toBe(0);
    expect(overview.escolas).toHaveLength(0);
  });

  it("ignora programas e parcelas fora dos dois ciclos do PDDE Básico", () => {
    const overview = buildPDDEBasicoAnualOverview([
      base({ id: "qualidade", programa: "PDDE QUALIDADE" }),
      base({ id: "outro", parcela: "Complementar" }),
    ], 2026);

    expect(overview.totalAnual).toBe(0);
    expect(overview.escolas).toHaveLength(0);
  });
});
