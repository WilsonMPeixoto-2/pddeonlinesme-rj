import { afterEach, describe, expect, it, vi } from "vitest";

import { publishFinancialPayload } from "../../scripts/sync-financial-snapshot.mjs";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("publicação financeira via GitHub OIDC", () => {
  it("usa a Edge Function sem exigir service-role no GitHub", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        transport: "github-oidc",
        result: { ok: true },
        readAfterWrite: {
          workflowRunId: 123,
          artifactId: 456,
          secondInstallmentSchools: 163,
          secondInstallmentTotal: 765215,
          semanticRowsVerified: 537,
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = {
      exercise: 2026,
      source: {
        origin: "pdde-repasse-conciliador",
        workflowRunId: 123,
        artifactId: 456,
      },
      repasses: [],
    };

    const result = await publishFinancialPayload(payload, {
      SUPABASE_URL: "https://raluxyojqosfzrfozmpz.supabase.co",
      GITHUB_OIDC_TOKEN: "oidc-token-efemero",
    });

    expect(result).toMatchObject({
      transport: "github-oidc",
      result: { ok: true },
      readAfterWrite: { secondInstallmentSchools: 163 },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://raluxyojqosfzrfozmpz.supabase.co/functions/v1/publish-financial-snapshot",
    );
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer oidc-token-efemero",
      "Content-Type": "application/json",
    });
  });

  it("falha sem OIDC e sem credencial administrativa de fallback", async () => {
    await expect(publishFinancialPayload({
      exercise: 2026,
      source: {
        origin: "pdde-repasse-conciliador",
        workflowRunId: 123,
        artifactId: 456,
      },
      repasses: [],
    }, {
      SUPABASE_URL: "https://raluxyojqosfzrfozmpz.supabase.co",
    })).rejects.toThrow(/Nenhuma credencial de publicação disponível/);
  });
});
