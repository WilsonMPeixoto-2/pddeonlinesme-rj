import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Repasses com TanStack Table v9", () => {
  it("usa as APIs v9 para FlexRender, cells e sorting", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/Repasses.tsx"), "utf8");

    expect(source).toContain('<table.FlexRender header={header} />');
    expect(source).toContain('<table.FlexRender cell={cell} />');
    expect(source).toContain("row.getAllCells().map((cell) => (");
    expect(source).toContain("rowSortingFeature,");
    expect(source).toContain("sortedRowModel: createSortedRowModel(),");
    expect(source).toContain('sorting: [{ id: "valorPago", desc: true }]');

    expect(source).not.toContain("table.FlexRender(header.column.columnDef.header");
    expect(source).not.toContain("table.FlexRender(cell.column.columnDef.cell");
    expect(source).not.toContain("row.getVisibleCells()");
    expect(source).not.toContain("sortBy:");
  });

  it("preserva filtros de repasses na URL com os mesmos IDs do domínio", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/Repasses.tsx"), "utf8");

    expect(source).toContain("useSearchParams");
    expect(source).toContain('searchParams.get("q")');
    expect(source).toContain('searchParams.get("acao")');
    expect(source).toContain('searchParams.get("faixa")');
    expect(source).toContain('searchParams.get("data")');
    expect(source).toContain('value === "ate-3"');
    expect(source).toContain('value === "3-5"');
    expect(source).toContain('value === "5-8"');
    expect(source).toContain('value === "acima-8"');
    expect(source).toContain("return=${encodeURIComponent(`/repasses");

    expect(source).not.toContain('value === "ate-3000"');
    expect(source).not.toContain('value === "3000-5000"');
    expect(source).not.toContain('value === "5000-8000"');
    expect(source).not.toContain('value === "acima-8000"');
  });
});
