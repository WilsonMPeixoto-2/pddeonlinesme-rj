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
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import loginBackground from "@/assets/login-pdde-rio.webp";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClassName =
  "h-[3.25rem] rounded-[0.6rem] border-[#DCE4ED] bg-white text-[0.92rem] text-[#071A3D] shadow-sm placeholder:text-[#7B899B] focus-visible:border-[#0057D9] focus-visible:ring-[#0057D9]/10 dark:bg-white dark:text-[#071A3D]";

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
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#004C70] text-slate-950">
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat xl:block"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />

      <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#004C70] xl:hidden">
        <div
          className="absolute inset-0 bg-[position:47%_center] bg-[length:auto_175dvh] bg-no-repeat sm:bg-[length:auto_200dvh]"
          style={{ backgroundImage: `url(${loginBackground})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,76,112,0.82)_0%,rgba(0,76,112,0.52)_28%,rgba(0,76,112,0.38)_55%,rgba(0,76,112,0.72)_100%)]" />
      </div>

      <div aria-hidden className="absolute inset-0 bg-slate-950/5 xl:bg-transparent" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-4 py-7 sm:px-8 sm:py-10 xl:items-end xl:justify-center xl:px-[7vw] xl:py-10">
        <section className="w-full max-w-[38rem] text-white xl:hidden" aria-label="Identidade do PDDE Online">
          <div className="flex items-center gap-3">
            <BrandMark size={48} className="ring-1 ring-white/35" />
            <div>
              <p className="text-[1.15rem] font-semibold tracking-[-0.02em]">PDDE Online</p>
              <p className="mt-0.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white/72">4ª CRE</p>
            </div>
          </div>

          <div className="mt-7 h-[2px] w-8 rounded-full bg-[#22B8CF]" />
          <h1 className="mt-4 max-w-[31rem] text-[1.8rem] font-bold leading-[1.13] tracking-[-0.025em] sm:text-[2.25rem]">
            Recursos que fortalecem a educação de uma cidade inteira.
          </h1>
          <p className="mt-3 max-w-[30rem] text-[0.94rem] leading-6 text-white/82">
            Dados, controle e transparência para as 163 unidades escolares da 4ª CRE.
          </p>
        </section>

        <section
          aria-labelledby="login-title"
          className="mt-7 w-full max-w-[28rem] rounded-[1rem] border border-white/55 bg-white/[0.96] p-6 shadow-[0_8px_28px_rgba(7,26,61,0.10)] backdrop-blur-xl sm:max-w-[34rem] sm:p-8 md:max-w-[38rem] xl:mt-0 xl:min-h-[40rem] xl:max-w-[28rem] xl:-translate-y-4 xl:rounded-[1.35rem] xl:p-10 xl:shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        >
          <header className="mb-8 xl:mb-9">
            <h2 id="login-title" className="text-[2rem] font-bold tracking-[-0.035em] text-[#071A3D] sm:text-[2.2rem]">
              Bem-vindo
            </h2>
            <p className="mt-2 max-w-[18rem] text-[0.94rem] leading-6 text-[#52637A]">
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
                    <FormLabel className="text-[0.9rem] font-semibold text-[#52637A]">Usuário</FormLabel>
                    <div className="relative">
                      <UserRound aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[#6B7C91]" />
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
                    <FormLabel className="text-[0.9rem] font-semibold text-[#52637A]">Senha</FormLabel>
                    <div className="relative">
                      <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[#6B7C91]" />
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6B7C91] transition hover:text-[#071A3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057D9]/20"
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
                className="h-[3rem] w-full rounded-[0.6rem] bg-[linear-gradient(90deg,#0067E8_0%,#0057D9_100%)] text-[0.92rem] font-semibold text-white shadow-[0_8px_22px_rgba(0,87,217,0.22)] transition hover:brightness-105 focus-visible:ring-[#22B8CF] dark:text-white"
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
                  className="min-h-11 rounded-md px-2 text-[0.76rem] font-semibold text-[#0057D9] underline underline-offset-2 transition hover:text-[#004C70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057D9]/20 disabled:opacity-50"
                  onClick={handleEsqueciSenha}
                  disabled={isPending}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </Form>

          <div className="mt-6 border-t border-[#DCE4ED] pt-5 xl:mt-7">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F2F6FA]">
                <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-[#52637A]" />
              </span>
              <div>
                <p className="text-[0.72rem] font-semibold text-[#071A3D]">Ambiente seguro</p>
                <p className="mt-0.5 text-[0.68rem] leading-4 text-[#7B899B]">
                  Seus dados são protegidos e utilizados apenas para fins institucionais.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid w-full max-w-[38rem] gap-4 pb-2 text-white/90 sm:grid-cols-3 xl:hidden" aria-label="Benefícios do PDDE Online">
          <div className="flex items-center gap-3">
            <ChartNoAxesColumnIncreasing aria-hidden className="h-5 w-5 shrink-0 text-[#22B8CF]" strokeWidth={1.8} />
            <p className="text-[0.78rem] leading-5">Informação confiável para melhores decisões</p>
          </div>
          <div className="flex items-center gap-3">
            <ClipboardList aria-hidden className="h-5 w-5 shrink-0 text-[#22B8CF]" strokeWidth={1.8} />
            <p className="text-[0.78rem] leading-5">Gestão eficiente dos recursos públicos</p>
          </div>
          <div className="flex items-center gap-3">
            <UsersRound aria-hidden className="h-5 w-5 shrink-0 text-[#22B8CF]" strokeWidth={1.8} />
            <p className="text-[0.78rem] leading-5">Mais qualidade para nossas escolas</p>
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
