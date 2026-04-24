import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, ArrowLeft } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.10),_transparent_60%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={48} glow className="ring-2" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">SME-RJ · 4ª CRE</p>
        </div>
        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 border border-border/40">
              <FileQuestion className="h-7 w-7 text-muted-foreground/70" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O endereço <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">{location.pathname}</code> não existe no sistema PDDE Online.
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="mt-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Secretaria Municipal de Educação do Rio de Janeiro · Uso interno</p>
      </div>
    </div>
  );
};

export default NotFound;
