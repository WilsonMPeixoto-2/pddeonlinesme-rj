import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateFiscalContract,
  extractMigrationVersions,
} from "./lib/fiscal-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function readArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Argumento ${name} exige um caminho.`);
  }
  return value;
}

async function readJson(relativePath) {
  const absolutePath = path.resolve(rootDir, relativePath);
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

async function main() {
  const manifestPath = readArg("--manifest", "config/fiscal-contract.json");
  const evidencePath = readArg(
    "--evidence",
    ".continuity/evidence/fiscal-contract-production.json",
  );

  const [manifest, evidence, migrationFiles] = await Promise.all([
    readJson(manifestPath),
    readJson(evidencePath),
    readdir(path.resolve(rootDir, "supabase/migrations")),
  ]);

  if (manifest.projectRef !== evidence.projectRef) {
    throw new Error(
      `Evidencia fiscal pertence ao projeto ${evidence.projectRef}, mas o manifesto exige ${manifest.projectRef}.`,
    );
  }

  const report = evaluateFiscalContract({
    manifest,
    localMigrationVersions: extractMigrationVersions(migrationFiles),
    remoteMigrationVersions: evidence.remoteMigrationVersions,
    remoteOpenApiPaths: evidence.remoteCriticalObjectPaths,
  });

  const summary = {
    projectRef: manifest.projectRef,
    operationalState: report.state,
    evidenceCheckedAt: evidence.checkedAt,
    repositoryMigrations: manifest.requiredRepositoryMigrations,
    productionExpectation: manifest.productionExpectation,
    issues: report.issues,
  };

  if (!report.ok) {
    console.error("Fiscal contract drift: FAILED");
    console.error(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log("Fiscal contract drift: OK");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("Fiscal contract drift: ERROR");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
