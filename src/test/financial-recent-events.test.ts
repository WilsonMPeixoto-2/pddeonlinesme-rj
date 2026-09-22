import { describe, expect, it } from "vitest";

import {
  buildRecentFinancialEvents,
  type RepasseFinanceiro,
} from "@/lib/financeiroPDDE";

function row(overrides: Partial<RepasseFinanceiro>): RepasseFinanceiro {
  return {
    id: "r1",
    unidade_id: "u1",
    designacao: "0410001",
    nome: "EM TESTE",
    inep: "33069247",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "2ª Parcela",
    ordem_exibicao: 2,
    valor_programado: 5000,
    valor_pago: 5000,
    data_pagamento: null,
    data_ordem_pagamento: null,
    conta_bancaria_id: null,
    banco: null,
    agencia: null,
    conta_corrente: null,
    custeio_programado: null,
    capital_programado: null,
    custeio_pago: null,
    capital_pago: null,
    ...overrides,
  };
}

describe("buildRecentFinancialEvents", () => {
  it("ordena os eventos pela data mais recente", () => {
    const events = buildRecentFinancialEvents([
      row({ id: "a", data_pagamento: "2026-09-14" }),
      row({ id: "b", unidade_id: "u2", data_pagamento: "2026-09-17" }),
    ], 2026);

    expect(events.map((event) => event.id)).toEqual(["b:pagamento", "a:pagamento"]);
  });

  it("não confunde pagamento informado com crédito bancário confirmado", () => {
    const [event] = buildRecentFinancialEvents([
      row({
        data_pagamento: "2026-09-17",
        credito_bancario_confirmado: false,
        data_credito_bancario: null,
      }),
    ], 2026);

    expect(event.stage).toBe("pagamento-informado");
  });

  it("prioriza crédito confirmado quando existe evidência bancária", () => {
    const [event] = buildRecentFinancialEvents([
      row({
        data_pagamento: "2026-09-17",
        credito_bancario_confirmado: true,
        data_credito_bancario: "2026-09-18",
      }),
    ], 2026);

    expect(event.stage).toBe("credito-confirmado");
    expect(event.dataEvento).toBe("2026-09-18");
  });

  it("exibe ordem emitida quando há valor informado e apenas data da ordem", () => {
    const [event] = buildRecentFinancialEvents([
      row({
        data_pagamento: null,
        data_ordem_pagamento: "2026-09-16",
      }),
    ], 2026);

    expect(event.stage).toBe("ordem-emitida");
  });

  it("não inventa evento quando só existe programação", () => {
    const events = buildRecentFinancialEvents([
      row({ valor_pago: null }),
    ], 2026);

    expect(events).toEqual([]);
  });
});
