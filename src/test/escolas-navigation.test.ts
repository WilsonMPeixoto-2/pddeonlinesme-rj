import { describe, expect, it } from "vitest";

import {
  buildEscolasSearchParams,
  buildSchoolDetailPath,
  parseEscolasSearchParams,
  resolveSafeEscolasReturn,
} from "@/lib/escolasNavigation";

describe("parseEscolasSearchParams", () => {
  it("restaura busca e status válidos da URL", () => {
    const parsed = parseEscolasSearchParams(new URLSearchParams("q=antonieta&status=incompleto"));
    expect(parsed).toEqual({ q: "antonieta", status: "incompleto" });
  });

  it("descarta status desconhecido", () => {
    const parsed = parseEscolasSearchParams(new URLSearchParams("q=teste&status=qualquer"));
    expect(parsed).toEqual({ q: "teste", status: "todas" });
  });
});

describe("buildEscolasSearchParams", () => {
  it("não polui a URL com filtros padrão", () => {
    expect(buildEscolasSearchParams({ q: "", status: "todas" }).toString()).toBe("");
  });

  it("serializa somente filtros ativos", () => {
    expect(buildEscolasSearchParams({ q: "  04.10.002  ", status: "completo" }).toString())
      .toBe("q=04.10.002&status=completo");
  });
});

describe("buildSchoolDetailPath", () => {
  it("transporta o contexto da carteira para a ficha da escola", () => {
    const params = new URLSearchParams("q=antonieta&status=incompleto");
    expect(buildSchoolDetailPath("school-1", params)).toBe(
      "/escolas/school-1?return=%2Fescolas%3Fq%3Dantonieta%26status%3Dincompleto",
    );
  });

  it("usa retorno limpo quando não há filtros", () => {
    expect(buildSchoolDetailPath("school-1", new URLSearchParams())).toBe(
      "/escolas/school-1?return=%2Fescolas",
    );
  });
});

describe("resolveSafeEscolasReturn", () => {
  it("aceita somente retorno interno para a carteira de escolas", () => {
    expect(resolveSafeEscolasReturn("/escolas?q=abc")).toBe("/escolas?q=abc");
    expect(resolveSafeEscolasReturn("//malicioso.example")).toBe("/escolas");
    expect(resolveSafeEscolasReturn("/fiscal")).toBe("/escolas");
    expect(resolveSafeEscolasReturn("https://example.com")).toBe("/escolas");
  });
});
