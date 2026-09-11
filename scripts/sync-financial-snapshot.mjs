#!/usr/bin/env node
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

import {
  buildNormalizedPublicationPayload,
  evaluatePublicationDimensions,
} from "./lib/financial-publication.mjs";

const ENGINE_DATA_ROOT = "https://raw.githubusercontent.com/WilsonMPeixoto-2/pdde-repasse-conciliador/main/public/data";
const MANIFEST_URL = `${ENGINE_DATA_ROOT}/pdde-2026-snapshot.json`;
const EXPECTED_ARTIFACT_NAME = "sigef-full-163-2026";
const EXPECTED_SUPABASE_URL = "https://raluxyojqosfzrfozmpz.supabase.co";
const DEFAULT_LIMITS = {
  maxEncodedBytes: 20 * 1024 * 1024,
  maxCompressedBytes: 10 * 1024 * 1024,
  maxRawBytes: 50 * 1024 * 1024,
};

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function validatePublishedManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Manifesto financeiro inválido.");
  }
  if (manifest.encoding !== "gzip-base64-parts") {
    throw new Error(`Encoding financeiro não suportado: ${String(manifest.encoding ?? "(vazio)")}`);
  }
  if (!Array.isArray(manifest.parts) || manifest.parts.length === 0 || manifest.parts.length > 64) {
    throw new Error("Manifesto financeiro sem lista válida de partes.");
  }
  for (const part of manifest.parts) {
    if (typeof part !== "string" || !/^\/data\/pdde-2026-snapshot\.part\d+\.txt$/.test(part)) {
      throw new Error(`Parte de snapshot inválida: ${String(part)}`);
    }
  }
  if (typeof manifest.publishedAt !== "string" || Number.isNaN(Date.parse(manifest.publishedAt))) {
    throw new Error("Manifesto financeiro sem publishedAt válido.");
  }
  if (
    !manifest.source ||
    !isPositiveInteger(manifest.source.workflowRunId) ||
    !isPositiveInteger(manifest.source.artifactId) ||
    manifest.source.artifactName !== EXPECTED_ARTIFACT_NAME
  ) {
    throw new Error("Manifesto financeiro sem proveniência válida.");
  }
  return manifest;
}

function assertSnapshotMatchesManifest(snapshot, manifest) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Snapshot financeiro reidratado não é um objeto JSON.");
  }
  if (snapshot.publishedAt !== manifest.publishedAt) {
    throw new Error("Snapshot financeiro diverge do manifesto em publishedAt.");
  }
  if (
    snapshot.source?.workflowRunId !== manifest.source.workflowRunId ||
    snapshot.source?.artifactId !== manifest.source.artifactId ||
    snapshot.source?.artifactName !== manifest.source.artifactName
  ) {
    throw new Error("Snapshot financeiro diverge da proveniência do manifesto.");
  }
}

export async function hydratePublishedSnapshot(manifestInput, loadPart, options = {}) {
  const manifest = validatePublishedManifest(manifestInput);
  if (typeof loadPart !== "function") throw new Error("Carregador de partes não informado.");
  const limits = { ...DEFAULT_LIMITS, ...options };

  const chunks = [];
  let encodedBytes = 0;
  for (const part of manifest.parts) {
    const text = await loadPart(part);
    if (typeof text !== "string") throw new Error(`Parte do snapshot não textual: ${part}`);
    const normalized = text.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
      throw new Error(`Parte do snapshot não contém base64 válido: ${part}`);
    }
    encodedBytes += Buffer.byteLength(normalized, "ascii");
    if (encodedBytes > limits.maxEncodedBytes) {
      throw new Error("Snapshot financeiro excede o limite de dados codificados.");
    }
    chunks.push(normalized);
  }

  const encoded = chunks.join("");
  const compressed = Buffer.from(encoded, "base64");
  if (compressed.byteLength > limits.maxCompressedBytes) {
    throw new Error("Snapshot financeiro excede o limite comprimido.");
  }

  let raw;
  try {
    raw = gunzipSync(compressed, { maxOutputLength: limits.maxRawBytes + 1 });
  } catch (error) {
    if (error instanceof RangeError || String(error).includes("Buffer larger")) {
      throw new Error("Snapshot financeiro excede o limite descomprimido.");
    }
    throw error;
  }
  if (raw.byteLength > limits.maxRawBytes) {
    throw new Error("Snapshot financeiro excede o limite descomprimido.");
  }

  let snapshot;
  try {
    snapshot = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    throw new Error(`Snapshot financeiro contém JSON inválido: ${error instanceof Error ? error.message : String(error)}`);
  }
  assertSnapshotMatchesManifest(snapshot, manifest);

  return {
    snapshot,
    snapshotDigest: createHash("sha256").update(raw).digest("hex"),
    rawBytes: raw.byteLength,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Falha ao obter manifesto financeiro: HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: "text/plain" },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Falha ao obter parte do snapshot: HTTP ${response.status}`);
  }
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > DEFAULT_LIMITS.maxEncodedBytes) {
    throw new Error("Parte do snapshot excede o limite permitido.");
  }
  return response.text();
}

export async function fetchLatestPublishedSnapshot() {
  const manifest = validatePublishedManifest(await fetchJson(MANIFEST_URL));
  const hydrated = await hydratePublishedSnapshot(
    manifest,
    (part) => fetchText(`${ENGINE_DATA_ROOT}/${part.replace(/^\/data\//, "")}`),
  );
  return { manifest, ...hydrated };
}

export function prepareFinancialPublicationPayload(snapshot, manifest, snapshotDigest) {
  const payload = buildNormalizedPublicationPayload(snapshot, manifest);
  const dimensions = evaluatePublicationDimensions(payload);
  const blocked = dimensions.filter((dimension) => dimension.qualityStatus !== "MATURE");
  if (blocked.length > 0) {
    throw new Error(
      `Snapshot não publicável: ${blocked.map((dimension) => `${dimension.dimensionKey}=${dimension.coverageObserved}/${dimension.coverageExpected}:${dimension.qualityStatus}`).join(", ")}`,
    );
  }
  return {
    ...payload,
    source: { ...payload.source, snapshotDigest },
    dimensions,
  };
}

export async function publishFinancialPayload(payload, env = process.env) {
  const supabaseUrl = String(env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
    throw new Error("SUPABASE_URL não corresponde ao projeto PDDE Online autorizado.");
  }
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/publish_financial_snapshot_v1`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_payload: payload }),
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase recusou a publicação financeira: HTTP ${response.status} ${responseText.slice(0, 500)}`);
  }
  return responseText ? JSON.parse(responseText) : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { manifest, snapshot, snapshotDigest, rawBytes } = await fetchLatestPublishedSnapshot();
  const payload = prepareFinancialPublicationPayload(snapshot, manifest, snapshotDigest);
  const summary = {
    mode: dryRun ? "dry-run" : "publish",
    exercise: payload.exercise,
    workflowRunId: payload.source.workflowRunId,
    artifactId: payload.source.artifactId,
    schools: payload.schools.length,
    accounts: payload.accounts.length,
    repasses: payload.repasses.length,
    dimensions: payload.dimensions.map((dimension) => ({
      key: dimension.dimensionKey,
      coverage: `${dimension.coverageObserved}/${dimension.coverageExpected}`,
      quality: dimension.qualityStatus,
    })),
    snapshotDigest,
    rawBytes,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary));
    return;
  }

  const result = await publishFinancialPayload(payload);
  console.log(JSON.stringify({ ...summary, result }));
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
