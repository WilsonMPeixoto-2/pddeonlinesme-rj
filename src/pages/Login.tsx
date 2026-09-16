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
import loginBackgroundClean from "@/assets/login-pdde-rio-clean.webp";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClassName =
  "h-12 rounded-[10px] border-[#D8E1EA] bg-white text-[0.92rem] text-[#0A2A43] shadow-sm placeholder:text-[#7C8C9E] focus-visible:border-[#0B63CE] focus-visible:ring-[#0B63CE]/10 dark:bg-white dark:text-[#0A2A43]";

const benefits = [
  { icon: ChartNoAxesColumnIncreasing, text: "Informação confiável para melhores decisões" },
  { icon: ClipboardList, text: "Gestão eficiente dos recursos públicos" },
  { icon: UsersRound, text: "Mais qualidade para nossas escolas" },
];

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
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.senha });
      if (error) return toast.error(mensagemErroAuth(error.message));
      toast.success("Bem-vindo(a)!");
      navigate("/dashboard");
    });
  };

  const handleEsqueciSenha = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      loginForm.setError("email", { type: "manual", message: "Digite seu usuário primeiro" });
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
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#0A2A43] text-slate-950">
      <img src={loginBackgroundClean} alt="" aria-hidden className="fixed inset-0 h-full w-full select-none object-cover object-center" />
      <div aria-hidden className="fixed inset-0 bg-[linear-gradient(90deg,rgba(4,38,66,0.96)_0%,rgba(4,66,96,0.82)_32%,rgba(6,83,116,0.44)_57%,rgba(7,26,61,0.10)_78%,rgba(7,26,61,0.18)_100%)]" />
      <div aria-hidden className="fixed inset-0 bg-slate-950/5" />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1920px] grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 lg:px-12 xl:grid-cols-[minmax(0,1.35fr)_minmax(31rem,0.8fr)] xl:gap-16 xl:px-[5.5vw] xl:py-10 2xl:gap-24">
        <section className="mx-auto w-full max-w-[48rem] text-white xl:mx-0" aria-label="Identidade da Inteligência Financeira PDDE">
          <div className="flex items-center gap-4">
            <BrandMark size={64} className="ring-1 ring-white/40 shadow-[0_8px_28px_rgba(0,0,0,0.18)]" />
            <div>
              <p className="text-[1.5rem] font-semibold tracking-[-0.025em] sm:text-[1.85rem]">Inteligência Financeira <span className="font-bold">PDDE</span></p>
              <p className="mt-1 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#72E1E1] sm:text-[0.88rem]">4ª CRE · SME-RJ</p>
            </div>
          </div>

          <div className="mt-8 h-[3px] w-12 rounded-full bg-[#22B8CF] xl:mt-12" />
          <h1 className="mt-5 max-w-[42rem] text-[2.2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[3rem] lg:text-[3.6rem] xl:text-[clamp(2.9rem,3.6vw,4.7rem)]">Recursos que fortalecem a educação de uma cidade inteira.</h1>
          <p className="mt-5 max-w-[39rem] text-[1rem] leading-7 text-white/82 sm:text-[1.12rem] xl:text-[1.22rem]">Dados, controle e transparência para as 163 unidades escolares da 4ª CRE.</p>

          <div className="mt-8 grid max-w-[43rem] gap-4 sm:grid-cols-3 xl:mt-10 xl:grid-cols-1 xl:gap-5">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#22B8CF]/55 bg-[#003D5C]/35 backdrop-blur-sm"><Icon aria-hidden className="h-6 w-6 text-[#8BE6E6]" strokeWidth={1.8} /></span>
                <p className="max-w-[15rem] text-[0.9rem] leading-6 text-white/92 sm:text-[0.94rem] xl:text-[1rem]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="login-title" className="mx-auto w-full max-w-[35rem] rounded-[20px] border border-white/65 bg-white/[0.965] p-6 shadow-[0_20px_60px_rgba(7,26,61,0.22)] backdrop-blur-xl sm:p-8 xl:mx-0 xl:justify-self-end xl:p-10 [@media(max-height:760px)]:xl:p-7">
          <header className="mb-7 [@media(max-height:760px)]:xl:mb-5">
            <h2 id="login-title" className="text-[2rem] font-bold tracking-[-0.04em] text-[#0A2A43] sm:text-[2.35rem]">Bem-vindo</h2>
            <p className="mt-2 max-w-[24rem] text-[0.95rem] leading-6 text-[#5E7186]">Acesse sua conta para continuar na Inteligência Financeira PDDE.</p>
          </header>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-5 [@media(max-height:760px)]:xl:space-y-4" noValidate>
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[0.88rem] font-semibold text-[#0A2A43]">Usuário</FormLabel>
                  <div className="relative">
                    <UserRound aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[#6B7C91]" />
                    <FormControl><Input placeholder="Digite seu usuário" type="email" autoComplete="username" className={`${inputClassName} pl-11`} {...field} /></FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={loginForm.control} name="senha" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[0.88rem] font-semibold text-[#0A2A43]">Senha</FormLabel>
                  <div className="relative">
                    <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[#6B7C91]" />
                    <FormControl><Input placeholder="Digite sua senha" type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputClassName} pl-11 pr-11`} {...field} /></FormControl>
                    <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6B7C91] transition hover:text-[#0A2A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE]/20" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="h-12 w-full rounded-[10px] bg-[linear-gradient(90deg,#0B6FE8_0%,#0B63CE_100%)] text-[0.94rem] font-semibold text-white shadow-[0_8px_22px_rgba(11,99,206,0.24)] transition hover:brightness-105 focus-visible:ring-[#22B8CF] dark:text-white" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…</> : <>Entrar <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>

              <div className="text-center">
                <button type="button" className="min-h-11 rounded-md px-2 text-[0.78rem] font-semibold text-[#0B63CE] underline underline-offset-2 transition hover:text-[#0F8B8D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE]/20 disabled:opacity-50" onClick={handleEsqueciSenha} disabled={isPending}>Esqueci minha senha</button>
              </div>
            </form>
          </Form>

          <div className="mt-6 border-t border-[#D8E1EA] pt-5 [@media(max-height:760px)]:xl:mt-4 [@media(max-height:760px)]:xl:pt-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF3F8]"><ShieldCheck aria-hidden className="h-4 w-4 text-[#0F8B8D]" /></span>
              <div>
                <p className="text-[0.76rem] font-semibold text-[#0A2A43]">Ambiente seguro</p>
                <p className="mt-0.5 text-[0.7rem] leading-4 text-[#7C8C9E]">Seus dados são protegidos e utilizados apenas para fins institucionais.</p>
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
