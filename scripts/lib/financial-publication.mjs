const CURRENT_EXERCISE = 2026;

function normalizedText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function centsToReais(value) {
  return typeof value === "number" && Number.isFinite(value) ? value / 100 : null;
}

function canonicalAccountProgram(program) {
  const text = normalizedText(program);
  if (text.includes("EQUIDADE")) return "PDDE EQUIDADE";
  if (text.includes("QUALIDADE")) return "PDDE QUALIDADE";
  return "PDDE BÁSICO";
}

function stripExercise(value) {
  return value
    .replace(/\b20\d{2}\b/g, "")
    .replace(/^[\/\-\s]+|[\/\-\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyProgram(programName) {
  const raw = String(programName ?? "").trim();
  const text = normalizedText(raw);

  if (text.includes("PRIMEIRA INFANCIA")) {
    return { program: "PDDE BÁSICO", action: "PDDE Básico — Primeira Infância" };
  }

  if (text.includes("QUALIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+QUALIDADE/i, "").trim();
    action = stripExercise(action);
    return { program: "PDDE QUALIDADE", action: action || "PDDE Qualidade" };
  }

  if (text.includes("EQUIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+EQUIDADE/i, "").trim();
    action = stripExercise(action);
    return { program: "PDDE EQUIDADE", action: action || "PDDE Equidade" };
  }

  if (text.includes("PDDE BASICO") || text === "PDDE" || text.startsWith("PDDE /")) {
    return { program: "PDDE BÁSICO", action: "PDDE Básico" };
  }

  throw new Error(`Programa financeiro não reconhecido: ${raw || "(vazio)"}`);
}

function canonicalInstallment(value) {
  const raw = String(value ?? "").trim();
  const text = normalizedText(raw);
  if (!raw) return "Parcela única";
  if (text === "P1" || text.includes("1A PARCELA") || text.includes("1ª PARCELA") || text.includes("PRIMEIRA PARCELA")) {
    return text === "P1" ? "P1" : "1ª Parcela";
  }
  if (text === "P2" || text.includes("2A PARCELA") || text.includes("2ª PARCELA") || text.includes("SEGUNDA PARCELA")) {
    return text === "P2" ? "P2" : "2ª Parcela";
  }
  return raw;
}

function installmentOrder(value, index) {
  const text = normalizedText(value);
  if (text === "P1" || text.includes("1A PARCELA") || text.includes("1ª PARCELA") || text.includes("PRIMEIRA")) return 1;
  if (text === "P2" || text.includes("2A PARCELA") || text.includes("2ª PARCELA") || text.includes("SEGUNDA")) return 2;
  return index + 1;
}

function informedPayment(installment) {
  if (installment?.paymentInformedDate) return centsToReais(installment.paymentInformedCents);
  return null;
}

function normalizeAccount(account, inep, exercise) {
  return {
    inep,
    exercise,
    program: canonicalAccountProgram(account?.program),
    bank: String(account?.bank ?? "").trim() || null,
    agency: String(account?.agency ?? "").trim() || null,
    account: String(account?.account ?? "").trim() || null,
    primary: false,
  };
}

function accountSortKey(account) {
  return [
    account.program === "PDDE BÁSICO" ? "0" : "1",
    account.program,
    account.bank ?? "",
    account.agency ?? "",
    account.account ?? "",
  ].join("|");
}

function markOnePrincipal(accounts) {
  const sorted = [...accounts].sort((a, b) => accountSortKey(a).localeCompare(accountSortKey(b), "pt-BR"));
  if (sorted[0]) sorted[0].primary = true;
  return sorted;
}

function normalizeRepasse(installment, programName, school, exercise, index) {
  const { program, action } = classifyProgram(programName);
  const paymentDate = installment?.paymentInformedDate ?? null;
  const breakdown = installment?.breakdown ?? null;
  const account = installment?.account
    ? {
        bank: String(installment.account.bank ?? "").trim() || null,
        agency: String(installment.account.agency ?? "").trim() || null,
        account: String(installment.account.number ?? "").trim() || null,
      }
    : null;

  return {
    inep: school.inep,
    exercise,
    program,
    action,
    installment: canonicalInstallment(installment?.installment),
    displayOrder: installmentOrder(installment?.installment, index),
    programmed: centsToReais(installment?.programmedCents),
    paid: informedPayment(installment),
    programmedCusteio: centsToReais(breakdown?.programmedCusteioCents),
    programmedCapital: centsToReais(breakdown?.programmedCapitalCents),
    paidCusteio: paymentDate ? centsToReais(breakdown?.paidCusteioCents) : null,
    paidCapital: paymentDate ? centsToReais(breakdown?.paidCapitalCents) : null,
    paymentDate,
    paymentOrderDate: installment?.paymentOrderDate ?? null,
    account,
  };
}

function validateSource(snapshot, manifest) {
  if (!manifest?.source?.workflowRunId || !manifest?.source?.artifactId || !manifest?.publishedAt) {
    throw new Error("Manifesto financeiro sem proveniência mínima.");
  }
  if (snapshot?.publishedAt !== manifest.publishedAt) {
    throw new Error("Snapshot e manifesto divergem em publishedAt.");
  }
  if (
    snapshot?.source?.workflowRunId !== manifest.source.workflowRunId ||
    snapshot?.source?.artifactId !== manifest.source.artifactId
  ) {
    throw new Error("Snapshot e manifesto divergem na origem publicada.");
  }
}

export function buildNormalizedPublicationPayload(snapshot, manifest) {
  validateSource(snapshot, manifest);
  const exercise = Number(snapshot?.portfolio?.fiscalYear ?? CURRENT_EXERCISE);
  if (exercise !== CURRENT_EXERCISE) {
    throw new Error(`Exercício financeiro inesperado: ${exercise}`);
  }

  const schools = Object.values(snapshot?.schools ?? {});
  const accounts = [];
  const repasses = [];

  for (const schoolRecord of schools) {
    const school = schoolRecord?.school;
    if (!school?.inep) throw new Error("Prontuário financeiro sem INEP.");

    const schoolAccounts = (schoolRecord.accounts ?? []).map((account) => normalizeAccount(account, school.inep, exercise));
    accounts.push(...markOnePrincipal(schoolAccounts));

    for (const programRecord of schoolRecord.programs ?? []) {
      (programRecord.installments ?? []).forEach((installment, index) => {
        repasses.push(normalizeRepasse(installment, programRecord.name, school, exercise, index));
      });
    }
  }

  return {
    exercise,
    source: {
      origin: "pdde-repasse-conciliador",
      publishedAt: manifest.publishedAt,
      workflowRunId: manifest.source.workflowRunId,
      artifactId: manifest.source.artifactId,
      artifactName: manifest.source.artifactName ?? "sigef-full-163-2026",
    },
    schools: schools.map((record) => ({
      inep: record.school.inep,
      sme: record.school.sme,
      name: record.school.name,
    })),
    accounts,
    repasses,
  };
}
