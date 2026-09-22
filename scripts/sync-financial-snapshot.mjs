#!/usr/bin/env node
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

import {
  buildNormalizedPublicationPayload,
  evaluatePublicationDimensions,
} from "./lib/financial-publication.mjs";

const EXPECTED_SOURCE_REPOSITORY = "WilsonMPeixoto-2/pdde-repasse-conciliador";
const ENGINE_DATA_ROOT = `https://raw.githubusercontent.com/${EXPECTED_SOURCE_REPOSITORY}/main/public/data`;
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

function parseExpectedPositiveInteger(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!isPositiveInteger(parsed)) throw new Error(`${field} esperado é inválido.`);
  return parsed;
}

export function assertExpectedManifestProvenance(manifestInput, expected = {}) {
  const manifest = validatePublishedManifest(manifestInput);
  const sourceRepository = String(expected.sourceRepository ?? "").trim();
  const artifactName = String(expected.artifactName ?? "").trim();
  const publishedAt = String(expected.publishedAt ?? "").trim();
  const workflowRunId = parseExpectedPositiveInteger(expected.workflowRunId, "workflowRunId");
  const artifactId = parseExpectedPositiveInteger(expected.artifactId, "artifactId");

  if (sourceRepository && sourceRepository !== EXPECTED_SOURCE_REPOSITORY) {
    throw new Error(`Repositório de origem inesperado: ${sourceRepository}`);
  }
  if (workflowRunId !== null && workflowRunId !== manifest.source.workflowRunId) {
    throw new Error(`workflowRunId do evento diverge do manifesto: ${workflowRunId} != ${manifest.source.workflowRunId}`);
  }
  if (artifactId !== null && artifactId !== manifest.source.artifactId) {
    throw new Error(`artifactId do evento diverge do manifesto: ${artifactId} != ${manifest.source.artifactId}`);
  }
  if (artifactName && artifactName !== manifest.source.artifactName) {
    throw new Error(`artifactName do evento diverge do manifesto: ${artifactName} != ${manifest.source.artifactName}`);
  }
  if (publishedAt && publishedAt !== manifest.publishedAt) {
    throw new Error(`publishedAt do evento diverge do manifesto: ${publishedAt} != ${manifest.publishedAt}`);
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
  const progressiveDimensions = new Set([
    "pdde_basic_second_installment_payment_informed",
  ]);
  const blocked = dimensions.filter((dimension) => (
    dimension.qualityStatus === "REJECTED"
    || (
      !progressiveDimensions.has(dimension.dimensionKey)
      && dimension.qualityStatus !== "MATURE"
    )
  ));
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

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/publish_financial_snapshot_with_order_evidence_v1`, {
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
    throw new Error(`Supabase recusou a publicação financeira com evidências de ordem: HTTP ${response.status} ${responseText.slice(0, 500)}`);
  }
  return responseText ? JSON.parse(responseText) : null;
}

function financialHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
  };
}

async function fetchSupabaseRows(url, serviceRoleKey) {
  const response = await fetch(url, {
    headers: financialHeaders(serviceRoleKey),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Read-after-write financeiro falhou: HTTP ${response.status} ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : [];
}

function isBasicSecondInstallmentPayload(row) {
  return row.program === "PDDE BÁSICO" && (
    (row.action === "PDDE Básico" && row.installment === "2ª Parcela")
    || (row.action === "PDDE Básico — Primeira Infância" && row.installment === "P2")
  );
}

function repasseSemanticKey(row) {
  return [row.inep, row.action, row.installment].join("|");
}

function numericEqual(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.005;
}

export async function verifyPublishedFinancialState(payload, env = process.env) {
  const supabaseUrl = String(env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
    throw new Error("SUPABASE_URL não corresponde ao projeto PDDE Online autorizado.");
  }
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");

  const [viewRows, integrationRows] = await Promise.all([
    fetchSupabaseRows(
      `${supabaseUrl}/rest/v1/vw_repasses_financeiros_unidade?select=inep,programa,acao,parcela,valor_programado,valor_pago,custeio_programado,capital_programado,custeio_pago,capital_pago,data_pagamento,data_ordem_pagamento&exercicio=eq.${payload.exercise}`,
      serviceRoleKey,
    ),
    fetchSupabaseRows(
      `${supabaseUrl}/rest/v1/integracoes_financeiras_runs?select=workflow_run_id,artifact_id,publication_result,criado_em&exercicio=eq.${payload.exercise}&origem=eq.pdde-repasse-conciliador&order=workflow_run_id.desc,criado_em.desc&limit=1`,
      serviceRoleKey,
    ),
  ]);

  const latestIntegration = integrationRows[0] ?? null;
  if (
    !latestIntegration
    || Number(latestIntegration.workflow_run_id) !== Number(payload.source.workflowRunId)
    || Number(latestIntegration.artifact_id) !== Number(payload.source.artifactId)
  ) {
    throw new Error(
      `Read-after-write: proveniência persistida diverge do snapshot `
      + `(esperado run=${payload.source.workflowRunId}/artifact=${payload.source.artifactId}; `
      + `observado run=${latestIntegration?.workflow_run_id ?? "ausente"}/artifact=${latestIntegration?.artifact_id ?? "ausente"}).`,
    );
  }

  const expectedSecond = payload.repasses.filter(
    (row) => isBasicSecondInstallmentPayload(row) && row.paid !== null,
  );
  const observedSecond = viewRows.filter((row) => (
    row.programa === "PDDE BÁSICO"
    && (
      (row.acao === "PDDE Básico" && row.parcela === "2ª Parcela")
      || (row.acao === "PDDE Básico — Primeira Infância" && row.parcela === "P2")
    )
    && row.valor_pago !== null
  ));

  const expectedSchools = new Set(expectedSecond.map((row) => row.inep));
  const observedSchools = new Set(observedSecond.map((row) => row.inep));
  const expectedTotal = expectedSecond.reduce((sum, row) => sum + Number(row.paid ?? 0), 0);
  const observedTotal = observedSecond.reduce((sum, row) => sum + Number(row.valor_pago ?? 0), 0);

  if (expectedSchools.size !== observedSchools.size || !numericEqual(expectedTotal, observedTotal)) {
    throw new Error(
      `Read-after-write: 2º ciclo diverge entre snapshot e view operacional `
      + `(escolas ${observedSchools.size}/${expectedSchools.size}; `
      + `valor ${observedTotal.toFixed(2)}/${expectedTotal.toFixed(2)}).`,
    );
  }

  const observedByKey = new Map(
    observedSecond.map((row) => [[row.inep, row.acao, row.parcela].join("|"), row]),
  );
  const divergences = expectedSecond.filter((expected) => {
    const observed = observedByKey.get(repasseSemanticKey(expected));
    if (!observed || !numericEqual(observed.valor_pago, expected.paid)) return true;
    const expectedOrderDate = expected.paymentOrderDate ?? null;
    if ((observed.data_ordem_pagamento ?? null) !== expectedOrderDate) return true;
    return (observed.data_pagamento ?? null) !== (expected.paymentDate ?? null);
  });

  if (divergences.length > 0) {
    throw new Error(
      `Read-after-write: ${divergences.length} repasses do 2º ciclo divergem semanticamente da view operacional.`,
    );
  }

  const allObservedByKey = new Map(
    viewRows.map((row) => [[row.inep, row.acao, row.parcela].join("|"), row]),
  );
  const semanticMismatches = [];

  for (const expected of payload.repasses) {
    const observed = allObservedByKey.get(repasseSemanticKey(expected));
    if (!observed) {
      semanticMismatches.push({ key: repasseSemanticKey(expected), field: "row", expected: "present", observed: "missing" });
      continue;
    }

    const comparisons = [
      ["programa", expected.program, observed.programa, "text"],
      ["valor_programado", expected.programmed, observed.valor_programado, "number"],
      ["valor_pago", expected.paid, observed.valor_pago, "number"],
      ["custeio_programado", expected.programmedCusteio, observed.custeio_programado, "number"],
      ["capital_programado", expected.programmedCapital, observed.capital_programado, "number"],
      ["custeio_pago", expected.paidCusteio, observed.custeio_pago, "number"],
      ["capital_pago", expected.paidCapital, observed.capital_pago, "number"],
      ["data_pagamento", expected.paymentDate, observed.data_pagamento, "text"],
      ["data_ordem_pagamento", expected.paymentOrderDate, observed.data_ordem_pagamento, "text"],
    ];

    for (const [field, expectedValue, observedValue, kind] of comparisons) {
      if (expectedValue === null || expectedValue === undefined) continue;
      const equal = kind === "number"
        ? numericEqual(expectedValue, observedValue)
        : String(expectedValue) === String(observedValue ?? "");
      if (!equal) {
        semanticMismatches.push({
          key: repasseSemanticKey(expected),
          field,
          expected: expectedValue,
          observed: observedValue ?? null,
        });
      }
    }
  }

  if (semanticMismatches.length > 0) {
    console.error(JSON.stringify({
      status: "OPERATIONAL_VIEW_DIVERGENCE",
      mismatchCount: semanticMismatches.length,
      examples: semanticMismatches.slice(0, 25),
    }));
    throw new Error(
      `Read-after-write: a view operacional diverge do snapshot em ${semanticMismatches.length} fato(s) financeiro(s).`,
    );
  }

  return {
    workflowRunId: payload.source.workflowRunId,
    artifactId: payload.source.artifactId,
    secondInstallmentSchools: observedSchools.size,
    secondInstallmentTotal: observedTotal,
    semanticRowsVerified: payload.repasses.length,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { manifest, snapshot, snapshotDigest, rawBytes } = await fetchLatestPublishedSnapshot();
  assertExpectedManifestProvenance(manifest, {
    sourceRepository: process.env.EXPECTED_SOURCE_REPOSITORY,
    workflowRunId: process.env.EXPECTED_WORKFLOW_RUN_ID,
    artifactId: process.env.EXPECTED_ARTIFACT_ID,
    artifactName: process.env.EXPECTED_ARTIFACT_NAME,
    publishedAt: process.env.EXPECTED_PUBLISHED_AT,
  });
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
  const readAfterWrite = await verifyPublishedFinancialState(payload);
  console.log(JSON.stringify({ ...summary, result, readAfterWrite }));
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
