import { describe, expect, it } from "vitest";
import { recognizeColumn } from "../columnAliases";

describe("recognizeColumn — chaves", () => {
  it.each([
    ["Designação", "designacao"],
    ["DESIGNACAO", "designacao"],
    ["unidade", "designacao"],
    ["CODIGO DA UNIDADE", "designacao"],
    ["cod_unidade", "designacao"],
    ["INEP", "inep"],
    ["Código INEP", "inep"],
    ["cod inep", "inep"],
    ["CNPJ", "cnpj"],
    ["cnpj cec", "cnpj"],
    ["CNPJ UEx", "cnpj"],
  ])("reconhece %s como %s", (header, expected) => {
    expect(recognizeColumn(header)).toBe(expected);
  });
});

describe("recognizeColumn — diretor", () => {
  it.each([
    ["Diretor", "diretor"],
    ["DIRETORA", "diretor"],
    ["Diretor(a)", "diretor"],
    ["Nome do Diretor", "diretor"],
    ["Nome da Diretora", "diretor"],
    ["Novo Diretor", "diretor"],
    ["Diretor Atual", "diretor"],
  ])("reconhece %s como diretor", (header, expected) => {
    expect(recognizeColumn(header)).toBe(expected);
  });
});

describe("recognizeColumn — email", () => {
  it.each([
    ["Email", "email"],
    ["E-mail", "email"],
    ["email institucional", "email"],
  ])("reconhece %s como email", (header, expected) => {
    expect(recognizeColumn(header)).toBe(expected);
  });
});

describe("recognizeColumn — endereco", () => {
  it.each([
    ["Endereco", "endereco"],
    ["Endereço", "endereco"],
    ["localizacao", "endereco"],
  ])("reconhece %s como endereco", (header, expected) => {
    expect(recognizeColumn(header)).toBe(expected);
  });
});

describe("recognizeColumn — nao reconhecidas", () => {
  it.each([
    ["Agência"],
    ["Telefone"],
    ["Presidente do CEC"], // ambiguo no dominio — NUNCA mapear para diretor
    ["Presidente"],
    ["Observações"],
    [""],
    ["xxx"],
  ])("retorna 'ignored' para %s", (header) => {
    expect(recognizeColumn(header)).toBe("ignored");
  });
});
