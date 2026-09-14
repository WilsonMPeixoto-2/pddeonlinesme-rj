import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import loginBackground from "@/assets/login-pdde-rio-4k.avif";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

const signUpSchema = z.object({
  email: z.string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .refine(
      (email) => email.endsWith("@sme.rio") || email.endsWith("@rioeduca.net"),
      { message: "Apenas e-mails institucionais @sme.rio ou @rioeduca.net são permitidos" }
    ),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type AuthMode = "signin" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);

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

  const onSignIn = (values: LoginFormValues) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.senha });
      if (error) return toast.error(mensagemErroAuth(error.message));
      toast.success("Bem-vindo(a)!");
      navigate("/dashboard");
    });
  };

  const onSignUp = (values: SignUpFormValues) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.senha,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) return toast.error(mensagemErroAuth(error.message));
      toast.success("Conta criada! Você já pode entrar.");
      setMode("signin");
      loginForm.setValue("email", values.email);
    });
  };

  const handleEsqueciSenha = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      loginForm.setError("email", { type: "manual", message: "Digite seu e-mail institucional primeiro" });
      return;
    }

    const emailValido = loginSchema.shape.email.safeParse(email);
    if (!emailValido.success) {
      loginForm.setError("email", { type: "manual", message: "E-mail inválido" });
      return;
    }

    const toastId = toast.loading("Enviando e-mail de recuperação...");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      toast.error(mensagemErroAuth(error.message), { id: toastId });
    } else {
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.", { id: toastId });
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0b5d92] bg-cover text-slate-950 lg:bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div aria-hidden className="absolute inset-0 bg-slate-950/10 lg:bg-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/20 lg:hidden" />

      <section className="sr-only" aria-label="Identidade institucional">
        <h1>PDDE Online</h1>
        <p>4ª CRE · SME-RJ</p>
        <p>Recursos que fortalecem a educação de uma cidade inteira.</p>
        <p>Dados, controle e transparência para as unidades escolares da 4ª CRE.</p>
      </section>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:justify-end lg:px-[6.5vw] lg:py-10">
        <section
          aria-labelledby="login-title"
          className="w-full max-w-[31rem] rounded-[1.35rem] border border-white/70 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-8 lg:min-h-[44rem] lg:p-10"
        >
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <BrandMark size={44} className="ring-1 ring-slate-200" />
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">PDDE Online</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">4ª CRE · SME-RJ</p>
            </div>
          </div>

          {mode === "signin" ? (
            <>
              <header className="mb-8">
                <h2 id="login-title" className="text-[2.05rem] font-semibold tracking-[-0.035em] text-[#0d215d] sm:text-[2.35rem]">
                  Bem-vindo
                </h2>
                <p className="mt-2 max-w-sm text-[0.98rem] leading-6 text-slate-600">
                  Acesse sua conta para continuar no PDDE Online.
                </p>
              </header>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-5" noValidate>
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.95rem] font-semibold text-slate-700">E-mail institucional</FormLabel>
                        <div className="relative">
                          <UserRound aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                          <FormControl>
                            <Input
                              placeholder="nome@sme.rio ou @rioeduca.net"
                              type="email"
                              autoComplete="email"
                              className="h-14 rounded-xl border-slate-200 bg-white pl-12 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:bg-white dark:text-slate-900"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.95rem] font-semibold text-slate-700">Senha</FormLabel>
                        <div className="relative">
                          <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                          <FormControl>
                            <Input
                              placeholder="Digite sua senha"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              className="h-14 rounded-xl border-slate-200 bg-white pl-12 pr-12 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:bg-white dark:text-slate-900"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-14 w-full rounded-xl bg-[#0865d8] text-base font-semibold text-white shadow-[0_10px_24px_rgba(8,101,216,0.22)] hover:bg-[#075cc5] focus-visible:ring-blue-500 dark:bg-[#0865d8] dark:text-white dark:hover:bg-[#075cc5]"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando…
                      </>
                    ) : (
                      <>
                        Entrar <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <div className="space-y-3 text-center">
                    <button
                      type="button"
                      className="text-sm font-medium text-[#075fc9] underline-offset-4 hover:underline disabled:opacity-50"
                      onClick={handleEsqueciSenha}
                      disabled={isPending}
                    >
                      Esqueci minha senha
                    </button>
                    <div>
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                        onClick={() => setMode("signup")}
                      >
                        Primeiro acesso? Criar conta institucional
                      </button>
                    </div>
                  </div>
                </form>
              </Form>
            </>
          ) : (
            <>
              <header className="mb-7">
                <h2 id="login-title" className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[#0d215d] sm:text-[2.15rem]">
                  Criar conta
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cadastre seu e-mail institucional para solicitar acesso ao PDDE Online.
                </p>
              </header>

              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-5" noValidate>
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">E-mail institucional</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="nome@sme.rio ou @rioeduca.net"
                            type="email"
                            autoComplete="email"
                            className="h-14 rounded-xl border-slate-200 bg-white text-base text-slate-900 dark:bg-white dark:text-slate-900"
                            {...field}
                          />
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
                        <FormLabel className="font-semibold text-slate-700">Senha</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mínimo de 6 caracteres"
                            type="password"
                            autoComplete="new-password"
                            className="h-14 rounded-xl border-slate-200 bg-white text-base text-slate-900 dark:bg-white dark:text-slate-900"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">
                          Use pelo menos 6 caracteres. Recomenda-se combinar letras e números.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-xl bg-[#0865d8] font-semibold text-white hover:bg-[#075cc5] dark:bg-[#0865d8] dark:text-white dark:hover:bg-[#075cc5]"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando conta…
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                  <p className="text-center text-xs leading-5 text-slate-500">
                    Após o cadastro, um administrador atribuirá seu papel de operador.
                  </p>
                  <button
                    type="button"
                    className="mx-auto block text-sm font-medium text-[#075fc9] underline-offset-4 hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Já possui acesso? Entrar
                  </button>
                </form>
              </Form>
            </>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex gap-3 text-slate-600">
              <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Ambiente seguro</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Seus dados são protegidos e utilizados apenas para fins institucionais.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
