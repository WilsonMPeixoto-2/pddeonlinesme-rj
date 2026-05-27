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
  banco: "Banco do Brasil",
  agencia: "0012-X",
  conta_corrente: "00045-6",
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

  it("chama a RPC atomica com payload normalizado", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: "uid-1",
      error: null,
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    const returned = await result.current.mutateAsync({
      unidadeId: "uid-1",
      values: validValues,
    });

    expect(returned).toBe("uid-1");
    expect(mockedRpc).toHaveBeenCalledTimes(1);
    expect(mockedRpc).toHaveBeenCalledWith(
      "update_unidade_cadastro_minima",
      expect.objectContaining({
        p_unidade_id: "uid-1",
        p_nome: "Escola Municipal Teste",
        p_diretor: "Maria Teste",
        p_endereco: "Rua Alfa, 123",
        p_banco: "Banco do Brasil",
        p_agencia: "0012-X",
        p_conta_corrente: "00045-6",
      }),
    );
  });

  it("preserva zeros a esquerda em agencia e conta", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: "uid-1",
      error: null,
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await result.current.mutateAsync({
      unidadeId: "uid-1",
      values: { ...validValues, agencia: "0001-X", conta_corrente: "00099-0" },
    });

    expect(mockedRpc).toHaveBeenCalledWith(
      "update_unidade_cadastro_minima",
      expect.objectContaining({
        p_agencia: "0001-X",
        p_conta_corrente: "00099-0",
      }),
    );
  });

  it("envia null em campos opcionais aparados que ficaram vazios", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: "uid-1",
      error: null,
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await result.current.mutateAsync({
      unidadeId: "uid-1",
      values: {
        ...validValues,
        diretor: "  ",
        endereco: "",
        banco: "",
        agencia: "",
        conta_corrente: "",
      },
    });

    expect(mockedRpc).toHaveBeenCalledWith(
      "update_unidade_cadastro_minima",
      expect.objectContaining({
        p_diretor: null,
        p_endereco: null,
        p_banco: null,
        p_agencia: null,
        p_conta_corrente: null,
      }),
    );
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

    await expect(
      result.current.mutateAsync({ unidadeId: "uid-1", values: validValues }),
    ).rejects.toThrow(/permissao negada/);
  });

  it("rejeita defensivamente quando RPC retorna null sem erro", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: null,
      error: null,
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await expect(
      result.current.mutateAsync({ unidadeId: "uid-1", values: validValues }),
    ).rejects.toThrow(/Salvamento nao confirmado/);
  });

  it("aplica optimistic update e faz rollback quando RPC falha", async () => {
    mockedRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "falha de rede" },
    } as unknown as ReturnType<typeof supabase.rpc>);
    const { qc, wrapper } = makeWrapper();

    const detalheKey = ["unidade-detalhe", "uid-1", 2026, "basico"] as const;
    const detalheBefore = {
      unidade_id: "uid-1",
      designacao: "04.10.001 - EM Antigo",
      nome: "ESCOLA OLD",
      diretor: "DIRETOR OLD",
      endereco: "Rua Velha, 1",
      banco: "Banco X",
      agencia: "0001",
      conta_corrente: "123-4",
      inep: "33000000",
      cnpj: "11222333000181",
      exercicio: 2026,
      programa: "basico",
      reprogramado_custeio: 0,
      reprogramado_capital: 0,
      parcela_1_custeio: 0,
      parcela_1_capital: 0,
      parcela_2_custeio: 0,
      parcela_2_capital: 0,
      total_reprogramado: 0,
      total_parcelas: 0,
      total_disponivel_inicial: 0,
      updated_at: "2026-05-15T00:00:00Z",
    };
    qc.setQueryData([...detalheKey], detalheBefore);

    const { result } = renderHook(
      () => useUpdateUnidadeCadastro({ exercicio: "2026", programa: "basico" }),
      { wrapper },
    );

    await expect(
      result.current.mutateAsync({
        unidadeId: "uid-1",
        values: { ...validValues, diretor: "DIRETOR NEW", nome: "ESCOLA NEW" },
      }),
    ).rejects.toThrow(/falha de rede/);

    // Apos rollback, o cache deve refletir os valores anteriores (nao os otimistas).
    const after = qc.getQueryData([...detalheKey]) as typeof detalheBefore;
    expect(after.diretor).toBe("DIRETOR OLD");
    expect(after.nome).toBe("ESCOLA OLD");
  });
});
