import { describe, expect, it } from "vitest";
import {
  buildPrimeiraParcelaOverview,
  groupFinanceiroByProgram,
  type ContaFinanceira,
  type RepasseFinanceiro,
} from "./financeiroPDDE";

const repasses: RepasseFinanceiro[] = [
  {
    id: "r1",
    unidade_id: "u1",
    designacao: "04.10.001 — EM Alfa",
    nome: "EM Alfa",
    inep: "33000001",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "1ª Parcela",
    ordem_exibicao: 1,
    valor_programado: 6000,
    valor_pago: 6000,
    data_pagamento: "2026-04-30",
    data_ordem_pagamento: "2026-04-29",
    conta_bancaria_id: "c1",
    banco: "001",
    agencia: "1234",
    conta_corrente: "999-9",
    custeio_programado: null,
    capital_programado: null,
    custeio_pago: null,
    capital_pago: null,
  },
  {
    id: "r2",
    unidade_id: "u2",
    designacao: "04.10.002 — EM Beta",
    nome: "EM Beta",
    inep: "33000002",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico — Primeira Infância",
    parcela: "P1",
    ordem_exibicao: 1,
    valor_programado: 2000,
    valor_pago: 2000,
    data_pagamento: "2026-05-22",
    data_ordem_pagamento: null,
    conta_bancaria_id: "c2",
    banco: "001",
    agencia: "1234",
    conta_corrente: "888-8",
    custeio_programado: 1500,
    capital_programado: 500,
    custeio_pago: 1500,
    capital_pago: 500,
  },
  {
    id: "r3",
    unidade_id: "u1",
    designacao: "04.10.001 — EM Alfa",
    nome: "EM Alfa",
    inep: "33000001",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "2ª Parcela",
    ordem_exibicao: 2,
    valor_programado: 6000,
    valor_pago: null,
    data_pagamento: null,
    data_ordem_pagamento: null,
    conta_bancaria_id: "c1",
    banco: "001",
    agencia: "1234",
    conta_corrente: "999-9",
    custeio_programado: 4000,
    capital_programado: 2000,
    custeio_pago: null,
    capital_pago: null,
  },
];

const contas: ContaFinanceira[] = [
  { id: "c1", unidade_id: "u1", programa: "PDDE BÁSICO", exercicio: 2026, banco: "001", agencia: "1234", conta_corrente: "999-9", principal: true },
  { id: "c3", unidade_id: "u1", programa: "PDDE BÁSICO", exercicio: 2026, banco: "001", agencia: "4321", conta_corrente: "777-7", principal: false },
  { id: "c4", unidade_id: "u1", programa: "PDDE EQUIDADE", exercicio: 2026, banco: "001", agencia: "4321", conta_corrente: "555-5", principal: false },
];

describe("financeiroPDDE", () => {
  it("monta o recorte completo da primeira parcela sem incluir valores apenas programados", () => {
    const overview = buildPrimeiraParcelaOverview(repasses, 2026);

    expect(overview.totalPago).toBe(8000);
    expect(overview.escolas).toHaveLength(2);
    expect(overview.mediana).toBe(4000);
    expect(overview.porAcao.map((item) => [item.acao, item.total])).toEqual([
      ["PDDE Básico", 6000],
      ["Primeira Infância", 2000],
    ]);
    expect(overview.porData.map((item) => item.data)).toEqual(["2026-04-30", "2026-05-22"]);
  });

  it("preserva varias contas do mesmo programa e programas sem repasse", () => {
    const programas = groupFinanceiroByProgram(contas, repasses.filter((r) => r.unidade_id === "u1"), 2026);

    const basico = programas.find((p) => p.programa === "PDDE BÁSICO");
    const equidade = programas.find((p) => p.programa === "PDDE EQUIDADE");

    expect(basico?.contas).toHaveLength(2);
    expect(basico?.acoes[0].parcelas).toHaveLength(2);
    expect(equidade?.contas).toHaveLength(1);
    expect(equidade?.acoes).toHaveLength(0);
  });

  it("não transforma null em zero no detalhamento financeiro", () => {
    const programas = groupFinanceiroByProgram(contas, repasses.filter((r) => r.unidade_id === "u1"), 2026);
    const primeira = programas[0].acoes[0].parcelas[0];

    expect(primeira.custeioPago).toBeNull();
    expect(primeira.capitalPago).toBeNull();
  });
});
