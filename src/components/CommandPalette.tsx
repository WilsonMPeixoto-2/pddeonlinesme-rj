import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, School, Upload, Settings, BookOpen, FileSpreadsheet,
  Palette, ShieldAlert, UserCircle, Search,
} from "lucide-react";
import { toast } from "sonner";

const NAVIGATION = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", shortcut: "D" },
  { label: "Unidades Escolares", icon: School, path: "/escolas", shortcut: "E" },
  { label: "Importar / Exportar BASE", icon: Upload, path: "/base", shortcut: "B" },
  { label: "Configurações", icon: Settings, path: "/configuracoes", shortcut: "C" },
  { label: "Manual", icon: BookOpen, path: "/manual", shortcut: "M" },
  { label: "Portal do Diretor", icon: UserCircle, path: "/diretor", shortcut: "P" },
  { label: "Style Guide", icon: Palette, path: "/style-guide" },
  { label: "Acesso Negado (demo)", icon: ShieldAlert, path: "/acesso-negado" },
];

const ACTIONS = [
  { label: "Exportar BASE em .xlsx", icon: FileSpreadsheet, action: () => toast.info("Em breve: exportar BASE em .xlsx") },
  { label: "Gerar lote de documentos (.zip)", icon: FileSpreadsheet, action: () => toast.info("Em breve: geração de lote (.zip)") },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const runAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, ações e atalhos…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Search className="h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navegação">
          {NAVIGATION.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runAction(() => navigate(item.path))}
              className="gap-3 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/40 px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
                  ⌘{item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          {ACTIONS.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => runAction(item.action)}
              className="gap-3 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
