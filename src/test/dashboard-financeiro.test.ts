import { describe, expect, it } from "vitest";

import {
  buildDashboardFinanceiroOverview,
  type ContaFinanceira,
  type RepasseFinanceiro,
} from "@/lib/financeiroPDDE";

const repasses: RepasseFinanceiro[] = [
  {
    id: "r1",
    unidade_id: "u1",
    designacao: "04.10.001 — Escola A",
    nome: "Escola A",
    inep: "1",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico",
    parcela: "1ª Parcela",
    ordem_exibicao: 1,
    valor_programado: 100,
    valor_pago: 100,
    data_pagamento: "2026-04-30",
    data_ordem_pagamento: "2026-04-29",
    conta_bancaria_id: "c1",
    banco: "001",
    agencia: "0001",
    conta_corrente: "100",
    custeio_programado: 60,
    capital_programado: 40,
    custeio_pago: 60,
    capital_pago: 40,
  },
  {
    id: "r2",
    unidade_id: "u2",
    designacao: "04.10.002 — Escola B",
    nome: "Escola B",
    inep: "2",
    exercicio: 2026,
    programa: "PDDE BÁSICO",
    acao: "PDDE Básico — Primeira Infância",
    parcela: "P1",
    ordem_exibicao: 1,
    valor_programado: 200,
    valor_pago: 200,
    data_pagamento: "2026-05-22",
    data_ordem_pagamento: "2026-05-21",
    conta_bancaria_id: "c2",
    banco: "001",
    agencia: "0001",
    conta_corrente: "200",
    custeio_programado: 120,
    capital_programado: 80,
    custeio_pago: 120,
    capital_pago: 80,
  },
  {
    id: "r3",
    unidade_id: "u2",
    designacao: "04.10.002 — Escola B",
    nome: "Escola B",
    inep: "2",
    exercicio: 2026,
    programa: "PDDE QUALIDADE",
    acao: "Educação Conectada",
    parcela: "Parcela única",
    ordem_exibicao: 1,
    valor_programado: 300,
    valor_pago: null,
    data_pagamento: null,
    data_ordem_pagamento: null,
    conta_bancaria_id: "c4",
    banco: "001",
    agencia: "0001",
    conta_corrente: "400",
    custeio_programado: null,
    capital_programado: null,
    custeio_pago: null,
    capital_pago: null,
  },
  {
    id: "r4",
    unidade_id: "u1",
    designacao: "04.10.001 — Escola A",
    nome: "Escola A",
    inep: "1",
    exercicio: 2026,
    programa: "PDDE QUALIDADE",
    acao: "Escola das Adolescências",
    parcela: "Parcela única",
    ordem_exibicao: 1,
    valor_programado: 50,
    valor_pago: 50,
    data_pagamento: "2026-06-12",
    data_ordem_pagamento: "2026-06-11",
    conta_bancaria_id: "c3",
    banco: "001",
    agencia: "0001",
    conta_corrente: "300",
    custeio_programado: 30,
    capital_programado: 20,
    custeio_pago: 30,
    capital_pago: 20,
  },
];

const contas: ContaFinanceira[] = [
  { id: "c1", unidade_id: "u1", programa: "PDDE BÁSICO", exercicio: 2026, banco: "001", agencia: "0001", conta_corrente: "100", principal: true },
  { id: "c2", unidade_id: "u2", programa: "PDDE BÁSICO", exercicio: 2026, banco: "001", agencia: "0001", conta_corrente: "200", principal: true },
  { id: "c3", unidade_id: "u1", programa: "PDDE QUALIDADE", exercicio: 2026, banco: "001", agencia: "0001", conta_corrente: "300", principal: false },
  { id: "c4", unidade_id: "u2", programa: "PDDE QUALIDADE", exercicio: 2026, banco: "001", agencia: "0001", conta_corrente: "400", principal: false },
  { id: "c5", unidade_id: "u1", programa: "PDDE EQUIDADE", exercicio: 2026, banco: "001", agencia: "0001", conta_corrente: "500", principal: false },
];

describe("buildDashboardFinanceiroOverview", () => {
  it("resume somente fatos do contrato financeiro canônico", () => {
    const overview = buildDashboardFinanceiroOverview(repasses, contas, 2026);

    expect(overview.totalProgramado).toBe(650);
    expect(overview.totalPagoIdentificado).toBe(350);
    expect(overview.pagamentosIdentificados).toBe(3);
    expect(overview.totalRepasses).toBe(4);
    expect(overview.totalContas).toBe(5);
    expect(overview.totalEscolas).toBe(2);
    expect(overview.ultimaDataPagamento).toBe("2026-06-12");

    expect(overview.primeiraParcela).toEqual({
      totalPago: 300,
      escolas: 2,
      custeioPago: 180,
      capitalPago: 120,
      detalhamentoCompleto: 2,
      ultimaDataPagamento: "2026-05-22",
    });

    expect(overview.porPrograma).toEqual([
      expect.objectContaining({ programa: "PDDE BÁSICO", totalProgramado: 300, totalPago: 300, contas: 2 }),
      expect.objectContaining({ programa: "PDDE QUALIDADE", totalProgramado: 350, totalPago: 50, contas: 2 }),
      expect.objectContaining({ programa: "PDDE EQUIDADE", totalProgramado: null, totalPago: null, contas: 1 }),
    ]);
  });

  it("preserva ausência de detalhamento em vez de convertê-la em zero", () => {
    const incompleto = repasses.map((repasse) =>
      repasse.id === "r2" ? { ...repasse, custeio_pago: null } : repasse,
    );

    const overview = buildDashboardFinanceiroOverview(incompleto, contas, 2026);

    expect(overview.primeiraParcela.custeioPago).toBeNull();
    expect(overview.primeiraParcela.capitalPago).toBe(120);
    expect(overview.primeiraParcela.detalhamentoCompleto).toBe(1);
  });
});
