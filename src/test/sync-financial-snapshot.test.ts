import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import {
  assertExpectedManifestProvenance,
  hydratePublishedSnapshot,
  validatePublishedManifest,
} from "../../scripts/sync-financial-snapshot.mjs";

const source = {
  workflowRunId: 34355577593,
  artifactId: 10107480089,
  artifactName: "sigef-full-163-2026",
};

function fixture() {
  const snapshot = {
    publishedAt: "2026-09-09T13:50:50.872Z",
    source,
    portfolio: { fiscalYear: 2026, schoolCount: 163 },
    schools: {},
  };
  const raw = Buffer.from(JSON.stringify(snapshot), "utf8");
  const encoded = gzipSync(raw, { level: 9 }).toString("base64");
  const midpoint = Math.ceil(encoded.length / 2);
  const parts = [encoded.slice(0, midpoint), encoded.slice(midpoint)];
  const manifest = {
    encoding: "gzip-base64-parts",
    parts: ["/data/pdde-2026-snapshot.part01.txt", "/data/pdde-2026-snapshot.part02.txt"],
    publishedAt: snapshot.publishedAt,
    source,
  };
  const values = new Map(manifest.parts.map((path, index) => [path, parts[index]]));
  return { snapshot, raw, manifest, values };
}

describe("snapshot financeiro publicado", () => {
  it("valida proveniência e restringe partes ao diretório público esperado", () => {
    const { manifest } = fixture();
    expect(validatePublishedManifest(manifest)).toEqual(manifest);

    expect(() => validatePublishedManifest({ ...manifest, parts: ["../secret"] })).toThrow(/parte.*inválida/i);
    expect(() => validatePublishedManifest({ ...manifest, source: { ...source, artifactId: undefined } })).toThrow(/proveniência/i);
  });

  it("confere a proveniência esperada de um disparo orientado a evento", () => {
    const { manifest } = fixture();

    expect(
      assertExpectedManifestProvenance(manifest, {
        sourceRepository: "WilsonMPeixoto-2/pdde-repasse-conciliador",
        workflowRunId: String(source.workflowRunId),
        artifactId: String(source.artifactId),
        artifactName: source.artifactName,
        publishedAt: manifest.publishedAt,
      }),
    ).toEqual(manifest);

    expect(() =>
      assertExpectedManifestProvenance(manifest, {
        sourceRepository: "outra-org/outro-repo",
        workflowRunId: String(source.workflowRunId),
      }),
    ).toThrow(/repositório.*origem/i);

    expect(() =>
      assertExpectedManifestProvenance(manifest, {
        sourceRepository: "WilsonMPeixoto-2/pdde-repasse-conciliador",
        workflowRunId: "999",
      }),
    ).toThrow(/workflowRunId/i);

    expect(() =>
      assertExpectedManifestProvenance(manifest, {
        sourceRepository: "WilsonMPeixoto-2/pdde-repasse-conciliador",
        artifactId: "999",
      }),
    ).toThrow(/artifactId/i);

    expect(() =>
      assertExpectedManifestProvenance(manifest, {
        sourceRepository: "WilsonMPeixoto-2/pdde-repasse-conciliador",
        publishedAt: "2026-09-10T00:00:00.000Z",
      }),
    ).toThrow(/publishedAt/i);
  });

  it("reidrata gzip-base64-parts e calcula digest SHA-256 do JSON publicado", async () => {
    const { snapshot, raw, manifest, values } = fixture();

    const hydrated = await hydratePublishedSnapshot(manifest, async (path: string) => {
      const value = values.get(path);
      if (!value) throw new Error(`parte ausente: ${path}`);
      return value;
    });

    expect(hydrated.snapshot).toEqual(snapshot);
    expect(hydrated.rawBytes).toBe(raw.length);
    expect(hydrated.snapshotDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(hydrated.snapshot.publishedAt).toBe(manifest.publishedAt);
    expect(hydrated.snapshot.source).toEqual(manifest.source);
  });

  it("bloqueia payload descomprimido acima do limite configurado", async () => {
    const { manifest, values } = fixture();

    await expect(
      hydratePublishedSnapshot(
        manifest,
        async (path: string) => values.get(path) ?? "",
        { maxRawBytes: 16 },
      ),
    ).rejects.toThrow(/limite/i);
  });
});
