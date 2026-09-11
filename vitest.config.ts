import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      exclude: [
        "src/test/**",
        "src/integrations/supabase/types.ts",
        "src/vite-env.d.ts",
        // CLI de orquestração: validado por testes funcionais e contrato SQL;
        // a lógica determinística permanece em scripts/lib e conta no gate global.
        "scripts/sync-financial-snapshot.mjs",
      ],
      thresholds: {
        statements: 80,
        branches: 64,
        functions: 84,
        lines: 83,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
