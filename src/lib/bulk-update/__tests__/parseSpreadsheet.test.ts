import { describe, expect, it } from "vitest";
import { parseSpreadsheet, BulkUpdateParseError } from "../parseSpreadsheet";

/**
 * Cria um File simulando upload do navegador. JSDOM aceita File com Blob.
 */
function makeCsvFile(content: string, name = "teste.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

function makeUtf8WithBom(content: string): File {
  const bom = "﻿";
  return makeCsvFile(bom + content, "teste-bom.csv");
}

describe("parseSpreadsheet — CSV", () => {
  it("parseia CSV com virgula", async () => {
    const csv = "designacao,diretor\n04.10.001,MARIA SILVA\n04.10.002,JOAO COSTA";
    const result = await parseSpreadsheet(makeCsvFile(csv));
    expect(result.totalRows).toBe(2);
    expect(result.headersRaw).toEqual(["designacao", "diretor"]);
    expect(result.rows[0]).toEqual({ designacao: "04.10.001", diretor: "MARIA SILVA" });
  });

  it("parseia CSV com ponto-e-virgula (padrao Excel-PT)", async () => {
    const csv = "designacao;diretor\n04.10.001;MARIA SILVA\n04.10.002;JOAO COSTA";
    const result = await parseSpreadsheet(makeCsvFile(csv));
    expect(result.totalRows).toBe(2);
    expect(result.headersRaw).toEqual(["designacao", "diretor"]);
    expect(result.rows[1]).toEqual({ designacao: "04.10.002", diretor: "JOAO COSTA" });
  });

  it("tolera BOM no inicio do arquivo", async () => {
    const csv = "designacao,diretor\n04.10.001,MARIA SILVA";
    const result = await parseSpreadsheet(makeUtf8WithBom(csv));
    expect(result.headersRaw[0]).toBe("designacao");
  });

  it("preserva zeros a esquerda em INEP como texto", async () => {
    const csv = "inep,diretor\n00033456,MARIA SILVA";
    const result = await parseSpreadsheet(makeCsvFile(csv));
    expect(result.rows[0].inep).toBe("00033456");
  });

  it("aceita acentuacao UTF-8", async () => {
    const csv = "designacao,diretor\n04.10.001,MARIA DA SILVA AÇAÍ";
    const result = await parseSpreadsheet(makeCsvFile(csv));
    expect(result.rows[0].diretor).toBe("MARIA DA SILVA AÇAÍ");
  });

  it("rejeita arquivo vazio", async () => {
    await expect(parseSpreadsheet(makeCsvFile(""))).rejects.toThrow(
      BulkUpdateParseError,
    );
  });

  it("filtra linhas totalmente vazias", async () => {
    const csv = "designacao,diretor\n04.10.001,MARIA\n,\n04.10.002,JOAO";
    const result = await parseSpreadsheet(makeCsvFile(csv));
    expect(result.totalRows).toBe(2);
  });

  it("rejeita CSV acima de 200 linhas", async () => {
    const linhas = Array.from({ length: 205 }, (_, i) => `${i},DIRETOR ${i}`).join("\n");
    const csv = `designacao,diretor\n${linhas}`;
    await expect(parseSpreadsheet(makeCsvFile(csv))).rejects.toThrow(
      /Limite v1/,
    );
  });

  it("rejeita formato nao suportado", async () => {
    const file = new File(["x"], "teste.txt", { type: "text/plain" });
    await expect(parseSpreadsheet(file)).rejects.toThrow(/Formato nao suportado/);
  });
});
