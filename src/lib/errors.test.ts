import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  it("retorna a mensagem de uma instância de Error", () => {
    expect(getErrorMessage(new Error("Falha conhecida"), "Fallback")).toBe(
      "Falha conhecida",
    );
  });

  it("aceita erros representados por string", () => {
    expect(getErrorMessage("Falha textual", "Fallback")).toBe("Falha textual");
  });

  it("aceita objetos compatíveis com respostas de APIs", () => {
    expect(getErrorMessage({ message: "Falha da API" }, "Fallback")).toBe(
      "Falha da API",
    );
  });

  it("usa o fallback para valores sem mensagem válida", () => {
    expect(getErrorMessage({ message: 123 }, "Fallback")).toBe("Fallback");
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
