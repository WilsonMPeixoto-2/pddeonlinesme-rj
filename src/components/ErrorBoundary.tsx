import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aqui no futuro podemos enviar para um Sentry, Datadog, etc.
    console.error("Uncaught error capturado pelo ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
          {/* Efeito luminoso de fundo sutil para manter o Premium Aesthetic */}
          <div className="pointer-events-none absolute h-[40vh] w-[40vw] rounded-full bg-destructive/5 blur-[100px]" />
          
          <div className="relative z-10 mx-auto flex max-w-md flex-col items-center space-y-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20 shadow-[0_0_24px_hsl(var(--destructive)/0.15)]">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Ops, algo deu errado
              </h1>
              <p className="text-sm font-light text-muted-foreground">
                Um erro inesperado ocorreu ao carregar este módulo ou exibir estes dados. A interface foi protegida para que o sistema não trave por completo.
              </p>
            </div>
            
            <div className="w-full rounded-xl bg-muted/30 p-4 text-left border border-border/60 overflow-hidden backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Detalhe técnico
              </p>
              <p className="font-mono text-xs text-muted-foreground break-all max-h-24 overflow-y-auto">
                {this.state.error?.message || "Erro de renderização desconhecido"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Button onClick={this.handleReset} className="w-full sm:w-auto h-11">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recarregar página
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="w-full sm:w-auto h-11 border-border/60">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
