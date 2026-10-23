import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Upload,
  User,
  UserCircle,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useExercicio } from "@/hooks/useExercicio";
import BrandMark from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { FinancialFreshnessBanner } from "@/components/FinancialFreshnessBanner";

const primaryTabs = [
  { to: "/dashboard", label: "Painel" },
  { to: "/repasses", label: "Repasses" },
  { to: "/escolas", label: "Unidades Escolares" },
  { to: "/atualizacoes", label: "Atualizações" },
];

const utilityTabs = [
  { to: "/base", label: "Importar / Exportar", icon: Upload },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/manual", label: "Manual", icon: BookOpen },
];

function getInitials(email?: string | null): string {
  if (!email) return "??";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { exercicio, setExercicio } = useExercicio();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  const initials = getInitials(user?.email);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CommandPalette />
      <header className="sticky top-0 z-30 border-b border-border/40 bg-card/40 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={28} glow />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">PDDE Online</p>
                <p className="text-[11px] font-light tracking-wide text-muted-foreground">
                  4ª CRE · SME-RJ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <span>Buscar…</span>
                <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded border border-border/40 bg-muted/30 px-1 text-[10px] font-mono">⌘K</kbd>
              </button>

              <Select value={exercicio} onValueChange={setExercicio}>
                <SelectTrigger aria-label="Selecionar exercício" className="h-8 w-[105px] text-xs border-border/50 bg-muted/20">
                  <CalendarDays className="mr-1.5 h-3 w-3 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Menu do usuário"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted/80 to-muted/30 shadow-inner text-xs font-semibold text-foreground/80">
                      {initials}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[220px] bg-popover/95 backdrop-blur-md border-border/60 shadow-xl"
                >
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium truncate">{user?.email ?? "Usuário"}</p>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-primary/30 bg-primary/8 text-primary"
                      >
                        Administrador
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={() => navigate("/configuracoes", { viewTransition: true })} className="gap-2 cursor-pointer">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-sm">Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/diretor", { viewTransition: true })} className="gap-2 cursor-pointer">
                    <UserCircle className="h-3.5 w-3.5" />
                    <span className="text-sm">Portal do Diretor</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="text-sm">Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav className="hidden items-center gap-1 overflow-x-auto md:flex" aria-label="Navegação principal">
            {primaryTabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                viewTransition
                className={({ isActive }) =>
                  `relative px-3 py-2.5 text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-primary font-medium after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                    utilityTabs.some((item) => location.pathname.startsWith(item.to))
                      ? "text-primary font-medium after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Abrir ferramentas administrativas"
                >
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                  Ferramentas
                  <ChevronDown className="h-3 w-3 opacity-70" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[220px] bg-popover/95 backdrop-blur-md border-border/60 shadow-xl"
              >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Apoio administrativo
                </DropdownMenuLabel>
                {utilityTabs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => navigate(item.to, { viewTransition: true })}
                      className="gap-2.5 cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <nav className="py-2 md:hidden" aria-label="Navegação principal">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir navegação principal"
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Menu className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">
                      {[...primaryTabs, ...utilityTabs].find((item) =>
                        location.pathname.startsWith(item.to),
                      )?.label ?? "Navegação"}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[min(320px,calc(100vw-2rem))] border-border/60 bg-popover/95 shadow-xl backdrop-blur-md"
              >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Áreas de trabalho
                </DropdownMenuLabel>
                {primaryTabs.map((item) => {
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => navigate(item.to, { viewTransition: true })}
                      className="cursor-pointer justify-between gap-3"
                    >
                      <span className="text-sm">{item.label}</span>
                      {active ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Ferramentas
                </DropdownMenuLabel>
                {utilityTabs.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => navigate(item.to, { viewTransition: true })}
                      className="cursor-pointer justify-between gap-3"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm">{item.label}</span>
                      </span>
                      {active ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <FinancialFreshnessBanner />

      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-[11px] font-light tracking-wide text-muted-foreground/70">
            Sistema interno · 4ª Coordenadoria Regional de Educação · SME-RJ
          </p>
          <BrandMark size={20} className="opacity-40" />
        </div>
      </footer>
    </div>
  );
}