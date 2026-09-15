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
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import loginBackground from "@/assets/login-pdde-rio.webp";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClassName =
  "h-[3.25rem] rounded-lg border-slate-200 bg-white text-[0.92rem] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-[#0d75d8] focus-visible:ring-[#0d75d8]/20 dark:bg-white dark:text-slate-900";

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
        message: "Digite seu usuário primeiro",
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
    <main
      className="relative min-h-screen overflow-hidden bg-[#0b5d92] text-slate-950"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div aria-hidden className="absolute inset-0 bg-slate-950/10 lg:bg-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/20 lg:hidden" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:justify-end lg:px-[7vw] lg:py-10">
        <section
          aria-labelledby="login-title"
          className="w-full max-w-[28rem] rounded-[1.35rem] border border-white/70 bg-white/[0.96] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-8 lg:min-h-[40rem] lg:-translate-y-4 lg:p-10"
        >
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <BrandMark size={44} className="ring-1 ring-slate-200" />
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">PDDE Online</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">4ª CRE</p>
            </div>
          </div>

          <header className="mb-9">
            <h1 id="login-title" className="text-[2.05rem] font-bold tracking-[-0.035em] text-[#0d215d] sm:text-[2.25rem]">
              Bem-vindo
            </h1>
            <p className="mt-2 max-w-[17rem] text-[0.94rem] leading-6 text-slate-600">
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
                    <FormLabel className="text-[0.9rem] font-semibold text-slate-700">Usuário</FormLabel>
                    <div className="relative">
                      <UserRound aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-slate-400" />
                      <FormControl>
                        <Input
                          placeholder="Digite seu usuário"
                          type="email"
                          autoComplete="username"
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
                    <FormLabel className="text-[0.9rem] font-semibold text-slate-700">Senha</FormLabel>
                    <div className="relative">
                      <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-slate-400" />
                      <FormControl>
                        <Input
                          placeholder="Digite sua senha"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className={`${inputClassName} pl-11 pr-11`}
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
                className="h-[3.25rem] w-full rounded-lg bg-[#0874dc] text-[0.92rem] font-semibold text-white shadow-[0_8px_22px_rgba(8,116,220,0.28)] transition hover:bg-[#0768c6] focus-visible:ring-[#0d75d8] dark:bg-[#0874dc] dark:text-white dark:hover:bg-[#0768c6]"
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
                  className="rounded-md text-[0.75rem] font-semibold text-[#0874dc] underline underline-offset-2 transition hover:text-[#075aa9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d75d8]/25 disabled:opacity-50"
                  onClick={handleEsqueciSenha}
                  disabled={isPending}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </Form>

          <div className="mt-7 border-t border-slate-200 pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <div>
                <p className="text-[0.72rem] font-semibold text-slate-700">Ambiente seguro</p>
                <p className="mt-0.5 text-[0.68rem] leading-4 text-slate-500">
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

function mensagemErroAuth(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos";
  if (message.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar";
  if (message.includes("User already registered")) return "Este e-mail já está cadastrado";
  if (message.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres";
  if (message.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente";
  return `Erro na autenticação: ${message}`;
}

export default Login;
