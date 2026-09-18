import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SegundaParcelaResumo } from "@/components/SegundaParcelaResumo";
import { SegundaParcelaUnidadeResumo } from "@/components/SegundaParcelaUnidadeResumo";
import type { SegundaParcelaOverview } from "@/lib/financeiroPDDE";

const overview: SegundaParcelaOverview = {
  exercicio: 2026,
  totalInformado: 132630,
  custeioTotal: 81034,
  capitalTotal: 51596,
  ordensIdentificadas: 52,
  pagamentosIdentificados: 0,
  ultimaDataOrdem: "2026-09-14",
  ultimaDataPagamento: null,
  escolas: [
    {
      unidadeId: "u1",
      designacao: "04.10.601 — CM MANGUINHOS",
      nome: "CM MANGUINHOS",
      inep: "33136947",
      acao: "Primeira Infância",
      valorInformado: 2775,
      custeio: 1110,
      capital: 1665,
      dataOrdem: "2026-09-14",
      dataPagamento: null,
      status: "ordem-emitida",
    },
  ],
};

describe("superfície do segundo ciclo", () => {
  it("expõe no Painel total, composição, unidade e ausência de crédito confirmado", () => {
    render(
      <MemoryRouter>
        <SegundaParcelaResumo overview={overview} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/132\.630,00/)).toBeVisible();
    expect(screen.getByText(/81\.034,00/)).toBeVisible();
    expect(screen.getByText(/51\.596,00/)).toBeVisible();
    expect(screen.getByText("04.10.601 — CM MANGUINHOS")).toBeVisible();
    expect(screen.getByText(/Crédito bancário ainda não confirmado/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Ver todas as 1/i })).toHaveAttribute("href", "/repasses?ciclo=2");
  });

  it("expõe a ordem na unidade sem convertê-la em recebimento", () => {
    render(<SegundaParcelaUnidadeResumo escola={overview.escolas[0]} />);

    expect(screen.getByText(/2\.775,00/)).toBeVisible();
    expect(screen.getByText(/1\.110,00/)).toBeVisible();
    expect(screen.getByText(/1\.665,00/)).toBeVisible();
    expect(screen.getByText(/14\/09\/2026/)).toBeVisible();
    expect(screen.getByText(/Crédito bancário ainda não confirmado/i)).toBeVisible();
    expect(screen.queryByText(/Recebido/i)).not.toBeInTheDocument();
  });
});
