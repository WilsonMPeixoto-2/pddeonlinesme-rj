import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WalletCards } from "lucide-react";

import { ExecutiveKpi } from "@/components/dashboard/ExecutiveKpi";

describe("ExecutiveKpi", () => {
  it("expõe indicador, contexto, progresso e ação sem depender apenas de cor", () => {
    const onClick = vi.fn();

    render(
      <ExecutiveKpi
        label="Cobertura · 2º ciclo"
        value="163/163"
        detail="Carteira integralmente identificada"
        icon={WalletCards}
        tone="success"
        progress={100}
        onClick={onClick}
      />,
    );

    expect(screen.getByText("Cobertura · 2º ciclo")).toBeInTheDocument();
    expect(screen.getByText("163/163")).toBeInTheDocument();
    expect(screen.getByText("Carteira integralmente identificada")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("preserva ausência de dado visualmente sem inventar zero", () => {
    render(
      <ExecutiveKpi
        label="Total programado"
        value="—"
        detail="Programação conhecida no exercício"
        icon={WalletCards}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("R$ 0")).not.toBeInTheDocument();
  });
});
