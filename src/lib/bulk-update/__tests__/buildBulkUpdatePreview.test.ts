import { describe, expect, it } from "vitest";
import {
  buildBulkUpdatePreview,
  inspectColumns,
  type UnitForPreview,
} from "../buildBulkUpdatePreview";
import type { ParsedSpreadsheet } from "../types";

function parsedFromRows(headers: string[], rows: Array<Record<string, unknown>>): ParsedSpreadsheet {
  return {
    fileName: "fixture.xlsx",
    fileSize: 1024,
    headersRaw: headers,
    rows,
    totalRows: rows.length,
  };
}

const unitA: UnitForPreview = {
  id: "uuid-a",
  designacao: "04.10.001 — EM ALPHA",
  inep: "33000001",
  cnpj: "12345678000190",
  diretor: "DIRETOR ANTIGO A",
};

const unitB: UnitForPreview = {
  id: "uuid-b",
  designacao: "04.10.002 — EM BETA",
  inep: "33000002",
  cnpj: "12345678000291",
  diretor: "DIRETOR ANTIGO B",
};

describe("inspectColumns", () => {
  it("lista chaves disponiveis e coluna do campo diretor", () => {
    const parsed = parsedFromRows(["DESIGNACAO", "INEP", "DIRETOR"], []);
    const result = inspectColumns(parsed);
    expect(result.availableKeys).toEqual(["designacao", "inep"]);
    expect(result.fieldColumn).toBe("DIRETOR");
  });

  it("ignora colunas desconhecidas sem afetar mapeamento", () => {
    const parsed = parsedFromRows(["INEP", "DIRETOR", "OBSERVACOES"], []);
    const result = inspectColumns(parsed);
    expect(result.recognizedColumns[2].recognizedAs).toBe("ignored");
    expect(result.fieldColumn).toBe("DIRETOR");
  });
});

describe("buildBulkUpdatePreview — happy paths", () => {
  it("classifica linha como ready quando valor difere", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "DIRETOR"],
      [{ DESIGNACAO: "04.10.001 — EM ALPHA", DIRETOR: "MARIA SILVA" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.blockingErrors).toEqual([]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("ready");
    expect(result.items[0].unidadeId).toBe("uuid-a");
    expect(result.items[0].oldValue).toBe("DIRETOR ANTIGO A");
    expect(result.items[0].newValue).toBe("MARIA SILVA");
    expect(result.summary.readyCount).toBe(1);
  });

  it("classifica como unchanged quando valor e igual (case-insensitive)", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "DIRETOR"],
      [{ DESIGNACAO: "04.10.001 — EM ALPHA", DIRETOR: "diretor antigo a" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.items[0].status).toBe("unchanged");
    expect(result.summary.unchangedCount).toBe(1);
  });

  it("aceita chave INEP", async () => {
    const parsed = parsedFromRows(
      ["INEP", "DIRETOR"],
      [{ INEP: "33000001", DIRETOR: "ANA PEREIRA" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "inep" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.items[0].status).toBe("ready");
    expect(result.items[0].keyType).toBe("inep");
  });
});

describe("buildBulkUpdatePreview — erros bloqueantes", () => {
  it("bloqueia quando nao ha chave reconhecida", async () => {
    const parsed = parsedFromRows(
      ["EMAIL", "DIRETOR"],
      [{ EMAIL: "x@y", DIRETOR: "ANA" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [] },
    );
    expect(result.blockingErrors.length).toBeGreaterThan(0);
    expect(result.items).toHaveLength(0);
  });

  it("bloqueia quando nao ha coluna diretor", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "TELEFONE"],
      [{ DESIGNACAO: "04.10.001", TELEFONE: "123456" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.blockingErrors.some((e) => e.toLowerCase().includes("diretor"))).toBe(true);
  });

  it("bloqueia quando ha chave duplicada", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "DIRETOR"],
      [
        { DESIGNACAO: "04.10.001", DIRETOR: "A" },
        { DESIGNACAO: "04.10.001", DIRETOR: "B" },
      ],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [] },
    );
    expect(result.blockingErrors.some((e) => e.toLowerCase().includes("duplicada"))).toBe(true);
  });
});

describe("buildBulkUpdatePreview — erros de linha", () => {
  it("marca como error_not_found quando unidade nao existe", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "DIRETOR"],
      [{ DESIGNACAO: "04.99.999 — INEXISTENTE", DIRETOR: "ANA" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [] },
    );
    expect(result.items[0].status).toBe("error_not_found");
    expect(result.summary.errorCount).toBe(1);
  });

  it("marca como error_empty_value quando diretor estiver vazio", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "DIRETOR"],
      [{ DESIGNACAO: "04.10.001 — EM ALPHA", DIRETOR: "" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.items[0].status).toBe("error_empty_value");
  });

  it("detecta divergencia INEP vs designacao na mesma linha", async () => {
    const parsed = parsedFromRows(
      ["DESIGNACAO", "INEP", "DIRETOR"],
      [
        {
          DESIGNACAO: "04.10.001 — EM ALPHA",
          INEP: "99999999",
          DIRETOR: "ANA",
        },
      ],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "designacao" },
      { fetchUnits: async () => [unitA] },
    );
    expect(result.items[0].status).toBe("error_key_mismatch");
  });
});

describe("buildBulkUpdatePreview — segurança", () => {
  it("nao reconhece coluna 'presidente do cec' como diretor", async () => {
    const parsed = parsedFromRows(
      ["INEP", "PRESIDENTE DO CEC"],
      [{ INEP: "33000001", "PRESIDENTE DO CEC": "JOAO PRESIDENTE" }],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "inep" },
      { fetchUnits: async () => [unitA] },
    );
    // Sem coluna diretor => deve bloquear
    expect(result.blockingErrors.length).toBeGreaterThan(0);
  });

  it("preview multi-unidade com tipos distintos", async () => {
    const parsed = parsedFromRows(
      ["INEP", "DIRETOR"],
      [
        { INEP: "33000001", DIRETOR: "MARIA SILVA" },
        { INEP: "33000002", DIRETOR: "JOAO COSTA" },
      ],
    );
    const result = await buildBulkUpdatePreview(
      { parsed, chosenKey: "inep" },
      { fetchUnits: async () => [unitA, unitB] },
    );
    expect(result.summary.readyCount).toBe(2);
    expect(result.items[0].unidadeId).toBe("uuid-a");
    expect(result.items[1].unidadeId).toBe("uuid-b");
  });
});
