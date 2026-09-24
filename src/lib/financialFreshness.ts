export type FinancialFreshnessStatus =
  | "CURRENT"
  | "PROPAGATING"
  | "STORAGE_LAG"
  | "SOURCE_STALE";

export interface FinancialFreshnessInput {
  enginePublishedAt: string;
  engineWorkflowRunId: number;
  engineArtifactId: number;
  storageWorkflowRunId: number | null;
  storageArtifactId: number | null;
  storageRecordedAt: string | null;
  now?: number;
  propagationTargetMinutes?: number;
  sourceStaleMinutes?: number;
}

export interface EvaluatedFinancialFreshness {
  status: FinancialFreshnessStatus;
  lagMinutes: number;
}

function minutesBetween(laterMs: number, earlierIso: string | null): number | null {
  if (!earlierIso) return null;
  const earlierMs = Date.parse(earlierIso);
  if (!Number.isFinite(earlierMs)) return null;
  return Math.max(0, (laterMs - earlierMs) / 60_000);
}

export function evaluateFinancialFreshness(input: FinancialFreshnessInput): EvaluatedFinancialFreshness {
  const now = input.now ?? Date.now();
  const propagationTargetMinutes = input.propagationTargetMinutes ?? 15;
  const sourceStaleMinutes = input.sourceStaleMinutes ?? 36 * 60;
  const enginePublishedMs = Date.parse(input.enginePublishedAt);

  if (!Number.isFinite(enginePublishedMs)) {
    return { status: "SOURCE_STALE", lagMinutes: sourceStaleMinutes + 1 };
  }

  const sourceAgeMinutes = Math.max(0, (now - enginePublishedMs) / 60_000);
  if (sourceAgeMinutes > sourceStaleMinutes) {
    return { status: "SOURCE_STALE", lagMinutes: sourceAgeMinutes };
  }

  const storageCurrent =
    input.storageWorkflowRunId === input.engineWorkflowRunId
    && input.storageArtifactId === input.engineArtifactId;

  if (storageCurrent) return { status: "CURRENT", lagMinutes: 0 };

  const storageAge = minutesBetween(now, input.storageRecordedAt);
  const lagMinutes = storageAge === null
    ? sourceAgeMinutes
    : Math.max(sourceAgeMinutes, storageAge);

  if (sourceAgeMinutes <= propagationTargetMinutes) {
    return { status: "PROPAGATING", lagMinutes };
  }

  return { status: "STORAGE_LAG", lagMinutes };
}
