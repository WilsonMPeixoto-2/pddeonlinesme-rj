import { existsSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

const TEMPLATE_PATH = resolve(
  process.cwd(),
  "public/templates/demonstrativo-basico-4cre-template.xlsx",
);

const FORBIDDEN_FORMULA_RE = /BASE!|BASE\[|XLOOKUP/i;
const MEMORIA_RE = /MEMORIA/i;
const SIMPLE_MEMORIA_RE = /^'?MEMORIA'?!\$?([A-Z]+)\$?(\d+)$/i;

function formulaText(cell) {
  if (cell.formula) return cell.formula;
  const value = cell.value;
  if (value && typeof value === "object" && "formula" in value) {
    return value.formula;
  }
  return "";
}

function isSimpleMemoriaFormula(formula) {
  return SIMPLE_MEMORIA_RE.test(formula.trim().replace(/^=/, ""));
}

function scanWorkbook(workbook) {
  const formulas = [];
  const simpleMemoria = [];
  const compositeMemoria = [];
  const forbidden = [];

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const formula = formulaText(cell);
        if (!formula) return;

        const entry = {
          sheet: worksheet.name,
          address: cell.address,
          formula,
        };
        formulas.push(entry);

        if (FORBIDDEN_FORMULA_RE.test(formula)) {
          forbidden.push(entry);
        }

        if (MEMORIA_RE.test(formula)) {
          if (isSimpleMemoriaFormula(formula)) {
            simpleMemoria.push(entry);
          } else {
            compositeMemoria.push(entry);
          }
        }
      });
    });
  });

  return { formulas, simpleMemoria, compositeMemoria, forbidden };
}

function printEntries(title, entries, limit = Number.POSITIVE_INFINITY) {
  console.log(`\n${title} (${entries.length})`);
  if (entries.length === 0) {
    console.log("  - nenhuma");
    return;
  }

  for (const entry of entries.slice(0, limit)) {
    console.log(`  - ${entry.sheet}!${entry.address}: ${entry.formula}`);
  }

  if (entries.length > limit) {
    console.log(`  - ... ${entries.length - limit} adicionais`);
  }
}

async function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Template nao encontrado: ${TEMPLATE_PATH}`);
    process.exitCode = 1;
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const hasBaseSheet = sheetNames.includes("BASE");
  const scan = scanWorkbook(workbook);
  const criticalFailures = [
    ...(hasBaseSheet ? ["aba BASE presente no template publico"] : []),
    ...scan.forbidden.map(
      (entry) => `${entry.sheet}!${entry.address}: ${entry.formula}`,
    ),
  ];

  console.log("Auditoria do template Demonstrativo Basico");
  console.log(`Arquivo: ${TEMPLATE_PATH}`);
  console.log(`Abas: ${sheetNames.join(", ")}`);
  console.log(`Aba BASE: ${hasBaseSheet ? "presente" : "ausente"}`);
  console.log(`Total de formulas: ${scan.formulas.length}`);

  printEntries("Formulas encontradas", scan.formulas);
  printEntries("Formulas simples MEMORIA!X", scan.simpleMemoria);
  printEntries("Formulas compostas com MEMORIA", scan.compositeMemoria);
  printEntries("Referencias proibidas", scan.forbidden);

  if (criticalFailures.length > 0) {
    console.error("\nResultado: FALHA critica");
    for (const failure of criticalFailures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nResultado: OK - nenhum risco critico encontrado.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
