import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { generateDemonstrativoBasico } from "./generateDemonstrativoBasico";
import {
  BASE_SHEET_NAME,
  DEMONSTRATIVO_SHEET_NAME,
  MEMORIA_CELLS,
  MEMORIA_SHEET_NAME,
} from "./templateCells";

const templatePath = resolve(
  process.cwd(),
  "public/templates/demonstrativo-basico-4cre-template.xlsx",
);

const fixtureUnidade: UnidadeDetalhe = {
  unidade_id: "fixture-unidade-id",
  designacao: "04.31.805",
  nome: "EDI CONEGO FERNANDES PINHEIRO",
  inep: 33000000,
  cnpj: "12.345.678/0001-90",
  diretor: "MARIA DA SILVA",
  endereco: "RUA DA ESCOLA, 123",
  banco: "001",
  agencia: "1234",
  conta_corrente: "56789-0",
  exercicio: 2026,
  programa: "basico",
  reprogramado_custeio: 1000.5,
  reprogramado_capital: 200.25,
  parcela_1_custeio: 3000,
  parcela_1_capital: 400,
  parcela_2_custeio: 5000,
  parcela_2_capital: 600,
  total_reprogramado: 1200.75,
  total_parcelas: 9000,
  total_disponivel_inicial: 10200.75,
  updated_at: "2026-05-07T00:00:00Z",
};

const formulaText = (value: ExcelJS.CellValue) => {
  if (typeof value === "string" && value.startsWith("=")) {
    return value;
  }

  if (value && typeof value === "object" && "formula" in value) {
    return value.formula;
  }

  return null;
};

const blobToArrayBuffer = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

describe("generateDemonstrativoBasico", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates an individual workbook without the legacy BASE sheet", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const generated = await generateDemonstrativoBasico(fixtureUnidade, "2026");
    const outputBuffer = await blobToArrayBuffer(generated.blob);
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(outputBuffer);

    expect(workbook.getWorksheet(BASE_SHEET_NAME)).toBeUndefined();
    expect(workbook.getWorksheet(MEMORIA_SHEET_NAME)).toBeDefined();
    expect(workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME)).toBeDefined();

    const memoriaWorksheet = workbook.getWorksheet(MEMORIA_SHEET_NAME);
    expect(memoriaWorksheet?.getCell(MEMORIA_CELLS.nome).value).toBe(
      fixtureUnidade.nome,
    );

    for (const address of Object.values(MEMORIA_CELLS)) {
      const cell = memoriaWorksheet?.getCell(address);
      const formula = cell ? formulaText(cell.value) : null;
      expect(formula).toBeNull();
    }

    const forbiddenFormulaPattern = /BASE!|BASE\[|XLOOKUP/i;
    const forbiddenFormulas: string[] = [];

    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          const formula = formulaText(cell.value);
          if (formula && forbiddenFormulaPattern.test(formula)) {
            forbiddenFormulas.push(`${worksheet.name}!${cell.address}:${formula}`);
          }
        });
      });
    });

    expect(forbiddenFormulas).toEqual([]);
  });
});
