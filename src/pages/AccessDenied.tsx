import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Gradientes atmosféricos — mesma linguagem do Login */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--destructive)/0.10),_transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_100%,_hsl(var(--primary)/0.05),_transparent_60%)]"
      />

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={48} glow className="ring-2" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            SME-RJ · 4ª CRE
          </p>
        </div>

        {/* Card principal */}
        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-destructive/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center">
            {/* Ícone */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/8 border border-destructive/15">
              <ShieldAlert className="h-7 w-7 text-destructive/80" />
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Acesso restrito
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Você não possui permissão para acessar este recurso.
                Solicite acesso a um administrador da 4ª Coordenadoria
                Regional de Educação.
              </p>
            </div>

            {/* Ação */}
            <Button
              onClick={() => navigate("/dashboard")}
              className="mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Secretaria Municipal de Educação
          do Rio de Janeiro · Uso interno
        </p>
      </div>
    </div>
  );
}
