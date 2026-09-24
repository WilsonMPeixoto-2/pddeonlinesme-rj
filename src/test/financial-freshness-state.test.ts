import { describe, expect, it } from "vitest";

import { evaluateFinancialFreshness } from "@/lib/financialFreshness";

const NOW = Date.parse("2026-09-24T11:10:24.330Z");

describe("estado operacional de frescor financeiro", () => {
  it("só considera CURRENT quando run e artifact do storage coincidem com o motor", () => {
    expect(evaluateFinancialFreshness({
      enginePublishedAt: "2026-09-24T10:40:24.330Z",
      engineWorkflowRunId: 35986812892,
      engineArtifactId: 10803801064,
      storageWorkflowRunId: 35986812892,
      storageArtifactId: 10803801064,
      storageRecordedAt: "2026-09-24T10:45:00.000Z",
      now: NOW,
    })).toEqual({ status: "CURRENT", lagMinutes: 0 });
  });

  it("trata os primeiros 15 minutos como propagação, nunca como estado corrente", () => {
    const result = evaluateFinancialFreshness({
      enginePublishedAt: "2026-09-24T11:00:24.330Z",
      engineWorkflowRunId: 400,
      engineArtifactId: 900,
      storageWorkflowRunId: 399,
      storageArtifactId: 899,
      storageRecordedAt: "2026-09-24T10:58:00.000Z",
      now: NOW,
    });

    expect(result.status).toBe("PROPAGATING");
  });

  it("reproduz o incidente real: motor novo + Supabase antigo vira STORAGE_LAG crítico", () => {
    const result = evaluateFinancialFreshness({
      enginePublishedAt: "2026-09-24T10:40:24.330Z",
      engineWorkflowRunId: 35986812892,
      engineArtifactId: 10803801064,
      storageWorkflowRunId: 34355577593,
      storageArtifactId: 10107480089,
      storageRecordedAt: "2026-09-09T16:48:21.719Z",
      now: NOW,
    });

    expect(result.status).toBe("STORAGE_LAG");
    expect(result.lagMinutes).toBeGreaterThan(15);
  });

  it("não mascara fonte vencida como problema de storage", () => {
    const result = evaluateFinancialFreshness({
      enginePublishedAt: "2026-09-22T10:00:00.000Z",
      engineWorkflowRunId: 1,
      engineArtifactId: 1,
      storageWorkflowRunId: null,
      storageArtifactId: null,
      storageRecordedAt: null,
      now: NOW,
    });

    expect(result.status).toBe("SOURCE_STALE");
  });
});
