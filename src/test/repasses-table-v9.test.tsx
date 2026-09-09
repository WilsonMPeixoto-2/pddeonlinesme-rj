import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: [
      {
        id: "repasse-1",
        unidade_id: "unidade-1",
        designacao: "04.10.001 — EM EMA NEGRÃO DE LIMA",
        nome: "EM EMA NEGRÃO DE LIMA",
        inep: "33069247",
        exercicio: 2026,
        programa: "PDDE BÁSICO",
        acao: "PDDE Básico",
        parcela: "1ª Parcela",
        ordem_exibicao: 1,
        valor_programado: 4185,
        valor_pago: 4185,
        data_pagamento: "2026-08-05",
        data_ordem_pagamento: "2026-08-04",
        conta_bancaria_id: "conta-1",
        banco: "001",
        agencia: "0249",
        conta_corrente: "0000549789",
        custeio_programado: 837,
        capital_programado: 3348,
        custeio_pago: 837,
        capital_pago: 3348,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useExercicio", () => ({
  useExercicio: () => ({ exercicio: "2026" }),
}));

vi.mock("@/components/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import Repasses from "@/pages/Repasses";

describe("Repasses com TanStack Table v9", () => {
  it("renderiza o cabeçalho textual Ação sem lançar exceção", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <Repasses />
        </MemoryRouter>,
      ),
    ).not.toThrow();

    expect(screen.getByText("Ação")).toBeInTheDocument();
    expect(screen.getAllByText("PDDE Básico").length).toBeGreaterThan(0);
  });
});
