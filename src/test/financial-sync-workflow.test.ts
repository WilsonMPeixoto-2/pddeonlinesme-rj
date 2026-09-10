import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const workflowUrl = new URL("../../.github/workflows/sync-financial-snapshot.yml", import.meta.url);

describe("workflow de sincronização financeira", () => {
  it("usa somente o PDDE Online e credenciais service-role dedicadas", async () => {
    const workflow = await readFile(workflowUrl, "utf8");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("sync-financial-snapshot-production");
    expect(workflow).toContain("PDDE_SUPABASE_URL");
    expect(workflow).toContain("PDDE_SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).toContain("npm run sync:financial:snapshot");
    expect(workflow).not.toContain("scnryinorqeucbfkioxo");
    expect(workflow).not.toContain("SUPABASE_ANON_KEY");
    expect(workflow).not.toContain("pdde-repasse-conciliador.git");
  });
});
