import type { RepasseFinanceiro } from "@/lib/financeiroPDDE";

const ENGINE_REPOSITORY = "WilsonMPeixoto-2/pdde-repasse-conciliador";
const ENGINE_DATA_ROOT =
  `https://raw.githubusercontent.com/${ENGINE_REPOSITORY}/main/public/data`;
const MANIFEST_URL = `${ENGINE_DATA_ROOT}/pdde-2026-snapshot.json`;

type MotorManifest = {
  encoding: "gzip-base64-parts";
  parts: string[];
  publishedAt: string;
  source: {
    workflowRunId: number;
    artifactId: number;
    artifactName: string;
  };
};

type MotorInstallment = {
  installment?: string | null;
  programmedCents?: number | null;
  paymentInformedCents?: number | null;
  paymentInformedDate?: string | null;
  paymentOrderDate?: string | null;
  breakdown?: {
    programmedCusteioCents?: number | null;
    programmedCapitalCents?: number | null;
    paidCusteioCents?: number | null;
    paidCapitalCents?: number | null;
  } | null;
  account?: {
    bank?: string | null;
    agency?: string | null;
    number?: string | null;
  } | null;
};

type MotorSchoolRecord = {
  school: {
    inep: string;
    sme?: string | null;
    name?: string | null;
  };
  programs?: Array<{
    name?: string | null;
    installments?: MotorInstallment[];
  }>;
};

type MotorSnapshot = {
  publishedAt: string;
  source: MotorManifest["source"];
  portfolio?: { fiscalYear?: number | null };
  schools: Record<string, MotorSchoolRecord>;
};

export type MotorFinancialProjection = {
  publishedAt: string;
  workflowRunId: number;
  artifactId: number;
  repasses: Array<{
    inep: string;
    designacao: string | null;
    nome: string | null;
    exercicio: number;
    programa: string;
    acao: string;
    parcela: string;
    ordem_exibicao: number;
    valor_programado: number;
    valor_pago: number | null;
    data_pagamento: string | null;
    data_ordem_pagamento: string | null;
    banco: string | null;
    agencia: string | null;
    conta_corrente: string | null;
    custeio_programado: number | null;
    capital_programado: number | null;
    custeio_pago: number | null;
    capital_pago: number | null;
  }>;
};

export type MotorMergeResult = {
  rows: RepasseFinanceiro[];
  sourcePublishedAt: string;
  changedRows: number;
  insertedRows: number;
};

function normalizedText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function stripExercise(value: string) {
  return value
    .replace(/\b20\d{2}\b/g, "")
    .replace(/^[\/\-\s]+|[\/\-\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const QUALITY_ACTIONS = new Map([
  ["EDUCACAO CONECTADA", "Educação Conectada"],
  ["ESCOLA E COMUNIDADE", "Escola e Comunidade"],
  ["ESCOLA DAS ADOLESCENCIAS", "Escola das Adolescências"],
  ["CANTINHO DA LEITURA", "Cantinho da Leitura"],
]);

function classifyProgram(programName: unknown) {
  const raw = String(programName ?? "").trim();
  const text = normalizedText(raw);
  const standaloneAction = normalizedText(stripExercise(raw));

  if (text.includes("PRIMEIRA INFANCIA")) {
    return { programa: "PDDE BÁSICO", acao: "PDDE Básico — Primeira Infância" };
  }

  const qualityAction = QUALITY_ACTIONS.get(standaloneAction);
  if (qualityAction) return { programa: "PDDE QUALIDADE", acao: qualityAction };
  if (standaloneAction === "PDDE SRM") return { programa: "PDDE EQUIDADE", acao: "PDDE SRM" };

  if (text.includes("QUALIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+QUALIDADE/i, "").trim();
    return { programa: "PDDE QUALIDADE", acao: stripExercise(action) || "PDDE Qualidade" };
  }

  if (text.includes("EQUIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+EQUIDADE/i, "").trim();
    return { programa: "PDDE EQUIDADE", acao: stripExercise(action) || "PDDE Equidade" };
  }

  return { programa: "PDDE BÁSICO", acao: "PDDE Básico" };
}

function canonicalInstallment(value: unknown) {
  const raw = String(value ?? "").trim();
  const text = normalizedText(raw);
  if (!raw) return "Parcela única";
  if (
    text === "P1" ||
    text.includes("1A PARCELA") ||
    text.includes("1ª PARCELA") ||
    text.includes("PRIMEIRA PARCELA")
  ) {
    return text === "P1" ? "P1" : "1ª Parcela";
  }
  if (
    text === "P2" ||
    text.includes("2A PARCELA") ||
    text.includes("2ª PARCELA") ||
    text.includes("SEGUNDA PARCELA")
  ) {
    return text === "P2" ? "P2" : "2ª Parcela";
  }
  return raw;
}

function installmentOrder(value: unknown, index: number) {
  const text = normalizedText(value);
  if (text === "P1" || text.includes("1A PARCELA") || text.includes("1ª PARCELA") || text.includes("PRIMEIRA")) return 1;
  if (text === "P2" || text.includes("2A PARCELA") || text.includes("2ª PARCELA") || text.includes("SEGUNDA")) return 2;
  return index + 1;
}

function cents(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value / 100 : null;
}

function informedPayment(installment: MotorInstallment) {
  if (
    typeof installment.paymentInformedCents !== "number" ||
    !Number.isFinite(installment.paymentInformedCents)
  ) return null;
  if (
    installment.paymentInformedCents === 0 &&
    !installment.paymentInformedDate &&
    !installment.paymentOrderDate
  ) return null;
  return installment.paymentInformedCents / 100;
}

function assertManifest(value: unknown): MotorManifest {
  const manifest = value as MotorManifest;
  if (
    !manifest ||
    manifest.encoding !== "gzip-base64-parts" ||
    !Array.isArray(manifest.parts) ||
    manifest.parts.length === 0 ||
    typeof manifest.publishedAt !== "string" ||
    !manifest.source ||
    !Number.isInteger(manifest.source.workflowRunId) ||
    !Number.isInteger(manifest.source.artifactId)
  ) {
    throw new Error("O manifesto financeiro do motor é inválido.");
  }
  return manifest;
}

async function fetchText(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "text/plain" },
  });
  if (!response.ok) throw new Error(`Falha ao obter snapshot financeiro do motor: HTTP ${response.status}`);
  return response.text();
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function gunzipJson<T>(encoded: string): Promise<T> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador não suporta a leitura do snapshot financeiro publicado.");
  }
  const compressed = decodeBase64(encoded);
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return JSON.parse(text) as T;
}

export async function fetchLatestMotorFinancialProjection(
  signal?: AbortSignal,
): Promise<MotorFinancialProjection> {
  const manifestResponse = await fetch(MANIFEST_URL, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!manifestResponse.ok) {
    throw new Error(`Falha ao obter manifesto financeiro do motor: HTTP ${manifestResponse.status}`);
  }
  const manifest = assertManifest(await manifestResponse.json());

  const encoded = (
    await Promise.all(
      manifest.parts.map((part) => {
        const name = part.split("/").at(-1);
        if (!name) throw new Error("Parte inválida no manifesto financeiro.");
        return fetchText(`${ENGINE_DATA_ROOT}/${name}`, signal);
      }),
    )
  ).join("");

  const snapshot = await gunzipJson<MotorSnapshot>(encoded);
  if (snapshot.publishedAt !== manifest.publishedAt) {
    throw new Error("Snapshot e manifesto do motor divergem em publishedAt.");
  }

  const exercicio = Number(snapshot.portfolio?.fiscalYear ?? 2026);
  const repasses: MotorFinancialProjection["repasses"] = [];

  for (const record of Object.values(snapshot.schools ?? {})) {
    const inep = record.school?.inep;
    if (!/^\d{8}$/.test(inep ?? "")) continue;

    for (const program of record.programs ?? []) {
      const { programa, acao } = classifyProgram(program.name);
      (program.installments ?? []).forEach((installment, index) => {
        const paid = informedPayment(installment);
        const breakdown = installment.breakdown ?? null;
        repasses.push({
          inep,
          designacao: record.school.sme ?? null,
          nome: record.school.name ?? null,
          exercicio,
          programa,
          acao,
          parcela: canonicalInstallment(installment.installment),
          ordem_exibicao: installmentOrder(installment.installment, index),
          valor_programado: cents(installment.programmedCents) ?? 0,
          valor_pago: paid,
          data_pagamento: installment.paymentInformedDate ?? null,
          data_ordem_pagamento: installment.paymentOrderDate ?? null,
          banco: installment.account?.bank ?? null,
          agencia: installment.account?.agency ?? null,
          conta_corrente: installment.account?.number ?? null,
          custeio_programado: cents(breakdown?.programmedCusteioCents),
          capital_programado: cents(breakdown?.programmedCapitalCents),
          custeio_pago: paid === null ? null : cents(breakdown?.paidCusteioCents),
          capital_pago: paid === null ? null : cents(breakdown?.paidCapitalCents),
        });
      });
    }
  }

  return {
    publishedAt: manifest.publishedAt,
    workflowRunId: manifest.source.workflowRunId,
    artifactId: manifest.source.artifactId,
    repasses,
  };
}

function rowKey(input: { inep: string | null; acao: string; parcela: string }) {
  return `${input.inep ?? ""}|${input.acao}|${input.parcela}`;
}

function financialFactsDiffer(current: RepasseFinanceiro, incoming: MotorFinancialProjection["repasses"][number]) {
  return (
    current.valor_programado !== incoming.valor_programado ||
    current.valor_pago !== incoming.valor_pago ||
    current.data_pagamento !== incoming.data_pagamento ||
    current.data_ordem_pagamento !== incoming.data_ordem_pagamento ||
    current.custeio_programado !== incoming.custeio_programado ||
    current.capital_programado !== incoming.capital_programado ||
    current.custeio_pago !== incoming.custeio_pago ||
    current.capital_pago !== incoming.capital_pago
  );
}

export function mergeMotorFinancialProjection(
  persisted: RepasseFinanceiro[],
  motor: MotorFinancialProjection,
): MotorMergeResult {
  const byKey = new Map(persisted.map((row) => [rowKey(row), row]));
  const schoolIdentity = new Map<string, RepasseFinanceiro>();
  for (const row of persisted) {
    if (row.inep && !schoolIdentity.has(row.inep)) schoolIdentity.set(row.inep, row);
  }

  let changedRows = 0;
  let insertedRows = 0;
  const merged = new Map<string, RepasseFinanceiro>();

  for (const row of persisted) merged.set(rowKey(row), row);

  for (const incoming of motor.repasses) {
    const key = rowKey(incoming);
    const current = byKey.get(key);
    if (current) {
      if (financialFactsDiffer(current, incoming)) changedRows += 1;
      merged.set(key, {
        ...current,
        exercicio: incoming.exercicio,
        programa: incoming.programa,
        acao: incoming.acao,
        parcela: incoming.parcela,
        ordem_exibicao: incoming.ordem_exibicao,
        valor_programado: incoming.valor_programado,
        valor_pago: incoming.valor_pago,
        data_pagamento: incoming.data_pagamento,
        data_ordem_pagamento: incoming.data_ordem_pagamento,
        banco: incoming.banco ?? current.banco,
        agencia: incoming.agencia ?? current.agencia,
        conta_corrente: incoming.conta_corrente ?? current.conta_corrente,
        custeio_programado: incoming.custeio_programado,
        capital_programado: incoming.capital_programado,
        custeio_pago: incoming.custeio_pago,
        capital_pago: incoming.capital_pago,
      });
      continue;
    }

    const identity = schoolIdentity.get(incoming.inep);
    if (!identity) continue;
    insertedRows += 1;
    merged.set(key, {
      id: `motor:${key}`,
      unidade_id: identity.unidade_id,
      designacao: identity.designacao ?? incoming.designacao,
      nome: identity.nome ?? incoming.nome,
      inep: incoming.inep,
      exercicio: incoming.exercicio,
      programa: incoming.programa,
      acao: incoming.acao,
      parcela: incoming.parcela,
      ordem_exibicao: incoming.ordem_exibicao,
      valor_programado: incoming.valor_programado,
      valor_pago: incoming.valor_pago,
      data_pagamento: incoming.data_pagamento,
      data_ordem_pagamento: incoming.data_ordem_pagamento,
      conta_bancaria_id: null,
      banco: incoming.banco,
      agencia: incoming.agencia,
      conta_corrente: incoming.conta_corrente,
      custeio_programado: incoming.custeio_programado,
      capital_programado: incoming.capital_programado,
      custeio_pago: incoming.custeio_pago,
      capital_pago: incoming.capital_pago,
    });
  }

  return {
    rows: [...merged.values()].sort(
      (a, b) =>
        (a.designacao ?? "").localeCompare(b.designacao ?? "", "pt-BR") ||
        a.ordem_exibicao - b.ordem_exibicao,
    ),
    sourcePublishedAt: motor.publishedAt,
    changedRows,
    insertedRows,
  };
}
