import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(root, "build-assets", "login-approved");
const target = path.join(root, "src", "assets", "login-pdde-rio.webp");
const partNames = Array.from({ length: 6 }, (_, index) => `part-${String(index + 1).padStart(2, "0")}.b64`);

const EXPECTED_BYTES = 89_242;
const EXPECTED_SHA256 = "f0e191cddde7301265f202d1eb3fb78e2a918d6d65f30537f547c2a354556f69";

const encodedParts = await Promise.all(
  partNames.map((name) => readFile(path.join(partsDir, name), "utf8")),
);
const bytes = Buffer.from(encodedParts.map((part) => part.trim()).join(""), "base64");
const digest = createHash("sha256").update(bytes).digest("hex");

if (bytes.length !== EXPECTED_BYTES || digest !== EXPECTED_SHA256) {
  throw new Error(
    `Imagem aprovada do login inválida: ${bytes.length} bytes / sha256 ${digest}. ` +
      `Esperado: ${EXPECTED_BYTES} bytes / ${EXPECTED_SHA256}.`,
  );
}

if (process.argv.includes("--check")) {
  console.log(`Contrato visual do login OK (${bytes.length} bytes, sha256 ${digest}).`);
  process.exit(0);
}

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, bytes);
console.log(`Imagem aprovada do login materializada em ${path.relative(root, target)} (${bytes.length} bytes).`);
