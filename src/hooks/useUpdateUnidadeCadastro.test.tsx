import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { useUpdateUnidadeCadastro } from "./useUpdateUnidadeCadastro";
import type { UnidadeCadastroFormValues } from "@/lib/unidadeCadastro";

const validValues: UnidadeCadastroFormValues = {
  nome: "Escola Municipal Teste",
  diretor: "Maria Teste",
  endereco: "Rua Alfa, 123",
  email: "escola@sme.rio",
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

const mockedRpc = vi.mocked(supabase.rpc);

describe("useUpdateUnidadeCadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama a RPC cadastral sem alterar identidade bancaria", async () => {
    mockedRpc.mockResolvedValueOnce({ data: "uid-1", error: null } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    const returned = await result.current.mutateAsync({ unidadeId: "uid-1", values: validValues });

    expect(returned).toBe("uid-1");
    expect(mockedRpc).toHaveBeenCalledWith("update_unidade_cadastro_minima", {
      p_unidade_id: "uid-1",
      p_nome: "Escola Municipal Teste",
      p_diretor: "Maria Teste",
      p_endereco: "Rua Alfa, 123",
    });
  });

  it("ignora propriedades bancarias extras de um chamador legado", async () => {
    mockedRpc.mockResolvedValueOnce({ data: "uid-1", error: null } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );
    const legacyValues = {
      ...validValues,
      banco: "Banco que nao deve ser gravado",
      agencia: "9999-X",
      conta_corrente: "99999-9",
    };

    await result.current.mutateAsync({ unidadeId: "uid-1", values: legacyValues });

    const [, payload] = mockedRpc.mock.calls[0];
    expect(payload).not.toHaveProperty("p_banco");
    expect(payload).not.toHaveProperty("p_agencia");
    expect(payload).not.toHaveProperty("p_conta_corrente");
  });

  it("envia null somente nos campos cadastrais opcionais vazios", async () => {
    mockedRpc.mockResolvedValueOnce({ data: "uid-1", error: null } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await result.current.mutateAsync({
      unidadeId: "uid-1",
      values: { ...validValues, diretor: "  ", endereco: "" },
    });

    expect(mockedRpc).toHaveBeenCalledWith("update_unidade_cadastro_minima", {
      p_unidade_id: "uid-1",
      p_nome: "Escola Municipal Teste",
      p_diretor: null,
      p_endereco: null,
    });
  });

  it("rejeita com mensagem clara quando RPC retorna erro", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "permissao negada: requer role admin ou operador" },
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await expect(result.current.mutateAsync({ unidadeId: "uid-1", values: validValues })).rejects.toThrow(/permissao negada/);
  });

  it("rejeita defensivamente quando RPC retorna null sem erro", async () => {
    mockedRpc.mockResolvedValueOnce({ data: null, error: null } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await expect(result.current.mutateAsync({ unidadeId: "uid-1", values: validValues })).rejects.toThrow(/Salvamento nao confirmado/);
  });

  it("faz rollback cadastral sem tocar nos dados bancarios do cache", async () => {
    mockedRpc.mockResolvedValueOnce({ data: null, error: { message: "falha de rede" } } as unknown as ReturnType<typeof supabase.rpc>);
    const { qc, wrapper } = makeWrapper();
    const detalheKey = ["unidade-detalhe", "uid-1", 2026, "basico"] as const;
    const detalheBefore = {
      unidade_id: "uid-1", designacao: "04.10.001 - EM Antigo", nome: "ESCOLA OLD",
      diretor: "DIRETOR OLD", endereco: "Rua Velha, 1", banco: "Banco X", agencia: "0001",
      conta_corrente: "123-4", inep: "33000000", cnpj: "11222333000181", exercicio: 2026,
      programa: "basico", reprogramado_custeio: 0, reprogramado_capital: 0, parcela_1_custeio: 0,
      parcela_1_capital: 0, parcela_2_custeio: 0, parcela_2_capital: 0, total_reprogramado: 0,
      total_parcelas: 0, total_disponivel_inicial: 0, updated_at: "2026-05-15T00:00:00Z",
    };
    qc.setQueryData([...detalheKey], detalheBefore);
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await expect(result.current.mutateAsync({
      unidadeId: "uid-1",
      values: { ...validValues, diretor: "DIRETOR NEW", nome: "ESCOLA NEW" },
    })).rejects.toThrow(/falha de rede/);

    const after = qc.getQueryData([...detalheKey]) as typeof detalheBefore;
    expect(after.diretor).toBe("DIRETOR OLD");
    expect(after.nome).toBe("ESCOLA OLD");
    expect(after.banco).toBe("Banco X");
    expect(after.agencia).toBe("0001");
    expect(after.conta_corrente).toBe("123-4");
  });
});
