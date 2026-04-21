import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockEscolas } from "@/lib/mockEscolas";
import { Download, FileSpreadsheet, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Escolas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const lista = useMemo(
    () =>
      mockEscolas.filter((e) =>
        e.designacao.toLowerCase().includes(q.toLowerCase()) ||
        e.inep.includes(q) ||
        e.diretor.toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unidades Escolares</h1>
          <p className="text-sm text-muted-foreground">
            163 unidades escolares · edite a BASE e gere demonstrativos individuais ou em lote.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, INEP ou diretor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Protótipo: exportaria a BASE em .xlsx")}>
              <Download className="mr-2 h-4 w-4" /> Exportar BASE
            </Button>
            <Button onClick={() => toast.success("Protótipo: geraria .zip com os 163 demonstrativos")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar lote (.zip)
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designação</TableHead>
                <TableHead>INEP</TableHead>
                <TableHead>Diretor(a)</TableHead>
                <TableHead className="text-right">Alunos</TableHead>
                <TableHead className="text-right">Saldo ant.</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.designacao}</TableCell>
                  <TableCell className="text-muted-foreground">{e.inep}</TableCell>
                  <TableCell>{e.diretor}</TableCell>
                  <TableCell className="text-right">{e.alunos}</TableCell>
                  <TableCell className="text-right">{fmt(e.saldoAnterior)}</TableCell>
                  <TableCell className="text-right">{fmt(e.recebido)}</TableCell>
                  <TableCell className="text-right">{fmt(e.gasto)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/escolas/${e.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Protótipo: geraria DEMONSTRATIVO BÁSICO - ${e.designacao}.xlsx`)}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma unidade escolar encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Exibindo {lista.length} de {mockEscolas.length} (mock)</span>
          <Badge variant="secondary">Protótipo · sem backend</Badge>
        </div>
      </div>
    </AppLayout>
  );
}
