import { describe, expect, it, vi, beforeEach } from "vitest";
import JSZip from "jszip";

import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import {
  generateDemonstrativosLote,
  __internals,
} from "./generateDemonstrativosLote";

vi.mock("./generateDemonstrativoBasico", () => ({
  generateDemonstrativoBasico: vi.fn(async (unidade: UnidadeDetalhe) => ({
    blob: new Blob([`fake-xlsx-${unidade.unidade_id}`], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName: `Demo_${unidade.designacao}.xlsx`,
    memoria: {} as never,
  })),
}));

import { generateDemonstrativoBasico } from "./generateDemonstrativoBasico";

const fakeUnidade = (id: string, designacao: string): UnidadeDetalhe =>
  ({
    unidade_id: id,
    designacao,
    nome: designacao,
    inep: null,
    cnpj: null,
    diretor: null,
    endereco: null,
    banco: null,
    agencia: null,
    conta_corrente: null,
    exercicio: 2026,
    programa: "basico",
    reprogramado_custeio: 100,
    reprogramado_capital: 0,
    parcela_1_custeio: 50,
    parcela_1_capital: 0,
    parcela_2_custeio: 0,
    parcela_2_capital: 0,
    total_reprogramado: 100,
    total_parcelas: 50,
    total_disponivel_inicial: 150,
    updated_at: new Date().toISOString(),
  }) as unknown as UnidadeDetalhe;

describe("generateDemonstrativosLote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita lista vazia", async () => {
    await expect(
      generateDemonstrativosLote({ unidades: [], exercicio: "2026" }),
    ).rejects.toThrow(/Nenhuma unidade/i);
  });

  it("gera um demonstrativo para cada unidade e empacota num zip", async () => {
    const unidades = [fakeUnidade("u1", "EM A"), fakeUnidade("u2", "EM B")];
    const result = await generateDemonstrativosLote({
      unidades,
      exercicio: "2026",
    });

    expect(result.totalAlvo).toBe(2);
    expect(result.totalSucesso).toBe(2);
    expect(result.totalFalha).toBe(0);
    expect(result.failures).toEqual([]);
    expect(generateDemonstrativoBasico).toHaveBeenCalledTimes(2);

    const zip = await JSZip.loadAsync(result.zipBlob);
    const files = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.startsWith("Demonstrativos_Basicos_2026/"))).toBe(true);
  });

  it("captura falhas individuais sem abortar a corrida e grava relatorio", async () => {
    vi.mocked(generateDemonstrativoBasico).mockImplementationOnce(async () => {
      throw new Error("Template ausente");
    });

    const unidades = [
      fakeUnidade("u1", "EM com falha"),
      fakeUnidade("u2", "EM ok"),
    ];
    const result = await generateDemonstrativosLote({
      unidades,
      exercicio: "2026",
    });

    expect(result.totalAlvo).toBe(2);
    expect(result.totalSucesso).toBe(1);
    expect(result.totalFalha).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].message).toMatch(/Template ausente/);

    const zip = await JSZip.loadAsync(result.zipBlob);
    const relatorio = zip.file("Demonstrativos_Basicos_2026/_relatorio_falhas.txt");
    expect(relatorio).not.toBeNull();
    const content = await relatorio!.async("text");
    expect(content).toMatch(/Falhas: 1/);
    expect(content).toMatch(/EM com falha/);
  });

  it("invoca onProgress em cada unidade processada", async () => {
    const unidades = [
      fakeUnidade("u1", "EM A"),
      fakeUnidade("u2", "EM B"),
      fakeUnidade("u3", "EM C"),
    ];
    const onProgress = vi.fn();

    await generateDemonstrativosLote({
      unidades,
      exercicio: "2026",
      onProgress,
      batchSize: 2,
    });

    expect(onProgress).toHaveBeenCalled();
    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last).toBeDefined();
    expect(last.done).toBe(3);
    expect(last.total).toBe(3);
  });

  it("respeita AbortSignal disparado antes do start", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      generateDemonstrativosLote({
        unidades: [fakeUnidade("u1", "EM A")],
        exercicio: "2026",
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "LoteAbortError" });
  });

  it("respeita AbortSignal disparado entre batches", async () => {
    const controller = new AbortController();
    const unidades = [
      fakeUnidade("u1", "EM A"),
      fakeUnidade("u2", "EM B"),
      fakeUnidade("u3", "EM C"),
      fakeUnidade("u4", "EM D"),
    ];

    const onProgress = vi.fn(() => {
      controller.abort();
    });

    await expect(
      generateDemonstrativosLote({
        unidades,
        exercicio: "2026",
        signal: controller.signal,
        batchSize: 1,
        onProgress,
      }),
    ).rejects.toMatchObject({ name: "LoteAbortError" });
  });

  it("chunk helper divide em partes iguais", () => {
    expect(__internals.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(__internals.chunk([], 3)).toEqual([]);
    expect(__internals.chunk([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
  });

  it("zip file name segue padrao institucional com timestamp", () => {
    const name = __internals.buildZipFileName("2026");
    expect(name).toMatch(/^Demonstrativos_Basicos_4CRE_2026_.+\.zip$/);
  });
});
