const CURRENT_EXERCISE = 2026;
const EXPECTED_SCHOOLS = 163;

const CORE_DIMENSION_VALIDATORS = new Map([
  ["bank_accounts", "bank_accounts_v1"],
  ["scheduled_repasses", "scheduled_repasses_v1"],
  ["pdde_basic_first_installment", "pdde_basic_first_installment_v1"],
  ["pdde_basic_first_installment_breakdown", "pdde_basic_first_installment_breakdown_v1"],
  ["pdde_basic_second_installment_programmed", "pdde_basic_second_installment_programmed_v1"],
]);

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

const STANDALONE_QUALITY_ACTIONS = new Map([
  ["EDUCACAO CONECTADA", "Educação Conectada"],
  ["ESCOLA E COMUNIDADE", "Escola e Comunidade"],
  ["ESCOLA DAS ADOLESCENCIAS", "Escola das Adolescências"],
  ["CANTINHO DA LEITURA", "Cantinho da Leitura"],
]);

function classifyProgram(programName) {
  const raw = String(programName ?? "").trim();
  const text = normalizedText(raw);
  const standaloneAction = normalizedText(stripExercise(raw));

  if (text.includes("PRIMEIRA INFANCIA")) {
    return { program: "PDDE BÁSICO", action: "PDDE Básico — Primeira Infância" };
  }

  const qualityAction = STANDALONE_QUALITY_ACTIONS.get(standaloneAction);
  if (qualityAction) {
    return { program: "PDDE QUALIDADE", action: qualityAction };
  }

  if (standaloneAction === "PDDE SRM") {
    return { program: "PDDE EQUIDADE", action: "PDDE SRM" };
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

function hasCompleteAccountIdentity(account) {
  return [account?.bank, account?.agency, account?.account].every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
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

function isBasicFirstInstallment(repasse) {
  if (repasse.program !== "PDDE BÁSICO") return false;
  return (
    (repasse.action === "PDDE Básico" && repasse.installment === "1ª Parcela") ||
    (repasse.action === "PDDE Básico — Primeira Infância" && repasse.installment === "P1")
  );
}

function isBasicSecondInstallment(repasse) {
  if (repasse.program !== "PDDE BÁSICO") return false;
  return (
    (repasse.action === "PDDE Básico" && repasse.installment === "2ª Parcela") ||
    (repasse.action === "PDDE Básico — Primeira Infância" && repasse.installment === "P2")
  );
}

function uniqueCoverage(rows, predicate = () => true) {
  return new Set(rows.filter(predicate).map((row) => row.inep).filter(Boolean)).size;
}

function dateBounds(rows) {
  const dates = rows.map((row) => row.paymentDate).filter(Boolean).sort();
  return {
    referenceDateMin: dates[0] ?? null,
    referenceDateMax: dates.at(-1) ?? null,
  };
}

function normalizeContract(contract) {
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    throw new Error("Contrato financeiro inválido.");
  }

  const normalized = {
    dimensionKey: String(contract.dimensionKey ?? "").trim(),
    exercise: Number(contract.exercise),
    contractVersion: Number(contract.contractVersion),
    coverageExpected: Number(contract.coverageExpected),
    coverageRequiredRatio: Number(contract.coverageRequiredRatio),
    requirements: contract.requirements ?? {},
    enabled: contract.enabled === true,
    requiredForCorePublication: contract.requiredForCorePublication === true,
    validatorKey: String(contract.validatorKey ?? "").trim(),
  };

  if (
    !normalized.dimensionKey ||
    normalized.exercise !== CURRENT_EXERCISE ||
    !Number.isInteger(normalized.contractVersion) ||
    normalized.contractVersion <= 0 ||
    !Number.isInteger(normalized.coverageExpected) ||
    normalized.coverageExpected <= 0 ||
    !Number.isFinite(normalized.coverageRequiredRatio) ||
    normalized.coverageRequiredRatio <= 0 ||
    normalized.coverageRequiredRatio > 1 ||
    !normalized.validatorKey
  ) {
    throw new Error(`Contrato financeiro inválido: ${normalized.dimensionKey || "(sem chave)"}.`);
  }

  return normalized;
}

export function validateFinancialDimensionContracts(contracts) {
  if (!Array.isArray(contracts)) {
    throw new Error("Lista de contratos financeiros não informada.");
  }

  const normalized = contracts.map(normalizeContract);
  const byKey = new Map();
  for (const contract of normalized) {
    if (byKey.has(contract.dimensionKey)) {
      throw new Error(`Contrato financeiro duplicado: ${contract.dimensionKey}.`);
    }
    byKey.set(contract.dimensionKey, contract);
  }

  for (const [dimensionKey, validatorKey] of CORE_DIMENSION_VALIDATORS) {
    const contract = byKey.get(dimensionKey);
    if (!contract || !contract.enabled || !contract.requiredForCorePublication) {
      throw new Error(`Contrato financeiro obrigatório ausente ou desabilitado: ${dimensionKey}.`);
    }
    if (contract.validatorKey !== validatorKey) {
      throw new Error(`Validador financeiro incompatível para ${dimensionKey}: ${contract.validatorKey || "(vazio)"}.`);
    }
  }

  for (const contract of normalized) {
    if (
      contract.enabled &&
      contract.requiredForCorePublication &&
      !CORE_DIMENSION_VALIDATORS.has(contract.dimensionKey)
    ) {
      throw new Error(`Dimensão obrigatória sem validador semântico conhecido: ${contract.dimensionKey}.`);
    }
  }

  return normalized;
}

function dimensionStatus(contract, coverageObserved, { rejected = false, dates = [] } = {}) {
  const coverageRatio = Math.min(coverageObserved / contract.coverageExpected, 1);
  const mature = !rejected && coverageRatio >= contract.coverageRequiredRatio;
  return {
    dimensionKey: contract.dimensionKey,
    coverageObserved,
    coverageExpected: contract.coverageExpected,
    coverageRatio,
    qualityStatus: rejected ? "REJECTED" : mature ? "MATURE" : "VALIDATED",
    publicationStatus: "UNPUBLISHED",
    ...dateBounds(dates),
  };
}

export function evaluatePublicationDimensions(payload, contracts) {
  if (Number(payload?.exercise) !== CURRENT_EXERCISE) {
    throw new Error(`Exercício financeiro inesperado: ${payload?.exercise}`);
  }

  const contractList = validateFinancialDimensionContracts(contracts);
  const requiredContracts = new Map(
    contractList
      .filter((contract) => contract.enabled && contract.requiredForCorePublication)
      .map((contract) => [contract.dimensionKey, contract]),
  );

  const schools = Array.isArray(payload?.schools) ? payload.schools : [];
  const accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
  const repasses = Array.isArray(payload?.repasses) ? payload.repasses : [];
  const knownIneps = new Set(schools.map((school) => school.inep).filter(Boolean));
  const duplicatedSchool = knownIneps.size !== schools.length;
  const foreignRow = [...accounts, ...repasses].some((row) => !knownIneps.has(row.inep));
  const globalRejected = duplicatedSchool || foreignRow || knownIneps.size > EXPECTED_SCHOOLS;

  const invalidAccountRows = accounts.some((row) => !hasCompleteAccountIdentity(row));
  const invalidExplicitAccountRows = repasses.some(
    (row) => row.account !== null && row.account !== undefined && !hasCompleteAccountIdentity(row.account),
  );
  const accountCoverage = uniqueCoverage(accounts, hasCompleteAccountIdentity);
  const scheduledCoverage = uniqueCoverage(repasses, (row) =>
    typeof row.programmed === "number" && Number.isFinite(row.programmed) && row.programmed >= 0,
  );

  const firstRows = repasses.filter(isBasicFirstInstallment);
  const validFirstRows = firstRows.filter((row) =>
    typeof row.paid === "number" &&
    Number.isFinite(row.paid) &&
    row.paid >= 0 &&
    typeof row.paymentDate === "string" &&
    row.paymentDate.length > 0,
  );
  const firstCoverage = uniqueCoverage(validFirstRows);

  let breakdownRejected = false;
  const validBreakdownRows = validFirstRows.filter((row) => {
    if (row.paidCusteio === null || row.paidCusteio === undefined || row.paidCapital === null || row.paidCapital === undefined) {
      return false;
    }
    if (
      typeof row.paidCusteio !== "number" ||
      typeof row.paidCapital !== "number" ||
      !Number.isFinite(row.paidCusteio) ||
      !Number.isFinite(row.paidCapital) ||
      row.paidCusteio < 0 ||
      row.paidCapital < 0
    ) {
      breakdownRejected = true;
      return false;
    }
    if (Math.abs(row.paidCusteio + row.paidCapital - row.paid) >= 0.005) {
      breakdownRejected = true;
      return false;
    }
    return true;
  });
  const breakdownCoverage = uniqueCoverage(validBreakdownRows);

  const secondRows = repasses.filter(isBasicSecondInstallment);
  const secondCoverage = uniqueCoverage(secondRows, (row) =>
    typeof row.programmed === "number" && Number.isFinite(row.programmed) && row.programmed >= 0,
  );

  const invalidMoney = repasses.some((row) =>
    (row.programmed !== null && row.programmed !== undefined && (!Number.isFinite(row.programmed) || row.programmed < 0)) ||
    (row.paid !== null && row.paid !== undefined && (!Number.isFinite(row.paid) || row.paid < 0)),
  );
  const invalidFinancialRows = invalidMoney || invalidExplicitAccountRows;

  const observations = new Map([
    [
      "bank_accounts",
      { coverageObserved: accountCoverage, rejected: globalRejected || invalidAccountRows, dates: [] },
    ],
    [
      "scheduled_repasses",
      { coverageObserved: scheduledCoverage, rejected: globalRejected || invalidFinancialRows, dates: [] },
    ],
    [
      "pdde_basic_first_installment",
      { coverageObserved: firstCoverage, rejected: globalRejected || invalidFinancialRows, dates: validFirstRows },
    ],
    [
      "pdde_basic_first_installment_breakdown",
      {
        coverageObserved: breakdownCoverage,
        rejected: globalRejected || invalidFinancialRows || breakdownRejected,
        dates: validBreakdownRows,
      },
    ],
    [
      "pdde_basic_second_installment_programmed",
      { coverageObserved: secondCoverage, rejected: globalRejected || invalidFinancialRows, dates: [] },
    ],
  ]);

  return [...CORE_DIMENSION_VALIDATORS.keys()].map((dimensionKey) => {
    const contract = requiredContracts.get(dimensionKey);
    const observation = observations.get(dimensionKey);
    if (!contract || !observation) {
      throw new Error(`Contrato ou observação financeira ausente: ${dimensionKey}.`);
    }
    return dimensionStatus(contract, observation.coverageObserved, observation);
  });
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
