import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const redefinirSenhaSchema = z
  .object({
    senha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((values) => values.senha === values.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type RedefinirSenhaFormValues = z.infer<typeof redefinirSenhaSchema>;

const mensagemErroAuth = (message: string) =>
  /failed to fetch|network|fetch failed|load failed/i.test(message)
    ? "Serviço de autenticação temporariamente indisponível. Tente novamente em alguns minutos."
    : message;

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RedefinirSenhaFormValues>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { senha: "", confirmarSenha: "" },
  });

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessaoValida(true);
        setVerificandoSessao(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data.session) setSessaoValida(true);
      setVerificandoSessao(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = (values: RedefinirSenhaFormValues) => {
    if (!sessaoValida) return;

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: values.senha });
      if (error) {
        toast.error(mensagemErroAuth(error.message));
        return;
      }

      toast.success("Senha atualizada com sucesso.");
      navigate("/dashboard", { replace: true });
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.18),_transparent_60%)]"
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
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-sm">
              Use o link de recuperação recebido no seu e-mail institucional.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {verificandoSessao ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Validando link de recuperação…
              </div>
            ) : sessaoValida ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Mínimo de 6 caracteres"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nova senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repita a nova senha"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="h-10 w-full font-medium" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Atualizando…
                      </>
                    ) : (
                      "Salvar nova senha"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Este link de recuperação é inválido, expirou ou já foi utilizado. Solicite um novo link na tela de acesso.
                </p>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/", { replace: true })}>
                  Voltar para o acesso
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedefinirSenha;
