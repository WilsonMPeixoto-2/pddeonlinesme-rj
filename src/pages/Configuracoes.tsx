import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const usuarios = [
  { email: "4cre@sme.rio", nome: "4ª CRE Coordenação", papel: "admin", ativo: true },
  { email: "ana.coord@sme.rio", nome: "Ana Coord", papel: "operador", ativo: true },
  { email: "bruno.tec@sme.rio", nome: "Bruno Técnico", papel: "operador", ativo: false },
];

export default function Configuracoes() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Equipe da 4ª CRE e parâmetros gerais do sistema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipe da 4ª CRE</CardTitle>
            <CardDescription>Quem tem acesso ao sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Protótipo: convite enviado");
              }}
            >
              <Input placeholder="Nome" />
              <Input placeholder="email@sme.rio" type="email" />
              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" /> Convidar
              </Button>
            </form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.papel === "admin" ? "default" : "secondary"}>
                          {u.papel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.ativo ? (
                          <Badge variant="outline" className="border-success/40 text-success">ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Protótipo: removeria o usuário")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros do sistema</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Senha de proteção das células amarelas</Label>
              <Input defaultValue="ANA" />
              <p className="text-xs text-muted-foreground">
                Aplicada nas planilhas geradas (Demonstrativo + Memória).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Exercício vigente</Label>
              <Input defaultValue="2025" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={() => toast.success("Protótipo: parâmetros salvos")}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
