import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import loginBackground from "@/assets/login-pdde-rio-4k.avif";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .refine((email) => email.endsWith("@sme.rio") || email.endsWith("@rioeduca.net"), {
      message: "Apenas e-mails institucionais @sme.rio ou @rioeduca.net são permitidos",
    }),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type AuthMode = "signin" | "signup";

const inputClassName =
  "h-14 rounded-2xl border-slate-200/90 bg-slate-50/80 text-[0.98rem] text-slate-900 shadow-none transition-colors placeholder:text-slate-400 hover:bg-white focus-visible:border-[#1466c3] focus-visible:bg-white focus-visible:ring-[#1466c3]/15 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white";

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
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.senha,
      });

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
      loginForm.setError("email", {
        type: "manual",
        message: "Digite seu e-mail institucional primeiro",
      });
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
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.", {
        id: toastId,
      });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#082844] text-slate-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:bg-[position:center_center]"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,22,42,0.20)_0%,rgba(6,22,42,0.08)_44%,rgba(6,22,42,0.28)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,21,38,0.06)_0%,rgba(5,21,38,0.02)_48%,rgba(5,21,38,0.22)_72%,rgba(5,21,38,0.40)_100%)]"
      />

      <section className="sr-only" aria-label="Identidade institucional">
        <h1>PDDE Online</h1>
        <p>4ª CRE · SME-RJ</p>
        <p>Recursos que fortalecem a educação de uma cidade inteira.</p>
        <p>Dados, controle e transparência para as unidades escolares da 4ª CRE.</p>
      </section>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(31rem,41rem)]">
        <div aria-hidden className="hidden lg:block" />

        <section className="flex min-h-screen items-center justify-center px-4 py-7 sm:px-7 lg:bg-[linear-gradient(90deg,rgba(236,245,250,0.00)_0%,rgba(236,245,250,0.62)_16%,rgba(243,248,252,0.92)_48%,rgba(247,250,252,0.97)_100%)] lg:px-8 xl:px-12">
          <div
            aria-labelledby="login-title"
            className="w-full max-w-[30rem] rounded-[1.75rem] border border-white/75 bg-white/[0.94] p-5 shadow-[0_28px_90px_rgba(7,35,60,0.24)] backdrop-blur-2xl sm:p-8 lg:border-slate-200/70 lg:bg-white/[0.91] lg:p-9 lg:shadow-[0_26px_85px_rgba(7,35,60,0.18)]"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark size={48} className="ring-1 ring-slate-200/90" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.02em] text-[#0d215d]">PDDE Online</p>
                <p className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  4ª CRE · SME-RJ
                </p>
              </div>
            </div>

            {mode === "signin" ? (
              <>
                <header className="mb-7">
                  <h2
                    id="login-title"
                    className="text-[2rem] font-semibold tracking-[-0.04em] text-[#0d215d] sm:text-[2.3rem]"
                  >
                    Bem-vindo
                  </h2>
                  <p className="mt-2 max-w-sm text-[0.96rem] leading-6 text-slate-600">
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
                          <FormLabel className="text-[0.9rem] font-semibold text-slate-700">
                            E-mail institucional
                          </FormLabel>
                          <div className="relative">
                            <UserRound
                              aria-hidden
                              className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-slate-400"
                            />
                            <FormControl>
                              <Input
                                placeholder="nome@sme.rio ou @rioeduca.net"
                                type="email"
                                autoComplete="email"
                                className={`${inputClassName} pl-11`}
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
                          <div className="flex items-center justify-between gap-4">
                            <FormLabel className="text-[0.9rem] font-semibold text-slate-700">Senha</FormLabel>
                            <button
                              type="button"
                              className="rounded-md text-xs font-semibold text-[#0c63bd] underline-offset-4 transition hover:text-[#084f99] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1466c3]/30 disabled:opacity-50"
                              onClick={handleEsqueciSenha}
                              disabled={isPending}
                            >
                              Esqueci minha senha
                            </button>
                          </div>

                          <div className="relative">
                            <LockKeyhole
                              aria-hidden
                              className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-slate-400"
                            />
                            <FormControl>
                              <Input
                                placeholder="Digite sua senha"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                className={`${inputClassName} pl-11 pr-12`}
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1466c3]/30"
                              onClick={() => setShowPassword((value) => !value)}
                            >
                              {showPassword ? <EyeOff className="h-[1.1rem] w-[1.1rem]" /> : <Eye className="h-[1.1rem] w-[1.1rem]" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="h-14 w-full rounded-2xl bg-[#0865d8] text-[0.98rem] font-semibold text-white shadow-[0_12px_26px_rgba(8,101,216,0.22)] transition hover:bg-[#075cc5] hover:shadow-[0_14px_30px_rgba(8,101,216,0.27)] focus-visible:ring-[#1466c3] dark:bg-[#0865d8] dark:text-white dark:hover:bg-[#075cc5]"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando…
                        </>
                      ) : (
                        <>
                          Entrar <ArrowRight className="ml-2 h-[1.1rem] w-[1.1rem]" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-3 py-1" aria-hidden>
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Primeiro acesso
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Primeiro acesso? Criar conta institucional"
                      className="h-12 w-full rounded-2xl border-slate-200 bg-white/65 text-sm font-semibold text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-[#0d215d]"
                      onClick={() => setMode("signup")}
                    >
                      Criar conta institucional
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <>
                <header className="mb-7">
                  <button
                    type="button"
                    aria-label="Já possui acesso? Entrar"
                    className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-[#0d215d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1466c3]/30"
                    onClick={() => setMode("signin")}
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para entrar
                  </button>
                  <h2
                    id="login-title"
                    className="text-[1.95rem] font-semibold tracking-[-0.04em] text-[#0d215d] sm:text-[2.2rem]"
                  >
                    Criar conta
                  </h2>
                  <p className="mt-2 max-w-sm text-[0.94rem] leading-6 text-slate-600">
                    Use seu e-mail institucional para solicitar acesso ao PDDE Online.
                  </p>
                </header>

                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-5" noValidate>
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[0.9rem] font-semibold text-slate-700">
                            E-mail institucional
                          </FormLabel>
                          <div className="relative">
                            <UserRound
                              aria-hidden
                              className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-slate-400"
                            />
                            <FormControl>
                              <Input
                                placeholder="nome@sme.rio ou @rioeduca.net"
                                type="email"
                                autoComplete="email"
                                className={`${inputClassName} pl-11`}
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signUpForm.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[0.9rem] font-semibold text-slate-700">Senha</FormLabel>
                          <div className="relative">
                            <LockKeyhole
                              aria-hidden
                              className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-slate-400"
                            />
                            <FormControl>
                              <Input
                                placeholder="Mínimo de 6 caracteres"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className={`${inputClassName} pl-11 pr-12`}
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1466c3]/30"
                              onClick={() => setShowPassword((value) => !value)}
                            >
                              {showPassword ? <EyeOff className="h-[1.1rem] w-[1.1rem]" /> : <Eye className="h-[1.1rem] w-[1.1rem]" />}
                            </button>
                          </div>
                          <FormDescription className="text-xs leading-5 text-slate-500">
                            Use pelo menos 6 caracteres. Recomenda-se combinar letras e números.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="h-14 w-full rounded-2xl bg-[#0865d8] text-[0.98rem] font-semibold text-white shadow-[0_12px_26px_rgba(8,101,216,0.22)] transition hover:bg-[#075cc5] hover:shadow-[0_14px_30px_rgba(8,101,216,0.27)] focus-visible:ring-[#1466c3] dark:bg-[#0865d8] dark:text-white dark:hover:bg-[#075cc5]"
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
                  </form>
                </Form>
              </>
            )}

            <div className="mt-7 border-t border-slate-200/80 pt-5">
              <div className="flex items-start gap-3 text-slate-500">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <ShieldCheck aria-hidden className="h-4 w-4 text-slate-500" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Ambiente seguro</p>
                  <p className="mt-0.5 text-[0.72rem] leading-5 text-slate-500">
                    Seus dados são utilizados exclusivamente para acesso e operação do sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

function mensagemErroAuth(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos";
  if (message.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar";
  if (message.includes("User already registered")) return "Este e-mail já está cadastrado";
  if (message.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres";
  if (message.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente";
  return `Erro na autenticação: ${message}`;
}

export default Login;
