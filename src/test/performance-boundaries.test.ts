import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("fronteiras de performance do frontend", () => {
  test("rotas autenticadas são carregadas sob demanda", () => {
    const app = source("src/App.tsx");

    expect(app).toContain('import { lazy, Suspense } from "react"');
    expect(app).toMatch(/const Dashboard = lazy\(\(\) => import\("\.\/pages\/Dashboard\.tsx"\)\)/);
    expect(app).toMatch(/const Repasses = lazy\(\(\) => import\("\.\/pages\/Repasses\.tsx"\)\)/);
    expect(app).toMatch(/const EscolaRecursos = lazy\(\(\) => import\("\.\/pages\/EscolaRecursos\.tsx"\)\)/);
    expect(app).not.toMatch(/import Dashboard from "\.\/pages\/Dashboard\.tsx"/);
    expect(app).not.toMatch(/import Repasses from "\.\/pages\/Repasses\.tsx"/);
  });

  test("motor de demonstrativos não entra no bundle inicial", () => {
    const hook = source("src/hooks/useGerarDemonstrativosLote.ts");

    expect(hook).toContain('await import(\n          "@/lib/demonstrativo/generateDemonstrativosLote"\n        )');
    expect(hook).not.toMatch(/import \{[\s\S]*generateDemonstrativosLote[\s\S]*\} from "@\/lib\/demonstrativo\/generateDemonstrativosLote"/);
  });

  test("o projeto possui um gate explícito para o JavaScript inicial", () => {
    expect(existsSync(resolve("scripts/check-bundle-budget.mjs"))).toBe(true);
    expect(source("package.json")).toContain('"check:bundle": "node scripts/check-bundle-budget.mjs"');
    expect(source(".github/workflows/ci.yml")).toContain("Initial bundle budget");
  });
});
