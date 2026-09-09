import { describe, expect, it } from "vitest";
import {
  normalizeOptionalText,
  toUnidadesEscolaresUpdate,
  validateUnidadeCadastro,
  type UnidadeCadastroFormValues,
} from "./unidadeCadastro";

const validValues: UnidadeCadastroFormValues = {
  nome: "Escola Municipal Alfa",
  diretor: "Maria Teste",
  endereco: "Rua Alfa, 123",
  email: "escola@sme.rio",
};

describe("unidadeCadastro", () => {
  it("normaliza texto opcional sem perder zeros ou caracteres", () => {
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

  it("rejeita apagar diretor existente sem substituto", () => {
    const errors = validateUnidadeCadastro(
      { ...validValues, diretor: " " },
      { designacao: "EM ALFA", diretorAtual: "Maria Teste" },
    );

    expect(errors).toContain("Diretor(a) nao pode ser apagado sem substituto.");
  });

  it("gera payload apenas com dados cadastrais da unidade", () => {
    expect(toUnidadesEscolaresUpdate(validValues)).toEqual({
      nome: "Escola Municipal Alfa",
      diretor: "Maria Teste",
      endereco: "Rua Alfa, 123",
    });
  });
});
