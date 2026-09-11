import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(process.cwd(), ".github/workflows/sync-financial-snapshot.yml");

describe("workflow de sincronização financeira", () => {
  it("usa somente o PDDE Online e credenciais service-role dedicadas", async () => {
    const workflow = await readFile(workflowPath, "utf8");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("repository_dispatch:");
    expect(workflow).toContain("financial-snapshot-published-v1");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("sync-financial-snapshot-production");
    expect(workflow).toContain("PDDE_SUPABASE_URL");
    expect(workflow).toContain("PDDE_SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).toContain("npm run sync:financial:snapshot");
    expect(workflow).not.toContain("scnryinorqeucbfkioxo");
    expect(workflow).not.toContain("SUPABASE_ANON_KEY");
    expect(workflow).not.toContain("pdde-repasse-conciliador.git");
  });

  it("mantém toda ingestão automática inerte até habilitação operacional explícita", async () => {
    const workflow = await readFile(workflowPath, "utf8");

    expect(workflow).toContain("PDDE_FINANCIAL_SYNC_ENABLED");
    expect(workflow).toContain("github.event_name == 'workflow_dispatch'");
    expect(workflow).toContain("github.event_name == 'repository_dispatch'");
    expect(workflow).toContain("github.event_name == 'schedule'");
    expect(workflow).toContain("vars.PDDE_FINANCIAL_SYNC_ENABLED == 'true'");
  });

  it("transporta a proveniência do repository_dispatch para validação do manifesto", async () => {
    const workflow = await readFile(workflowPath, "utf8");

    expect(workflow).toContain("EXPECTED_SOURCE_REPOSITORY");
    expect(workflow).toContain("EXPECTED_WORKFLOW_RUN_ID");
    expect(workflow).toContain("EXPECTED_ARTIFACT_ID");
    expect(workflow).toContain("EXPECTED_ARTIFACT_NAME");
    expect(workflow).toContain("EXPECTED_PUBLISHED_AT");
    expect(workflow).toContain("github.event.client_payload.sourceRepository");
    expect(workflow).toContain("github.event.client_payload.workflowRunId");
    expect(workflow).toContain("github.event.client_payload.artifactId");
    expect(workflow).toContain("github.event.client_payload.artifactName");
    expect(workflow).toContain("github.event.client_payload.publishedAt");
  });

  it("mantém o cron como fallback posterior à coleta do motor", async () => {
    const workflow = await readFile(workflowPath, "utf8");

    expect(workflow).toContain('cron: "30 13 * * *"');
  });
});
