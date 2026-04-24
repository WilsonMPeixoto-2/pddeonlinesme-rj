import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BrandMark from "@/components/BrandMark";

const tabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/escolas", label: "Unidades Escolares" },
  { to: "/base", label: "Importar/Exportar" },
  { to: "/configuracoes", label: "Configurações" },
  { to: "/manual", label: "Manual" },
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  const initials = getInitials(user?.email);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/60 backdrop-blur-md">
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

            {/* User avatar + dropdown */}
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
                <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="gap-2 cursor-pointer">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-sm">Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-sm">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
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
          </nav>
        </div>
      </header>

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
