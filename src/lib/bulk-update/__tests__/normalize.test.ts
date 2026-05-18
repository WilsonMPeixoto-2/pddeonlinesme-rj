import { describe, expect, it } from "vitest";
import {
  normalizeHeader,
  normalizeCnpj,
  normalizeInep,
  normalizeTextValue,
  normalizeDesignacaoForCompare,
  isEmptyValue,
} from "../normalize";

describe("normalizeHeader", () => {
  it("remove acentos", () => {
    expect(normalizeHeader("Designação")).toBe("designacao");
    expect(normalizeHeader("Endereço")).toBe("endereco");
  });

  it("baixa para minusculo, colapsa espacos e remove parenteses", () => {
    expect(normalizeHeader("  DIRETOR(a) ")).toBe("diretor a");
    expect(normalizeHeader("CNPJ  CEC")).toBe("cnpj cec");
  });

  it("trata pontuacao comum como espaco", () => {
    expect(normalizeHeader("cod_unidade")).toBe("cod unidade");
    expect(normalizeHeader("CODIGO-DA-UNIDADE")).toBe("codigo da unidade");
  });

  it("aceita null/undefined sem quebrar", () => {
    expect(normalizeHeader(null)).toBe("");
    expect(normalizeHeader(undefined)).toBe("");
  });
});

describe("normalizeCnpj", () => {
  it("remove pontuacao mantendo todos digitos", () => {
    expect(normalizeCnpj("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("preenche zero a esquerda quando vier com 13 digitos", () => {
    expect(normalizeCnpj("4552825000170")).toBe("04552825000170");
  });

  it("ignora null/undefined/vazio", () => {
    expect(normalizeCnpj(null)).toBe("");
    expect(normalizeCnpj(undefined)).toBe("");
    expect(normalizeCnpj("")).toBe("");
  });
});

describe("normalizeInep", () => {
  it("preserva zeros a esquerda", () => {
    expect(normalizeInep("033023456")).toBe("033023456");
  });

  it("remove tudo que nao for digito", () => {
    expect(normalizeInep("INEP 33023456")).toBe("33023456");
  });

  it("nao converte para number", () => {
    expect(typeof normalizeInep("00000123")).toBe("string");
  });
});

describe("normalizeTextValue", () => {
  it("colapsa espacos multiplos", () => {
    expect(normalizeTextValue("  MARIA   DA   SILVA  ")).toBe("MARIA DA SILVA");
  });

  it("aceita null e undefined", () => {
    expect(normalizeTextValue(null)).toBe("");
    expect(normalizeTextValue(undefined)).toBe("");
  });

  it("preserva acentos no valor (so o header e normalizado)", () => {
    expect(normalizeTextValue("João Costa")).toBe("João Costa");
  });
});

describe("normalizeDesignacaoForCompare", () => {
  it("converte para upper para comparacao", () => {
    expect(normalizeDesignacaoForCompare("04.10.001 — em ema negrão")).toBe(
      "04.10.001 — EM EMA NEGRÃO",
    );
  });
});

describe("isEmptyValue", () => {
  it("trata strings vazias como vazio", () => {
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue("   ")).toBe(true);
  });

  it("trata traco como vazio (sentinela visual)", () => {
    expect(isEmptyValue("—")).toBe(true);
    expect(isEmptyValue("-")).toBe(true);
  });

  it("trata valor real como nao-vazio", () => {
    expect(isEmptyValue("MARIA SILVA")).toBe(false);
    expect(isEmptyValue("0")).toBe(false);
  });

  it("aceita null/undefined", () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
  });
});
