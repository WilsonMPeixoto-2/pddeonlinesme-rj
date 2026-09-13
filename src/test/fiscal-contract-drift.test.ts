import { describe, expect, it } from "vitest";

import {
  evaluateFiscalContract,
  extractMigrationVersions,
} from "../../scripts/lib/fiscal-contract.mjs";

const manifest = {
  operationalState: "blocked",
  requiredRepositoryMigrations: ["20260527000200", "20260527000300"],
  criticalObjects: {
    tablePaths: ["/despesas_fiscais"],
    rpcPaths: ["/rpc/homologar_despesa_fiscal", "/rpc/estornar_despesa_fiscal"],
  },
};

describe("fiscal contract drift", () => {
  it("extrai somente versoes validas de arquivos de migration", () => {
    expect(
      extractMigrationVersions([
        "20260527000200_despesas_fiscais.sql",
        "README.md",
        "20260527000300_estorno_despesas.sql",
        "migration_sem_timestamp.sql",
        "20260913033820_financial_publication_delta_v2.sql",
      ]),
    ).toEqual(["20260527000200", "20260527000300", "20260913033820"]);
  });

  it("aceita estado bloqueado quando migrations existem apenas no repositorio e objetos remotos continuam ausentes", () => {
    const report = evaluateFiscalContract({
      manifest,
      localMigrationVersions: ["20260527000100", "20260527000200", "20260527000300"],
      remoteMigrationVersions: ["20260527000100", "20260909002935"],
      remoteOpenApiPaths: ["/unidades_escolares", "/rpc/update_unidade_cadastro_minima"],
    });

    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.state).toBe("blocked");
  });

  it("falha se uma migration fiscal sumir do repositorio", () => {
    const report = evaluateFiscalContract({
      manifest,
      localMigrationVersions: ["20260527000100", "20260527000200"],
      remoteMigrationVersions: ["20260527000100", "20260909002935"],
      remoteOpenApiPaths: [],
    });

    expect(report.ok).toBe(false);
    expect(report.issues).toContainEqual({
      code: "MISSING_REPOSITORY_MIGRATION",
      subject: "20260527000300",
    });
  });

  it("falha se Production começar a expor parcialmente o domínio fiscal enquanto o estado declarado continua bloqueado", () => {
    const report = evaluateFiscalContract({
      manifest,
      localMigrationVersions: ["20260527000200", "20260527000300"],
      remoteMigrationVersions: ["20260527000100", "20260527000200", "20260909002935"],
      remoteOpenApiPaths: ["/despesas_fiscais"],
    });

    expect(report.ok).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        { code: "UNEXPECTED_REMOTE_MIGRATION", subject: "20260527000200" },
        { code: "UNEXPECTED_REMOTE_OBJECT", subject: "/despesas_fiscais" },
      ]),
    );
  });

  it("exige migrations e objetos remotos quando o domínio for explicitamente ativado", () => {
    const enabledManifest = { ...manifest, operationalState: "enabled" };
    const report = evaluateFiscalContract({
      manifest: enabledManifest,
      localMigrationVersions: ["20260527000200", "20260527000300"],
      remoteMigrationVersions: ["20260527000200"],
      remoteOpenApiPaths: ["/despesas_fiscais", "/rpc/homologar_despesa_fiscal"],
    });

    expect(report.ok).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        { code: "MISSING_REMOTE_MIGRATION", subject: "20260527000300" },
        { code: "MISSING_REMOTE_OBJECT", subject: "/rpc/estornar_despesa_fiscal" },
      ]),
    );
  });
});