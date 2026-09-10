import { describe, expect, it } from "vitest";

import {
  GLOBAL_NAVIGATION,
  searchGlobalSchools,
  type GlobalSearchSchool,
} from "@/lib/globalSearch";

const schools: GlobalSearchSchool[] = [
  {
    id: "u1",
    designacao: "04.10.001 — E.M. Antônio Vieira",
    nome: "Escola Municipal Antônio Vieira",
    inep: "33000001",
    cnpj: "12.345.678/0001-90",
    diretor: "Márcia da Silva",
  },
  {
    id: "u2",
    designacao: "04.10.002 — CIEP Antonieta",
    nome: "CIEP Antonieta",
    inep: "33000002",
    cnpj: "98.765.432/0001-10",
    diretor: "João Pereira",
  },
  {
    id: "u3",
    designacao: "04.10.003 — E.M. República",
    nome: "Escola Municipal República",
    inep: "33000003",
    cnpj: null,
    diretor: null,
  },
];

describe("GLOBAL_NAVIGATION", () => {
  it("expõe áreas operacionais e não expõe páginas internas ou demo", () => {
    const labels = GLOBAL_NAVIGATION.map((item) => item.label);
    const paths = GLOBAL_NAVIGATION.map((item) => item.path);

    expect(labels).toContain("Repasses");
    expect(labels).toContain("Frente Fiscal");
    expect(labels).not.toContain("Style Guide");
    expect(labels).not.toContain("Acesso Negado (demo)");
    expect(paths).not.toContain("/style-guide");
    expect(paths).not.toContain("/acesso-negado");
  });
});

describe("searchGlobalSchools", () => {
  it("encontra escola ignorando acentos e caixa", () => {
    expect(searchGlobalSchools(schools, "antonio").map((school) => school.id)).toEqual(["u1"]);
  });

  it("encontra por designação parcial", () => {
    expect(searchGlobalSchools(schools, "04.10.002").map((school) => school.id)).toEqual(["u2"]);
  });

  it("encontra por INEP e CNPJ mesmo com pontuação diferente", () => {
    expect(searchGlobalSchools(schools, "33000003").map((school) => school.id)).toEqual(["u3"]);
    expect(searchGlobalSchools(schools, "12345678000190").map((school) => school.id)).toEqual(["u1"]);
  });

  it("encontra por diretor", () => {
    expect(searchGlobalSchools(schools, "marcia").map((school) => school.id)).toEqual(["u1"]);
  });

  it("não retorna toda a carteira quando a busca está vazia e respeita limite", () => {
    expect(searchGlobalSchools(schools, "")).toEqual([]);
    expect(searchGlobalSchools(schools, "0", 2)).toHaveLength(2);
  });
});
