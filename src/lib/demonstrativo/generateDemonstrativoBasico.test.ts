import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { extractMemoriaRef, generateDemonstrativoBasico } from "./generateDemonstrativoBasico";
import { EMPTY_FIELD_PLACEHOLDER } from "./mapUnidadeToMemoria";
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

const fixtureUnidadeB: UnidadeDetalhe = {
  ...fixtureUnidade,
  unidade_id: "fixture-unidade-b",
  designacao: "04.10.002",
  nome: "EM ALBINO SOUZA CRUZ",
  cnpj: "04552825000170",
  endereco: "AV. DOS DEMOCRATICOS 268, MANGUINHOS",
  agencia: "9876",
  conta_corrente: "12345-6",
  diretor: "ANDREA DOS SANTOS SIMOES",
  reprogramado_custeio: 10,
  reprogramado_capital: 20,
  parcela_1_custeio: 30,
  parcela_1_capital: 40,
  parcela_2_custeio: 50,
  parcela_2_capital: 60,
};

const fixtureSemFinanceiro: UnidadeDetalhe = {
  ...fixtureUnidadeB,
  unidade_id: "fixture-sem-financeiro",
  designacao: "04.10.099",
  nome: "EM SEM EXECUCAO FINANCEIRA",
  cnpj: "11.111.111/0001-11",
  endereco: "RUA SEM FINANCEIRO, 100",
  diretor: "DIRETOR SEM FINANCEIRO",
  exercicio: null,
  programa: null,
  reprogramado_custeio: null,
  reprogramado_capital: null,
  parcela_1_custeio: null,
  parcela_1_capital: null,
  parcela_2_custeio: null,
  parcela_2_capital: null,
  total_reprogramado: null,
  total_parcelas: null,
  total_disponivel_inicial: null,
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

const loadGeneratedWorkbook = async (blob: Blob) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blobToArrayBuffer(blob));

  return workbook;
};

const visibleDemonstrativoCells = {
  nome: "C14",
  cnpj: "O14",
  endereco: "A16",
  diretor: "H51",
} as const;

const criticalMemoriaCells = {
  nome: "B2",
  cnpj: "B3",
  endereco: "B4",
  agencia: "B6",
  contaCorrente: "F6",
  diretor: "A52",
} as const;

const expectedCriticalValues = (unidade: UnidadeDetalhe) => ({
  nome: unidade.nome,
  cnpj: unidade.cnpj,
  endereco: unidade.endereco,
  agencia: unidade.agencia,
  contaCorrente: unidade.conta_corrente,
  diretor: unidade.diretor,
});

const expectLiteralCellValue = (
  worksheet: ExcelJS.Worksheet,
  address: string,
  expected: string | number | null,
) => {
  const cell = worksheet.getCell(address);
  expect(formulaText(cell.value)).toBeNull();
  expect(cell.formula).toBeUndefined();
  expect(cell.value).toBe(expected);
};

const collectCellValues = (workbook: ExcelJS.Workbook) => {
  const values: string[] = [];

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const raw = cell.value;
        if (raw === null || raw === undefined) return;

        if (typeof raw === "object") {
          values.push(JSON.stringify(raw));
          return;
        }

        values.push(String(raw));
      });
    });
  });

  return values;
};

const collectForbiddenFormulas = (workbook: ExcelJS.Workbook) => {
  const forbiddenFormulaPattern = /BASE!|BASE\[|XLOOKUP|MEMORIA!/i;
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

  return forbiddenFormulas;
};

describe("generateDemonstrativoBasico", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates an individual workbook without the legacy BASE sheet", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const generated = await generateDemonstrativoBasico(fixtureUnidade, "2026");
    const workbook = await loadGeneratedWorkbook(generated.blob);

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

    expect(collectForbiddenFormulas(workbook)).toEqual([]);
  });

  it("materializa campos críticos por unidade sem preservar BASE, cache ou dados cruzados", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const genA = await generateDemonstrativoBasico(fixtureUnidade, "2026");
    const genB = await generateDemonstrativoBasico(fixtureUnidadeB, "2026");

    const wbA = await loadGeneratedWorkbook(genA.blob);
    const wbB = await loadGeneratedWorkbook(genB.blob);

    const memoriaA = wbA.getWorksheet(MEMORIA_SHEET_NAME)!;
    const memoriaB = wbB.getWorksheet(MEMORIA_SHEET_NAME)!;
    const wsDemA = wbA.getWorksheet(DEMONSTRATIVO_SHEET_NAME)!;
    const wsDemB = wbB.getWorksheet(DEMONSTRATIVO_SHEET_NAME)!;

    for (const [key, address] of Object.entries(criticalMemoriaCells)) {
      expectLiteralCellValue(
        memoriaA,
        address,
        expectedCriticalValues(fixtureUnidade)[key as keyof ReturnType<typeof expectedCriticalValues>],
      );
      expectLiteralCellValue(
        memoriaB,
        address,
        expectedCriticalValues(fixtureUnidadeB)[key as keyof ReturnType<typeof expectedCriticalValues>],
      );
    }

    // Campos visíveis críticos: C14/O14/A16/H51 são fórmulas simples MEMORIA no template.
    expectLiteralCellValue(wsDemA, visibleDemonstrativoCells.nome, fixtureUnidade.nome);
    expectLiteralCellValue(wsDemA, visibleDemonstrativoCells.cnpj, fixtureUnidade.cnpj);
    expectLiteralCellValue(wsDemA, visibleDemonstrativoCells.endereco, fixtureUnidade.endereco);
    expectLiteralCellValue(wsDemA, visibleDemonstrativoCells.diretor, fixtureUnidade.diretor);

    expectLiteralCellValue(wsDemB, visibleDemonstrativoCells.nome, fixtureUnidadeB.nome);
    expectLiteralCellValue(wsDemB, visibleDemonstrativoCells.cnpj, fixtureUnidadeB.cnpj);
    expectLiteralCellValue(wsDemB, visibleDemonstrativoCells.endereco, fixtureUnidadeB.endereco);
    expectLiteralCellValue(wsDemB, visibleDemonstrativoCells.diretor, fixtureUnidadeB.diretor);

    for (const workbook of [wbA, wbB]) {
      expect(workbook.getWorksheet(BASE_SHEET_NAME)).toBeUndefined();
      expect(collectForbiddenFormulas(workbook)).toEqual([]);
    }

    const workbookBValues = collectCellValues(wbB);
    for (const leakedValue of Object.values(expectedCriticalValues(fixtureUnidade))) {
      expect(workbookBValues).not.toContain(String(leakedValue));
    }

    expect(workbookBValues.join("\n")).not.toContain("EDI CÔNEGO FERNANDES PINHEIRO");
  });

  it("gera com cadastro essencial mesmo quando dados fiscais ou financeiros ainda nao existem", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const generated = await generateDemonstrativoBasico(fixtureSemFinanceiro, "2026");
    const workbook = await loadGeneratedWorkbook(generated.blob);
    const memoria = workbook.getWorksheet(MEMORIA_SHEET_NAME)!;
    const demonstrativo = workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME)!;

    expect(generated.memoria.reprogramadoCusteio).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.reprogramadoCapital).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.parcela1Custeio).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.parcela1Capital).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.parcela2Custeio).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.parcela2Capital).toBe(EMPTY_FIELD_PLACEHOLDER);

    expectLiteralCellValue(memoria, criticalMemoriaCells.nome, fixtureSemFinanceiro.nome);
    expectLiteralCellValue(memoria, criticalMemoriaCells.cnpj, fixtureSemFinanceiro.cnpj);
    expectLiteralCellValue(memoria, criticalMemoriaCells.endereco, fixtureSemFinanceiro.endereco);
    expectLiteralCellValue(memoria, criticalMemoriaCells.diretor, fixtureSemFinanceiro.diretor);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.nome, fixtureSemFinanceiro.nome);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.cnpj, fixtureSemFinanceiro.cnpj);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.endereco, fixtureSemFinanceiro.endereco);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.diretor, fixtureSemFinanceiro.diretor);
  });

  it("gera para unidade com cadastro parcial usando placeholder nos campos faltantes", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const generated = await generateDemonstrativoBasico(
      {
        ...fixtureUnidade,
        cnpj: null,
        endereco: null,
        diretor: null,
        agencia: null,
        conta_corrente: null,
      },
      "2026",
    );
    const workbook = await loadGeneratedWorkbook(generated.blob);
    const memoria = workbook.getWorksheet(MEMORIA_SHEET_NAME)!;
    const demonstrativo = workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME)!;

    expect(generated.memoria.cnpj).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.endereco).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.agencia).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.contaCorrente).toBe(EMPTY_FIELD_PLACEHOLDER);
    expect(generated.memoria.diretor).toBe(EMPTY_FIELD_PLACEHOLDER);

    expectLiteralCellValue(memoria, criticalMemoriaCells.cnpj, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(memoria, criticalMemoriaCells.endereco, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(memoria, criticalMemoriaCells.agencia, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(memoria, criticalMemoriaCells.contaCorrente, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(memoria, criticalMemoriaCells.diretor, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.cnpj, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.endereco, EMPTY_FIELD_PLACEHOLDER);
    expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.diretor, EMPTY_FIELD_PLACEHOLDER);
  });

  it("isola dados em geracoes paralelas sem vazamento entre unidades", async () => {
    const templateBuffer = await readFile(templatePath);
    const fetchMock = vi.fn(async () => new Response(templateBuffer));
    vi.stubGlobal("fetch", fetchMock);

    const unidades = Array.from({ length: 12 }, (_, index) => {
      const token = String(index).padStart(2, "0");
      return {
        ...fixtureUnidade,
        unidade_id: `fixture-paralela-${token}`,
        designacao: `04.10.${token}`,
        nome: `EM PARALELA X${token}X`,
        cnpj: `CNPJ-X${token}X`,
        endereco: `RUA PARALELA X${token}X`,
        diretor: `DIRETOR PARALELO X${token}X`,
      };
    });

    const generated = await Promise.all(
      unidades.map((unidade) => generateDemonstrativoBasico(unidade, "2026")),
    );
    const workbooks = await Promise.all(generated.map((g) => loadGeneratedWorkbook(g.blob)));

    for (const [index, workbook] of workbooks.entries()) {
      const demonstrativo = workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME)!;
      expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.nome, unidades[index].nome);
      expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.cnpj, unidades[index].cnpj);
      expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.endereco, unidades[index].endereco);
      expectLiteralCellValue(demonstrativo, visibleDemonstrativoCells.diretor, unidades[index].diretor);

      const values = collectCellValues(workbook).join("\n");
      for (const [otherIndex, other] of unidades.entries()) {
        if (otherIndex === index) continue;
        expect(values).not.toContain(other.nome);
        expect(values).not.toContain(other.cnpj);
        expect(values).not.toContain(other.endereco);
        expect(values).not.toContain(other.diretor);
      }
    }
  });
});

describe("extractMemoriaRef", () => {
  it.each([
    ["MEMORIA!B2", "B2"],
    ["=MEMORIA!B2", "B2"],
    ["MEMORIA!$B$2", "B2"],
    ["'MEMORIA'!B2", "B2"],
    ["'MEMORIA'!$B$2", "B2"],
    ["MEMORIA!A52", "A52"],
    ["=MEMORIA!$C$28", "C28"],
    ["='MEMORIA'!$B$2", "B2"],
    ["  MEMORIA!B2  ", "B2"],
  ])("extrai referência de '%s' → '%s'", (input, expected) => {
    expect(extractMemoriaRef(input)).toBe(expected);
  });

  it.each([
    ["SUM(MEMORIA!B2)", "fórmula composta"],
    ["=SUM(MEMORIA!B2)", "fórmula composta com sinal de igual"],
    ["OUTRA!B2", "outra aba"],
    ["BASE!A1", "aba BASE"],
    ["", "string vazia"],
    ["A1+B2", "expressão aritmética"],
    ["MEMORIA!", "sem referência de célula"],
    ["MEMORIA!B2:B10", "range em vez de célula"],
  ])("retorna null para '%s' (%s)", (input) => {
    expect(extractMemoriaRef(input)).toBeNull();
  });
});
