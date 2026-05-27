import { describe, expect, it } from "vitest";
import {
  normalizeOptionalText,
  toContasBancariasUpdate,
  toUnidadesEscolaresUpdate,
  validateUnidadeCadastro,
  type UnidadeCadastroFormValues,
} from "./unidadeCadastro";

const validValues: UnidadeCadastroFormValues = {
  nome: "Escola Municipal Alfa",
  diretor: "Maria Teste",
  endereco: "Rua Alfa, 123",
  banco: "Banco do Brasil",
  agencia: "0123-X",
  conta_corrente: "000123-4",
};

describe("unidadeCadastro", () => {
  it("normaliza texto opcional preservando formatos bancarios", () => {
    expect(normalizeOptionalText("  0012-X  ")).toBe("0012-X");
    expect(normalizeOptionalText("   ")).toBeNull();
  });

  it("valida campos obrigatorios do cadastro minimo", () => {
    const errors = validateUnidadeCadastro(
      { ...validValues, nome: " " },
      { designacao: "", diretorAtual: "Maria Teste" },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        "Nome e obrigatorio.",
        "Designacao e obrigatoria no cadastro atual.",
      ]),
    );
  });

  it("rejeita formatos bancarios fora do contrato", () => {
    const errors = validateUnidadeCadastro(
      {
        ...validValues,
        agencia: "0123@",
        conta_corrente: "000 123",
      },
      { designacao: "EM ALFA", diretorAtual: "Maria Teste" },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        "Agencia aceita apenas digitos, hifen e X.",
        "Conta corrente aceita apenas digitos, hifen, ponto, barra e X.",
      ]),
    );
  });

  it("rejeita apagar diretor existente sem substituto", () => {
    const errors = validateUnidadeCadastro(
      { ...validValues, diretor: " " },
      { designacao: "EM ALFA", diretorAtual: "Maria Teste" },
    );

    expect(errors).toContain("Diretor(a) nao pode ser apagado sem substituto.");
  });

  it("gera payload de update da unidade sem converter dados bancarios para numero", () => {
    expect(toUnidadesEscolaresUpdate(validValues)).toMatchObject({
      nome: "Escola Municipal Alfa",
      diretor: "Maria Teste",
      endereco: "Rua Alfa, 123",
      agencia: "0123-X",
      conta_corrente: "000123-4",
    });
  });

  it("gera payload de update da conta bancaria incluindo banco editavel", () => {
    expect(toContasBancariasUpdate(validValues)).toMatchObject({
      banco: "Banco do Brasil",
      agencia: "0123-X",
      conta_corrente: "000123-4",
    });
  });
});
