import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecursosPDDEPanel } from "@/components/RecursosPDDEPanel";
import type { ProgramaFinanceiro } from "@/lib/financeiroPDDE";

const programas: ProgramaFinanceiro[] = [
  {
    programa: "PDDE BÁSICO",
    contas: [
      {
        id: "c1",
        unidade_id: "u1",
        programa: "PDDE BÁSICO",
        exercicio: 2026,
        banco: "001",
        agencia: "0249",
        conta_corrente: "0000549789",
        principal: true,
      },
      {
        id: "c2",
        unidade_id: "u1",
        programa: "PDDE BÁSICO",
        exercicio: 2026,
        banco: "001",
        agencia: "0249",
        conta_corrente: "0000549790",
        principal: false,
      },
    ],
    acoes: [
      {
        acao: "PDDE Básico",
        label: "PDDE Básico",
        parcelas: [
          {
            id: "r1",
            parcela: "1ª Parcela",
            ordem: 1,
            valorProgramado: 4185,
            valorPago: 4185,
            dataPagamento: "2026-08-05",
            dataOrdemPagamento: "2026-08-04",
            contaBancariaId: "c1",
            custeioProgramado: 837,
            capitalProgramado: 3348,
            custeioPago: 837,
            capitalPago: 3348,
          },
          {
            id: "r2",
            parcela: "2ª Parcela",
            ordem: 2,
            valorProgramado: 4185,
            valorPago: null,
            dataPagamento: null,
            dataOrdemPagamento: null,
            contaBancariaId: "c1",
            custeioProgramado: 837,
            capitalProgramado: 3348,
            custeioPago: null,
            capitalPago: null,
          },
        ],
      },
    ],
  },
  {
    programa: "PDDE EQUIDADE",
    contas: [
      {
        id: "c3",
        unidade_id: "u1",
        programa: "PDDE EQUIDADE",
        exercicio: 2026,
        banco: "001",
        agencia: "0249",
        conta_corrente: "0000500000",
        principal: false,
      },
    ],
    acoes: [],
  },
];

describe("RecursosPDDEPanel", () => {
  it("destaca programa, múltiplas contas, parcela e datas sem metadados técnicos", () => {
    render(<RecursosPDDEPanel programas={programas} />);

    expect(screen.getByText("PDDE BÁSICO")).toBeVisible();
    expect(screen.getByText("PDDE EQUIDADE")).toBeVisible();
    expect(screen.getByText("Repasse · 1ª parcela")).toBeVisible();
    expect(screen.getByText("2ª parcela")).toBeVisible();
    expect(screen.getAllByText("Banco do Brasil · 001")).toHaveLength(3);
    expect(screen.getByText("05/08/2026")).toBeVisible();
    expect(screen.getByText("04/08/2026")).toBeVisible();
    expect(screen.getByText("R$ 837,00")).toBeVisible();
    expect(screen.getByText("R$ 3.348,00")).toBeVisible();
    expect(screen.getByText("Nenhum repasse associado a este programa no recorte atual.")).toBeVisible();

    expect(screen.queryByText(/BASE importada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total Parcelas/i)).not.toBeInTheDocument();
  });
});
