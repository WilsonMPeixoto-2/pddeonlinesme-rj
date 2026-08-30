import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const distDir = resolve("dist");
const html = readFileSync(join(distDir, "index.html"), "utf8");
const entryMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i)
  ?? html.match(/<script[^>]+src=["']([^"']+\.js)["'][^>]+type=["']module["']/i);

if (!entryMatch) {
  throw new Error("Não foi possível localizar o entry JavaScript em dist/index.html.");
}

const entryRelative = entryMatch[1].replace(/^\//, "");
const entryPath = join(distDir, entryRelative);
const visited = new Set();

const staticImportPatterns = [
  /(?:import|export)(?!\s*\()[^;]*?from\s*["']\.\/([^"']+\.js)["']/g,
  /import\s*["']\.\/([^"']+\.js)["']/g,
];

function visit(filePath) {
  const normalized = resolve(filePath);
  if (visited.has(normalized)) return;
  visited.add(normalized);

  const source = readFileSync(normalized, "utf8");
  for (const pattern of staticImportPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      visit(join(dirname(normalized), match[1]));
    }
  }
}

visit(entryPath);

const rows = [...visited].map((filePath) => {
  const raw = statSync(filePath).size;
  const gzip = gzipSync(readFileSync(filePath), { level: 9 }).length;
  return {
    file: basename(filePath),
    raw,
    gzip,
  };
}).sort((a, b) => b.gzip - a.gzip);

const totalRaw = rows.reduce((sum, row) => sum + row.raw, 0);
const totalGzip = rows.reduce((sum, row) => sum + row.gzip, 0);
const budgetGzip = 330 * 1024;

console.log("Initial static JavaScript graph:");
for (const row of rows) {
  console.log(`- ${row.file}: ${(row.gzip / 1024).toFixed(1)} KiB gzip`);
}
console.log(`Total: ${(totalGzip / 1024).toFixed(1)} KiB gzip (${(totalRaw / 1024).toFixed(1)} KiB raw)`);
console.log(`Budget: ${(budgetGzip / 1024).toFixed(0)} KiB gzip`);

if (totalGzip > budgetGzip) {
  console.error(
    `Initial JS budget exceeded by ${((totalGzip - budgetGzip) / 1024).toFixed(1)} KiB.`,
  );
  process.exit(1);
}
