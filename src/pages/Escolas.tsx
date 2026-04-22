import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download, FileSpreadsheet, Pencil, Search, SchoolIcon, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Unidade = {
  id: string;
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  alunos: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Escolas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .order("designacao");
      if (error) toast.error(error.message);
      else setUnidades((data ?? []) as Unidade[]);
      setLoading(false);
    })();
  }, []);

  const lista = useMemo(
    () =>
      unidades.filter((e) =>
        e.designacao.toLowerCase().includes(q.toLowerCase()) ||
        (e.inep ?? "").includes(q) ||
        (e.diretor ?? "").toLowerCase().includes(q.toLowerCase())
      ),
    [q, unidades]
  );

  const isSearching = q.trim().length > 0;

  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="space-y-5">
          {/* Page header */}
          <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Cadastro · 4ª CRE
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Unidades Escolares</h1>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Carregando cadastro…"
                  : `${unidades.length} unidades · edite a BASE e gere demonstrativos individuais ou em lote.`}
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, INEP ou diretor(a)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 pl-9 pr-9"
              />
              {isSearching && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => toast.info("Em breve: exportar BASE em .xlsx")}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar BASE
              </Button>
              <Button
                size="sm"
                className="h-10"
                onClick={() => toast.info("Em breve: gerar lote (.zip)")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar lote (.zip)
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Designação
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    INEP
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Alunos
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Saldo ant.
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recebido
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gasto
                  </TableHead>
                  <TableHead className="h-10 w-[110px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className={`h-4 ${j === 0 ? "w-3/4" : "w-16 ml-auto"}`} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : lista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <SchoolIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">
                          {isSearching
                            ? "Nenhum resultado para a busca"
                            : "Nenhuma unidade cadastrada ainda"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSearching
                            ? "Verifique o termo digitado ou limpe os filtros."
                            : "Importe a BASE ou cadastre uma unidade para começar."}
                        </p>
                        {isSearching && (
                          <Button variant="outline" size="sm" className="mt-1" onClick={() => setQ("")}>
                            Limpar busca
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  lista.map((e) => (
                    <TableRow key={e.id} className="group">
                      <TableCell className="font-medium">{e.designacao}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                        {e.inep ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{e.diretor ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.alunos}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(e.saldo_anterior))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(e.recebido))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(e.gasto))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/escolas/${e.id}`)}
                                aria-label="Editar unidade"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar cadastro</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  toast.info(
                                    `Em breve: gerar DEMONSTRATIVO BÁSICO - ${e.designacao}.xlsx`
                                  )
                                }
                                aria-label="Gerar demonstrativo"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gerar demonstrativo</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Exibindo <span className="font-medium text-foreground tabular-nums">{lista.length}</span>{" "}
              de <span className="font-medium text-foreground tabular-nums">{unidades.length}</span>
            </span>
            <Badge variant="outline" className="border-success/40 bg-success/5 text-success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Conectado · Lovable Cloud
            </Badge>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
