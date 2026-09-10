import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(process.cwd(), ".github/workflows/sync-financial-snapshot.yml");

describe("workflow de sincronização financeira", () => {
  it("usa somente o PDDE Online e credenciais service-role dedicadas", async () => {
    const workflow = await readFile(workflowPath, "utf8");

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
