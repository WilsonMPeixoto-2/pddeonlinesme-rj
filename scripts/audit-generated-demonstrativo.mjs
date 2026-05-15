import { existsSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

const FORBIDDEN_FORMULA_RE = /BASE!|BASE\[|XLOOKUP/i;
const CRITICAL_CELLS = ["C14", "O14", "A16", "H51"];

function usage() {
  console.log("Uso: node scripts/audit-generated-demonstrativo.mjs caminho/arquivo.xlsx");
  console.log("");
  console.log("Valida abas, formulas proibidas e campos criticos do Demonstrativo gerado.");
}

function formulaText(cell) {
  if (cell.formula) return cell.formula;
  const value = cell.value;
  if (value && typeof value === "object" && "formula" in value) {
    return value.formula;
  }
  return "";
}

function displayValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function scanForbiddenFormulas(workbook) {
  const forbidden = [];

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const formula = formulaText(cell);
        if (formula && FORBIDDEN_FORMULA_RE.test(formula)) {
          forbidden.push(`${worksheet.name}!${cell.address}: ${formula}`);
        }
      });
    });
  });

  return forbidden;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    usage();
    return;
  }

  const workbookPath = resolve(process.cwd(), inputPath);
  if (!existsSync(workbookPath)) {
    console.error(`Arquivo nao encontrado: ${workbookPath}`);
    process.exitCode = 1;
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const hasBaseSheet = sheetNames.includes("BASE");
  const hasMemoria = sheetNames.includes("MEMORIA");
  const hasDemonstrativo = sheetNames.includes("Demonstrativo");
  const forbidden = scanForbiddenFormulas(workbook);

  console.log("Auditoria de Demonstrativo gerado");
  console.log(`Arquivo: ${workbookPath}`);
  console.log(`Abas: ${sheetNames.join(", ")}`);
  console.log(`Aba BASE: ${hasBaseSheet ? "presente" : "ausente"}`);
  console.log(`MEMORIA: ${hasMemoria ? "presente" : "ausente"}`);
  console.log(`Demonstrativo: ${hasDemonstrativo ? "presente" : "ausente"}`);

  if (hasDemonstrativo) {
    const worksheet = workbook.getWorksheet("Demonstrativo");
    console.log("\nCampos criticos do Demonstrativo");
    for (const address of CRITICAL_CELLS) {
      const cell = worksheet.getCell(address);
      const formula = formulaText(cell);
      const kind = formula ? "formula" : "literal";
      console.log(
        `  - Demonstrativo!${address}: ${kind}; valor=${displayValue(cell.value)}`,
      );
    }
  }

  console.log("\nReferencias proibidas");
  if (forbidden.length === 0) {
    console.log("  - nenhuma");
  } else {
    for (const entry of forbidden) {
      console.log(`  - ${entry}`);
    }
  }

  const failures = [
    ...(hasBaseSheet ? ["aba BASE presente"] : []),
    ...(!hasMemoria ? ["aba MEMORIA ausente"] : []),
    ...(!hasDemonstrativo ? ["aba Demonstrativo ausente"] : []),
    ...forbidden,
  ];

  if (failures.length > 0) {
    console.error("\nResultado: FALHA critica");
    for (const failure of failures) {
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
