import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  buildNormalizedPublicationPayload,
  evaluatePublicationDimensions,
  isBasicSecondInstallment,
} from "../_shared/financial-publication.mjs";

const ENGINE_ROOT = "https://raw.githubusercontent.com/WilsonMPeixoto-2/pdde-repasse-conciliador/main/public/data";
const MANIFEST_URL = `${ENGINE_ROOT}/pdde-2026-snapshot.json`;
const EXPECTED_ARTIFACT = "sigef-full-163-2026";
const LIMITS = { encoded: 20 * 1024 * 1024, compressed: 10 * 1024 * 1024, raw: 50 * 1024 * 1024 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function adminKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    const parsed = JSON.parse(modern);
    if (typeof parsed?.default === "string" && parsed.default) return parsed.default;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("SUPABASE_ADMIN_KEY_UNAVAILABLE");
}

function headers(key: string, body = false): Record<string, string> {
  const result: Record<string, string> = { apikey: key, accept: "application/json" };
  if (key.startsWith("eyJ")) result.Authorization = `Bearer ${key}`;
  if (body) result["content-type"] = "application/json";
  return result;
}

async function sb(path: string, key: string, init: RequestInit = {}) {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) throw new Error("SUPABASE_URL_UNAVAILABLE");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { ...headers(key, Boolean(init.body)), ...(init.headers ?? {}) },
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SUPABASE_HTTP_${response.status}:${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);
  return response.json();
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { accept: "text/plain" }, redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`SOURCE_PART_HTTP_${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > LIMITS.encoded) throw new Error("SOURCE_PART_TOO_LARGE");
  return response.text();
}

function validateManifest(input: any) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("MANIFEST_INVALID");
  if (input.encoding !== "gzip-base64-parts") throw new Error("MANIFEST_ENCODING_UNSUPPORTED");
  if (!Array.isArray(input.parts) || input.parts.length < 1 || input.parts.length > 64) throw new Error("MANIFEST_PARTS_INVALID");
  if (!input.parts.every((p: unknown) => typeof p === "string" && /^\/data\/pdde-2026-snapshot\.part\d+\.txt$/.test(p))) throw new Error("MANIFEST_PART_INVALID");
  if (typeof input.publishedAt !== "string" || Number.isNaN(Date.parse(input.publishedAt))) throw new Error("MANIFEST_PUBLISHED_AT_INVALID");
  if (!Number.isInteger(input.source?.workflowRunId) || input.source.workflowRunId <= 0) throw new Error("MANIFEST_RUN_INVALID");
  if (!Number.isInteger(input.source?.artifactId) || input.source.artifactId <= 0) throw new Error("MANIFEST_ARTIFACT_INVALID");
  if (input.source?.artifactName !== EXPECTED_ARTIFACT) throw new Error("MANIFEST_ARTIFACT_NAME_INVALID");
  return input;
}

function decode64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hydrate(manifest: any) {
  let encoded = "";
  for (const part of manifest.parts) {
    const text = (await fetchText(`${ENGINE_ROOT}/${part.replace(/^\/data\//, "")}`)).replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error("SNAPSHOT_BASE64_INVALID");
    encoded += text;
    if (encoded.length > LIMITS.encoded) throw new Error("SNAPSHOT_ENCODED_TOO_LARGE");
  }
  const compressed = decode64(encoded);
  if (compressed.byteLength > LIMITS.compressed) throw new Error("SNAPSHOT_COMPRESSED_TOO_LARGE");
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());
  if (raw.byteLength > LIMITS.raw) throw new Error("SNAPSHOT_RAW_TOO_LARGE");
  const snapshot = JSON.parse(new TextDecoder().decode(raw));
  if (
    snapshot?.publishedAt !== manifest.publishedAt ||
    snapshot?.source?.workflowRunId !== manifest.source.workflowRunId ||
    snapshot?.source?.artifactId !== manifest.source.artifactId ||
    snapshot?.source?.artifactName !== manifest.source.artifactName
  ) throw new Error("SNAPSHOT_PROVENANCE_MISMATCH");
  return { snapshot, digest: hex(await crypto.subtle.digest("SHA-256", raw)), rawBytes: raw.byteLength };
}

async function createAttempt(key: string) {
  const rows = await sb("/rest/v1/financial_sync_attempts?select=id", key, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "RUNNING", execution_id: Deno.env.get("SB_EXECUTION_ID") ?? null }),
  });
  return rows?.[0]?.id as string | undefined;
}

async function finishAttempt(key: string, id: string | undefined, patch: Record<string, unknown>) {
  if (!id) return;
  await sb(`/rest/v1/financial_sync_attempts?id=eq.${encodeURIComponent(id)}`, key, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...patch, finished_at: new Date().toISOString() }),
  }).catch((error) => console.error("ATTEMPT_UPDATE_FAILED", error instanceof Error ? error.message : String(error)));
}

function semanticKey(row: any) {
  return [row.inep, row.action ?? row.acao, row.installment ?? row.parcela].join("|");
}

function numericEqual(a: unknown, b: unknown) {
  if (a == null || b == null) return a === b;
  return Math.abs(Number(a) - Number(b)) < 0.005;
}

async function verify(payload: any, key: string) {
  const rows = await sb(`/rest/v1/vw_repasses_financeiros_unidade?select=inep,programa,acao,parcela,valor_programado,valor_pago,custeio_programado,capital_programado,custeio_pago,capital_pago,data_pagamento,data_ordem_pagamento&exercicio=eq.${payload.exercise}`, key);
  const runs = await sb(`/rest/v1/integracoes_financeiras_runs?select=workflow_run_id,artifact_id,publication_result&exercicio=eq.${payload.exercise}&workflow_run_id=eq.${payload.source.workflowRunId}&artifact_id=eq.${payload.source.artifactId}&limit=1`, key);
  if (!Array.isArray(runs) || runs.length !== 1) throw new Error("READ_AFTER_WRITE_PROVENANCE_MISMATCH");

  const byKey = new Map((rows ?? []).map((row: any) => [semanticKey(row), row]));
  let mismatches = 0;
  for (const expected of payload.repasses) {
    const observed: any = byKey.get(semanticKey(expected));
    if (!observed) { mismatches += 1; continue; }
    const checks = [
      [expected.program, observed.programa, "text"],
      [expected.programmed, observed.valor_programado, "number"],
      [expected.paid, observed.valor_pago, "number"],
      [expected.programmedCusteio, observed.custeio_programado, "number"],
      [expected.programmedCapital, observed.capital_programado, "number"],
      [expected.paidCusteio, observed.custeio_pago, "number"],
      [expected.paidCapital, observed.capital_pago, "number"],
      [expected.paymentDate, observed.data_pagamento, "text"],
      [expected.paymentOrderDate, observed.data_ordem_pagamento, "text"],
    ] as const;
    for (const [left, right, kind] of checks) {
      if (left == null) continue;
      if (kind === "number" ? !numericEqual(left, right) : String(left) !== String(right ?? "")) mismatches += 1;
    }
  }
  if (mismatches > 0) throw new Error(`READ_AFTER_WRITE_SEMANTIC_MISMATCH:${mismatches}`);

  const second = payload.repasses.filter((row: any) => isBasicSecondInstallment(row) && row.paid !== null && row.paymentDate);
  return {
    semanticRowsVerified: payload.repasses.length,
    secondCycleSchools: new Set(second.map((row: any) => row.inep)).size,
    secondCycleTotal: second.reduce((sum: number, row: any) => sum + Number(row.paid ?? 0), 0),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const key = adminKey();
  const attemptId = await createAttempt(key).catch(() => undefined);

  try {
    const manifest = validateManifest(await fetchJson(MANIFEST_URL));
    const { snapshot, digest, rawBytes } = await hydrate(manifest);
    const payload: any = buildNormalizedPublicationPayload(snapshot, manifest);
    const dimensions = evaluatePublicationDimensions(payload);
    const blocked = dimensions.filter((d: any) =>
      d.qualityStatus === "REJECTED" ||
      (d.dimensionKey !== "pdde_basic_second_installment_payment_informed" && d.qualityStatus !== "MATURE")
    );
    if (blocked.length) throw new Error(`SNAPSHOT_NOT_PUBLISHABLE:${blocked.map((d: any) => `${d.dimensionKey}:${d.coverageObserved}/${d.coverageExpected}`).join(",")}`);

    payload.source.snapshotDigest = digest;
    payload.dimensions = dimensions;

    const publication = await sb("/rest/v1/rpc/publish_financial_snapshot_with_order_evidence_v2", key, {
      method: "POST",
      body: JSON.stringify({ p_payload: payload }),
    });
    const checked = await verify(payload, key);
    const status = publication?.status === "idempotent" ? "ALREADY_CURRENT" : publication?.status === "unchanged" ? "UNCHANGED" : "PUBLISHED";

    await finishAttempt(key, attemptId, {
      status,
      source_workflow_run_id: manifest.source.workflowRunId,
      source_artifact_id: manifest.source.artifactId,
      source_published_at: manifest.publishedAt,
      snapshot_digest: digest,
      raw_bytes: rawBytes,
      schools_observed: payload.schools.length,
      repasses_observed: payload.repasses.length,
      semantic_rows_verified: checked.semanticRowsVerified,
      second_cycle_schools: checked.secondCycleSchools,
      second_cycle_total: checked.secondCycleTotal,
      error_code: null,
      error_message: null,
    });

    return json({ status, source: manifest.source, publishedAt: manifest.publishedAt, digest, ...checked });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FINANCIAL_SYNC_FAILED", message);
    await finishAttempt(key, attemptId, { status: "FAILED", error_code: message.split(":")[0].slice(0, 120), error_message: message.slice(0, 2000) });
    return json({ status: "FAILED", error: message }, 500);
  }
});
