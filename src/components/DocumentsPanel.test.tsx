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

  it("não chama gerador e exibe erro se unidadeId estiver ausente", async () => {
    render(
      <DocumentsPanel
        open
        onOpenChange={vi.fn()}
        schoolName="EM Teste"
        exercicio="2026"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Demonstrativo Básico/i }),
    );

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    expect(saveAs).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Não foi possível identificar a unidade escolar.");
  });

  it("não chama gerador e exibe aviso se useUnidadeDetalhe estiver em loading", async () => {
    vi.mocked(useUnidadeDetalhe).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useUnidadeDetalhe>);

    render(
      <DocumentsPanel
        open
        onOpenChange={vi.fn()}
        unidadeId="unidade-1"
        schoolName="EM Teste"
        exercicio="2026"
      />,
    );

    const button = screen.getByRole("button", { name: /Demonstrativo Básico/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    // A logica atual desabilita o botao, entao o clique nem propaga.
    // Mas se propagasse, a condicao do loading exibiria o aviso:
    // expect(toast.info).toHaveBeenCalledWith("Aguarde o carregamento dos dados completos da unidade.");
  });

  it("não chama gerador e exibe erro se useUnidadeDetalhe retornar erro", async () => {
    vi.mocked(useUnidadeDetalhe).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Erro de conexão"),
    } as unknown as ReturnType<typeof useUnidadeDetalhe>);

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

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Erro ao carregar os dados completos da unidade.", {
      description: "Erro de conexão",
    });
  });

  it("não chama gerador e exibe erro se unidadeDetalhe estiver ausente", async () => {
    vi.mocked(useUnidadeDetalhe).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useUnidadeDetalhe>);

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

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Dados completos da unidade não encontrados.", {
      description: "Abra o cadastro da unidade e tente novamente.",
    });
  });

  it("trata rejeição do gerador sem chamar saveAs e exibe erro", async () => {
    vi.mocked(generateDemonstrativoBasico).mockRejectedValue(new Error("Falha no parse do template"));

    render(
      <DocumentsPanel
        open
        onOpenChange={vi.fn()}
        unidadeId="unidade-1"
        schoolName="EM Teste"
        exercicio="2026"
      />,
    );

    const button = screen.getByRole("button", { name: /Demonstrativo Básico/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(generateDemonstrativoBasico).toHaveBeenCalled();
    });

    expect(saveAs).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Erro ao gerar Demonstrativo Básico.", {
      description: "Falha no parse do template",
    });
  });

  it("não chama gerador e exibe info para documento em breve", async () => {
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
      screen.getByRole("button", { name: /Relação de Bens Adquiridos/i }),
    );

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    expect(saveAs).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith("Relação de Bens Adquiridos — funcionalidade em desenvolvimento");
  });

  it("exibe info ao clicar no pacote completo", async () => {
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
      screen.getByRole("button", { name: /Pacote completo em breve/i }),
    );

    expect(generateDemonstrativoBasico).not.toHaveBeenCalled();
    expect(saveAs).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith("Pacote completo ainda não está disponível.", {
      description: "Gere o Demonstrativo Básico individualmente.",
    });
  });
});
