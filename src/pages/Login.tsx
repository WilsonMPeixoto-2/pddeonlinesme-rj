import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo(a)!");
    navigate("/dashboard");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Você já pode entrar.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/30 p-4">
      {/* Subtle institutional backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_55%)]"
      />

      <div className="relative w-full max-w-md">
        {/* Institutional header above the card */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            SME-RJ · 4ª CRE
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            PDDE Online
          </h1>
        </div>

        <Card className="border-border/70 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle className="text-lg font-semibold">Acesso ao sistema</CardTitle>
            <CardDescription className="text-sm">
              Ambiente restrito à equipe da 4ª Coordenadoria Regional de Educação.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg bg-muted/70 p-1">
                <TabsTrigger value="signin" className="rounded-md text-sm">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md text-sm">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={signIn} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">
                      E-mail institucional
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu.nome@sme.rio"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senha" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="senha"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <Button type="submit" className="h-10 w-full font-medium" disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={signUp} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="email2" className="text-sm font-medium">
                      E-mail institucional
                    </Label>
                    <Input
                      id="email2"
                      type="email"
                      autoComplete="email"
                      placeholder="seu.nome@sme.rio"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senha2" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="senha2"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo de 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      minLength={6}
                      required
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use pelo menos 6 caracteres. Recomenda-se combinar letras e números.
                    </p>
                  </div>
                  <Button type="submit" className="h-10 w-full font-medium" disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta…
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Após o cadastro, um administrador atribuirá seu papel de operador.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Secretaria Municipal de Educação do Rio de Janeiro · Uso interno
        </p>
      </div>
    </div>
  );
};

export default Login;
