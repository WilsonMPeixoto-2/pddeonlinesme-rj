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
  escolasEsperadas: 163,
  coberturaPagamento: 1,
  coberturaPagamentoCompleta: true,
  escolasRegularesPagas: 111,
  escolasPrimeiraInfanciaPagas: 52,
  ordensIdentificadas: 0,
  pagamentosIdentificados: 163,
  creditosBancariosConfirmados: 0,
  ordensSemCredito: 0,
  ultimaDataOrdem: null,
  ultimaDataPagamento: "2026-09-17",
  ultimaDataCreditoBancario: null,
  escolas: [
    {
      unidadeId: "u1",
      designacao: "04.10.601 — CM MANGUINHOS",
      nome: "CM MANGUINHOS",
      inep: "33136947",
      acao: "Primeira Infância",
      trilho: "primeira-infancia",
      valorInformado: 2775,
      custeio: 1110,
      capital: 1665,
      dataOrdem: null,
      dataPagamento: "2026-09-17",
      dataCreditoBancario: null,
      status: "pagamento-informado",
    },
  ],
};

describe("superfície do segundo ciclo", () => {
  it("expõe pagamento informado sem promovê-lo a crédito bancário confirmado", () => {
    render(
      <MemoryRouter>
        <SegundaParcelaResumo overview={overview} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/132\.630,00/)).toBeVisible();
    expect(screen.getByText(/81\.034,00/)).toBeVisible();
    expect(screen.getByText(/51\.596,00/)).toBeVisible();
    expect(screen.getByText("04.10.601 — CM MANGUINHOS")).toBeVisible();
    expect(screen.getAllByText(/Pagamento informado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Fonte bancária pública ainda sem cobertura suficiente/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Ver todas as 1/i })).toHaveAttribute("href", "/repasses?ciclo=2");
  });

  it("expõe o pagamento informado na unidade sem inventar crédito bancário", () => {
    render(<SegundaParcelaUnidadeResumo escola={overview.escolas[0]} />);

    expect(screen.getByText(/2\.775,00/)).toBeVisible();
    expect(screen.getByText(/1\.110,00/)).toBeVisible();
    expect(screen.getByText(/1\.665,00/)).toBeVisible();
    expect(screen.getByText(/17\/09\/2026/)).toBeVisible();
    expect(screen.getByText(/Crédito bancário independente ainda não confirmado/i)).toBeVisible();
    expect(screen.queryByText(/Recebido/i)).not.toBeInTheDocument();
  });
});
