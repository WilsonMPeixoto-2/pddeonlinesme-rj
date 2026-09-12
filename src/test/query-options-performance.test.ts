import { describe, expect, it } from "vitest";

import {
  dashboardBasicoOptions,
  dashboardUnidadesResumoOptions,
} from "@/lib/queryKeys";

const MIN_DASHBOARD_STALE_TIME = 10 * 60 * 1000;

describe("dashboard query policy", () => {
  it("não refaz indicadores estáticos em toda remontagem", () => {
    const financeiro = dashboardBasicoOptions(2026, "PDDE BÁSICO");
    const unidades = dashboardUnidadesResumoOptions();

    expect(financeiro.staleTime).toBeGreaterThanOrEqual(MIN_DASHBOARD_STALE_TIME);
    expect(unidades.staleTime).toBeGreaterThanOrEqual(MIN_DASHBOARD_STALE_TIME);
    expect(financeiro.refetchOnMount).not.toBe("always");
    expect(unidades.refetchOnMount).not.toBe("always");
  });
});
