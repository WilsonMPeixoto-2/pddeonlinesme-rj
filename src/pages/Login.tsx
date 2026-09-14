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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import loginBackground from "@/assets/login-pdde-rio-4k.avif";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClassName =
  "h-12 rounded-lg border-slate-200 bg-white text-[0.92rem] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-[#0d75d8] focus-visible:ring-[#0d75d8]/20 dark:bg-white dark:text-slate-900";

const Login = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
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
    <main className="relative min-h-screen overflow-hidden bg-[#0a4e6d] text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,91,124,0.74)_0%,rgba(0,110,148,0.52)_37%,rgba(0,95,133,0.22)_63%,rgba(3,31,57,0.16)_100%)]"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(0,210,255,0.20),transparent_26%),linear-gradient(180deg,rgba(4,40,68,0.06)_0%,rgba(4,40,68,0.02)_55%,rgba(4,40,68,0.32)_100%)]"
      />

      <div className="absolute right-7 top-5 z-20 hidden text-[0.66rem] font-medium tracking-[0.03em] text-white/75 md:block">
        Sistema interno&nbsp;&nbsp;|&nbsp;&nbsp;4ª Coordenadoria Regional de Educação
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[56%_44%]">
        <section className="hidden min-h-screen flex-col justify-between px-[5.5vw] py-[5vh] lg:flex">
          <div className="max-w-[31rem]">
            <div className="flex items-center gap-3.5">
              <BrandMark size={58} className="ring-1 ring-white/25 shadow-[0_0_24px_rgba(0,210,255,0.18)]" />
              <div>
                <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.035em] text-white">PDDE Online</h1>
                <p className="mt-1 text-sm font-medium tracking-[0.04em] text-cyan-100/85">4ª CRE</p>
              </div>
            </div>

            <div className="mt-6 h-[2px] w-20 rounded-full bg-cyan-300/80" />

            <h2 className="mt-5 max-w-[28rem] text-[clamp(2rem,3vw,3.15rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
              Recursos que fortalecem a educação de uma cidade inteira.
            </h2>

            <p className="mt-3 max-w-[28rem] text-[0.95rem] leading-6 text-cyan-50/86">
              Dados, controle e transparência para as 163 unidades escolares da 4ª CRE.
            </p>

            <div className="mt-7 space-y-3.5">
              <FeatureItem icon={<BarChart3 className="h-5 w-5" />} title="Informação confiável" text="para melhores decisões" />
              <FeatureItem icon={<FileText className="h-5 w-5" />} title="Gestão eficiente" text="dos recursos públicos" />
              <FeatureItem icon={<UsersRound className="h-5 w-5" />} title="Mais qualidade" text="para nossas escolas" />
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/90">
            <BrandMark size={44} className="ring-1 ring-white/20" />
            <div>
              <p className="text-sm font-semibold">4ª CRE</p>
              <p className="text-[0.68rem] leading-4 text-white/70">4ª Coordenadoria Regional de Educação</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-[4vw]">
          <div
            aria-labelledby="login-title"
            className="w-full max-w-[26.5rem] rounded-[1.15rem] border border-white/55 bg-white/[0.96] px-6 py-7 text-slate-950 shadow-[0_22px_70px_rgba(1,28,51,0.30)] backdrop-blur-xl sm:px-8 sm:py-8"
          >
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <BrandMark size={44} className="ring-1 ring-slate-200" />
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em] text-[#0d215d]">PDDE Online</p>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">4ª CRE</p>
              </div>
            </div>

            <header className="mb-6">
              <h2 id="login-title" className="text-[2rem] font-semibold tracking-[-0.04em] text-[#132764] sm:text-[2.15rem]">
                Bem-vindo
              </h2>
              <p className="mt-1.5 max-w-xs text-[0.88rem] leading-5 text-slate-500">
                Acesse sua conta para continuar no PDDE Online.
              </p>
            </header>

            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-4" noValidate>
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[0.78rem] font-semibold text-slate-700">E-mail institucional</FormLabel>
                      <div className="relative">
                        <UserRound aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <FormControl>
                          <Input
                            placeholder="Digite seu e-mail institucional"
                            type="email"
                            autoComplete="email"
                            className={`${inputClassName} pl-10`}
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
                      <FormLabel className="text-[0.78rem] font-semibold text-slate-700">Senha</FormLabel>
                      <div className="relative">
                        <LockKeyhole aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <FormControl>
                          <Input
                            placeholder="Digite sua senha"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className={`${inputClassName} pl-10 pr-11`}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d75d8]/25"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-1 h-12 w-full rounded-lg bg-[#0874dc] text-[0.9rem] font-semibold text-white shadow-[0_8px_22px_rgba(8,116,220,0.28)] transition hover:bg-[#0768c6] focus-visible:ring-[#0d75d8] dark:bg-[#0874dc] dark:text-white dark:hover:bg-[#0768c6]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…
                    </>
                  ) : (
                    <>
                      Entrar <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="rounded-md text-[0.74rem] font-semibold text-[#0874dc] underline underline-offset-2 transition hover:text-[#075aa9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d75d8]/25 disabled:opacity-50"
                    onClick={handleEsqueciSenha}
                    disabled={isPending}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </Form>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <div>
                  <p className="text-[0.72rem] font-semibold text-slate-700">Ambiente seguro</p>
                  <p className="mt-0.5 text-[0.68rem] leading-4 text-slate-500">
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

function FeatureItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3.5 text-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-200/25 bg-cyan-300/10 text-cyan-100 backdrop-blur-sm">
        {icon}
      </span>
      <div>
        <p className="text-[0.78rem] font-semibold leading-4">{title}</p>
        <p className="text-[0.72rem] leading-4 text-white/72">{text}</p>
      </div>
    </div>
  );
}

function mensagemErroAuth(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos";
  if (message.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar";
  if (message.includes("User already registered")) return "Este e-mail já está cadastrado";
  if (message.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres";
  if (message.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente";
  return `Erro na autenticação: ${message}`;
}

export default Login;
