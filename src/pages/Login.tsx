import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

const signUpSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido").endsWith("@sme.rio", { message: "Apenas e-mails institucionais @sme.rio são permitidos" }),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });
  }, [navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSignIn = async (values: LoginFormValues) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.senha });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo(a)!");
    navigate("/dashboard");
  };

  const onSignUp = async (values: SignUpFormValues) => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.senha,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Você já pode entrar.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.18),_transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_100%,_hsl(var(--primary)/0.06),_transparent_60%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={56} glow className="ring-2" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            SME-RJ · 4ª CRE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            PDDE Online
          </h1>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-md">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">Acesso ao sistema</CardTitle>
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
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-4" noValidate>
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail institucional</FormLabel>
                          <FormControl>
                            <Input placeholder="seu.nome@sme.rio" type="email" autoComplete="email" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" autoComplete="current-password" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                        onClick={() => toast.info("Em breve: recuperação de senha")}
                      >
                        Esqueci minha senha
                      </button>
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
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4" noValidate>
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail institucional</FormLabel>
                          <FormControl>
                            <Input placeholder="seu.nome@sme.rio" type="email" autoComplete="email" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input placeholder="Mínimo de 6 caracteres" type="password" autoComplete="new-password" className="h-10" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Use pelo menos 6 caracteres. Recomenda-se combinar letras e números.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                </Form>
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
