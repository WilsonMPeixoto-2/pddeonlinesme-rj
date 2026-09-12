import { describe, expect, it } from "vitest";

import { DASHBOARD_QUERY_POLICY } from "@/lib/queryPolicy";

const MIN_DASHBOARD_STALE_TIME = 10 * 60 * 1000;

describe("dashboard query policy", () => {
  it("não refaz indicadores estáticos em toda remontagem", () => {
    expect(DASHBOARD_QUERY_POLICY.staleTime).toBeGreaterThanOrEqual(MIN_DASHBOARD_STALE_TIME);
    expect(DASHBOARD_QUERY_POLICY.refetchOnMount).not.toBe("always");
  });
});
