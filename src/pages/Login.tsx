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

const headingFontStyle = { fontFamily: '"Sora", "Inter", sans-serif' } as const;

const inputClassName =
  "h-12 rounded-[10px] border-[#CDD9E4] bg-white/95 text-[0.92rem] text-[#0A2A43] shadow-[0_1px_2px_rgba(7,26,61,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#7C8C9E] hover:border-[#B7C6D6] focus-visible:border-[#0B63CE] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#0B63CE]/12 dark:bg-white dark:text-[#0A2A43] [@media(max-height:700px)]:xl:h-11";

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
      <div aria-hidden className="fixed inset-0 bg-[linear-gradient(90deg,rgba(4,38,66,0.93)_0%,rgba(4,66,96,0.74)_32%,rgba(6,83,116,0.30)_58%,rgba(7,26,61,0.06)_79%,rgba(7,26,61,0.13)_100%)]" />
      <div aria-hidden className="fixed inset-0 bg-[linear-gradient(180deg,rgba(4,24,48,0.05)_0%,rgba(4,24,48,0)_55%,rgba(4,24,48,0.12)_100%)]" />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1920px] grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 lg:px-12 xl:grid-cols-[minmax(0,1.5fr)_minmax(29rem,0.72fr)] xl:gap-16 xl:px-[5.5vw] xl:py-10 2xl:gap-24 [@media(max-height:700px)]:xl:py-3">
        <section className="mx-auto w-full max-w-[47rem] text-white xl:mx-0" aria-label="Identidade da Inteligência Financeira PDDE">
          <div className="flex items-center gap-4">
            <BrandMark size={62} className="ring-1 ring-white/55 shadow-[0_10px_30px_rgba(0,21,42,0.22)]" />
            <div>
              <p style={headingFontStyle} className="text-[1.5rem] font-semibold tracking-[-0.032em] sm:text-[1.82rem]">Inteligência Financeira <span className="font-bold">PDDE</span></p>
              <p className="mt-1 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[#7DE3E5] sm:text-[0.84rem]">4ª CRE · SME-RJ</p>
            </div>
          </div>

          <div className="mt-8 h-0.5 w-14 rounded-full bg-[#34C3D4] shadow-[0_0_18px_rgba(52,195,212,0.35)] xl:mt-11 [@media(max-height:700px)]:xl:mt-7" />
          <h1 style={headingFontStyle} className="mt-5 max-w-[40rem] text-[2.2rem] font-bold leading-[1.06] tracking-[-0.042em] sm:text-[3rem] lg:text-[3.5rem] xl:text-[clamp(2.8rem,3.35vw,4.45rem)] [@media(max-height:700px)]:xl:text-[2.75rem]">Recursos que fortalecem a educação de uma cidade inteira.</h1>
          <p className="mt-5 max-w-[36rem] text-[1rem] leading-7 text-white/80 sm:text-[1.1rem] xl:text-[1.17rem] xl:leading-8 [@media(max-height:700px)]:xl:mt-3 [@media(max-height:700px)]:xl:text-[1rem]">Dados, controle e transparência para as 163 unidades escolares da 4ª CRE.</p>

          <div className="mt-8 grid max-w-[44rem] gap-4 sm:grid-cols-3 xl:mt-9 xl:grid-cols-1 xl:gap-4 [@media(max-height:700px)]:xl:mt-6 [@media(max-height:700px)]:xl:gap-3">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-white/20 bg-[#063B56]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md [@media(max-height:700px)]:xl:h-10 [@media(max-height:700px)]:xl:w-10"><Icon aria-hidden className="h-[1.3rem] w-[1.3rem] text-[#8DE6E8] [@media(max-height:700px)]:xl:h-5 [@media(max-height:700px)]:xl:w-5" strokeWidth={1.8} /></span>
                <p className="max-w-[17rem] text-[0.9rem] leading-[1.45rem] text-white/90 sm:text-[0.93rem] xl:text-[0.96rem] [@media(max-height:700px)]:xl:text-[0.9rem]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="login-title" className="mx-auto w-full max-w-[30rem] rounded-[18px] border border-white/80 bg-white/[0.94] p-6 shadow-[0_28px_80px_rgba(4,24,48,0.22),0_4px_18px_rgba(4,24,48,0.08)] ring-1 ring-[#DCE6EF]/45 backdrop-blur-2xl sm:p-8 xl:mx-0 xl:justify-self-end xl:p-8 [@media(max-height:760px)]:xl:p-7 [@media(max-height:700px)]:xl:p-5">
          <header className="mb-6 [@media(max-height:760px)]:xl:mb-5 [@media(max-height:700px)]:xl:mb-3">
            <h2 id="login-title" style={headingFontStyle} className="text-[2rem] font-bold tracking-[-0.038em] text-[#0A2A43] sm:text-[2.25rem] [@media(max-height:700px)]:xl:text-[2rem]">Bem-vindo</h2>
            <p className="mt-2 max-w-[24rem] text-[0.93rem] leading-6 text-[#607287] [@media(max-height:700px)]:xl:mt-1 [@media(max-height:700px)]:xl:text-[0.86rem] [@media(max-height:700px)]:xl:leading-5">Acesse sua conta para continuar na Inteligência Financeira PDDE.</p>
          </header>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-5 [@media(max-height:760px)]:xl:space-y-4 [@media(max-height:700px)]:xl:space-y-3" noValidate>
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem className="[@media(max-height:700px)]:xl:space-y-1">
                  <FormLabel className="text-[0.82rem] font-semibold tracking-[0.01em] text-[#173A58]">Usuário</FormLabel>
                  <div className="relative">
                    <UserRound aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.02rem] w-[1.02rem] -translate-y-1/2 text-[#6F8296]" />
                    <FormControl><Input placeholder="Digite seu usuário" type="email" autoComplete="username" className={`${inputClassName} pl-11`} {...field} /></FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={loginForm.control} name="senha" render={({ field }) => (
                <FormItem className="[@media(max-height:700px)]:xl:space-y-1">
                  <FormLabel className="text-[0.82rem] font-semibold tracking-[0.01em] text-[#173A58]">Senha</FormLabel>
                  <div className="relative">
                    <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[1.02rem] w-[1.02rem] -translate-y-1/2 text-[#6F8296]" />
                    <FormControl><Input placeholder="Digite sua senha" type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputClassName} pl-11 pr-11`} {...field} /></FormControl>
                    <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6F8296] transition-colors hover:text-[#173A58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE]/20" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="h-12 w-full rounded-[10px] bg-[linear-gradient(90deg,#0A68D7_0%,#0757BE_100%)] text-[0.93rem] font-semibold tracking-[0.005em] text-white shadow-[0_8px_20px_rgba(7,87,190,0.22)] transition-[transform,filter,box-shadow] duration-200 hover:-translate-y-px hover:brightness-[1.025] hover:shadow-[0_10px_24px_rgba(7,87,190,0.26)] active:translate-y-0 focus-visible:ring-[#22B8CF] dark:text-white [@media(max-height:700px)]:xl:h-11" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…</> : <>Entrar <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>

              <div className="text-center">
                <button type="button" className="min-h-11 rounded-md px-2 text-[0.78rem] font-semibold text-[#0B63CE] decoration-[#0B63CE]/35 underline-offset-4 transition-colors hover:text-[#0F7E80] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE]/20 disabled:opacity-50 [@media(max-height:700px)]:xl:min-h-8" onClick={handleEsqueciSenha} disabled={isPending}>Esqueci minha senha</button>
              </div>
            </form>
          </Form>

          <div className="mt-5 border-t border-[#E0E8EF] pt-5 [@media(max-height:760px)]:xl:mt-4 [@media(max-height:760px)]:xl:pt-4 [@media(max-height:700px)]:xl:mt-3 [@media(max-height:700px)]:xl:pt-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#CFE7E3] bg-[#EAF6F3]"><ShieldCheck aria-hidden className="h-4 w-4 text-[#0F7E80]" /></span>
              <div>
                <p className="text-[0.77rem] font-semibold text-[#173A58]">Ambiente seguro</p>
                <p className="mt-0.5 text-[0.71rem] leading-[1.05rem] text-[#738397]">Seus dados são protegidos e utilizados apenas para fins institucionais.</p>
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
