import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(process.cwd(), ".github/workflows/sync-financial-snapshot.yml");
const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260924153527_financial_sync_native_v6.sql",
);
const cronMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260925140500_financial_sync_cron_private_token_v7.sql",
);
const edgeFunctionPath = resolve(
  process.cwd(),
  "supabase/functions/sync_pdde_financial_snapshot/index.ts",
);
const configPath = resolve(process.cwd(), "supabase/config.toml");

describe("arquitetura de sincronização financeira", () => {
  it("mantém o GitHub como validador sem credencial privilegiada ou cron de produção", async () => {
    const workflow = await readFile(workflowPath, "utf8");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("repository_dispatch:");
    expect(workflow).toContain("financial-snapshot-published-v1");
    expect(workflow).toContain("npm run sync:financial:snapshot -- --dry-run");
    expect(workflow).not.toContain("schedule:");
    expect(workflow).not.toContain("PDDE_SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).not.toContain("Publish mature dimensions");
    expect(workflow).not.toContain("scnryinorqeucbfkioxo");
  });

  it("move a automação recorrente para Supabase Cron sem depender de segredo no GitHub ou Vault", async () => {
    const [migration, cronMigration] = await Promise.all([
      readFile(migrationPath, "utf8"),
      readFile(cronMigrationPath, "utf8"),
    ]);

    expect(migration).toContain("create extension if not exists pg_cron");
    expect(migration).toContain("create extension if not exists pg_net");
    expect(cronMigration).toContain("private.financial_sync_credentials");
    expect(cronMigration).toContain("extensions.gen_random_bytes");
    expect(cronMigration).toContain("extensions.digest");
    expect(cronMigration).toContain("'pdde-financial-sync-v1'");
    expect(cronMigration).toContain("'*/5 * * * *'");
    expect(cronMigration).toContain("/functions/v1/sync_pdde_financial_snapshot");
    expect(cronMigration).not.toContain("vault.decrypted_secrets");
  });

  it("protege a Edge Function com JWT e token interno antes da escrita privilegiada", async () => {
    const [edgeFunction, config] = await Promise.all([
      readFile(edgeFunctionPath, "utf8"),
      readFile(configPath, "utf8"),
    ]);

    expect(config).toContain("[functions.sync_pdde_financial_snapshot]");
    expect(config).toContain("verify_jwt = true");
    expect(edgeFunction).toContain('X-PDDE-Financial-Sync-Token');
    expect(edgeFunction).toContain("verify_pdde_financial_sync_token_v1");
    expect(edgeFunction).toContain('return json({ error: "FORBIDDEN" }, 403)');
    expect(edgeFunction).toContain("SUPABASE_SECRET_KEYS");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
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
});
