import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { useUnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { generateDemonstrativoBasico } from "@/lib/demonstrativo/generateDemonstrativoBasico";
import { DocumentsPanel } from "./DocumentsPanel";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/useUnidadeDetalhe", () => ({
  useUnidadeDetalhe: vi.fn(),
}));

vi.mock("@/lib/demonstrativo/generateDemonstrativoBasico", () => ({
  generateDemonstrativoBasico: vi.fn(),
}));

const unidadeDetalhe = {
  unidade_id: "unidade-1",
  designacao: "04.10.001 - EM Teste",
  nome: "EM Teste",
  inep: "33000000",
  cnpj: "00000000000100",
  diretor: "Diretora Teste",
  endereco: "Rua Teste",
  banco: "Banco do Brasil",
  agencia: "1234",
  conta_corrente: "5678-9",
  exercicio: 2026,
  programa: "basico",
  reprogramado_custeio: 10,
  reprogramado_capital: 20,
  parcela_1_custeio: 30,
  parcela_1_capital: 40,
  parcela_2_custeio: 50,
  parcela_2_capital: 60,
  total_reprogramado: 30,
  total_parcelas: 180,
  total_disponivel_inicial: 210,
  updated_at: "2026-01-01T00:00:00Z",
} as UnidadeDetalhe;

const memoria = {
  nome: "EM Teste",
  cnpj: "00000000000100",
  endereco: "Rua Teste",
  agencia: "1234",
  contaCorrente: "5678-9",
  diretor: "Diretora Teste",
  reprogramadoCusteio: 10,
  reprogramadoCapital: 20,
  parcela1Custeio: 30,
  parcela1Capital: 40,
  parcela2Custeio: 50,
  parcela2Capital: 60,
};

describe("DocumentsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUnidadeDetalhe).mockReturnValue({
      data: unidadeDetalhe,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useUnidadeDetalhe>);
  });

  it("gera o Demonstrativo Basico real e dispara download pelo painel", async () => {
    const blob = new Blob(["xlsx"]);
    vi.mocked(generateDemonstrativoBasico).mockResolvedValue({
      blob,
      fileName: "Demonstrativo_Basico_2026_EM_Teste.xlsx",
      memoria,
    });

    render(
      <DocumentsPanel
        open
        onOpenChange={vi.fn()}
        unidadeId="unidade-1"
        schoolName="EM Teste"
        exercicio="2026"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Demonstrativo Básico/i }),
    );

    await waitFor(() => {
      expect(generateDemonstrativoBasico).toHaveBeenCalledWith(unidadeDetalhe, "2026");
    });
    expect(saveAs).toHaveBeenCalledWith(
      blob,
      "Demonstrativo_Basico_2026_EM_Teste.xlsx",
    );
    expect(toast.success).toHaveBeenCalledWith("Demonstrativo Básico gerado.", {
      description: "Demonstrativo_Basico_2026_EM_Teste.xlsx",
    });
  });
});
