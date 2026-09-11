import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  BookOpen,
  Database,
  LayoutDashboard,
  Receipt,
  School,
  Search,
  Settings,
  Upload,
  UserCircle,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  GLOBAL_NAVIGATION,
  searchGlobalSchools,
  type GlobalNavigationItem,
} from "@/lib/globalSearch";
import { unidadesLocalizadorOptions } from "@/lib/queryKeys";

const NAVIGATION_ICONS: Record<GlobalNavigationItem["id"], LucideIcon> = {
  dashboard: LayoutDashboard,
  repasses: WalletCards,
  escolas: School,
  fiscal: Receipt,
  base: Upload,
  configuracoes: Settings,
  manual: BookOpen,
  diretor: UserCircle,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const unidadesQuery = useQuery({
    ...unidadesLocalizadorOptions(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const schoolResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchGlobalSchools(unidadesQuery.data ?? [], query, 8);
  }, [query, unidadesQuery.data]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("pt-BR") === "k") {
      event.preventDefault();
      setOpen((previous) => !previous);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  const goTo = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  const searchingSchools = query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Buscar páginas ou unidades escolares…"
        aria-label="Buscar no PDDE Online"
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Search className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {searchingSchools && unidadesQuery.isFetching
                ? "Carregando unidades escolares…"
                : "Nenhum resultado encontrado."}
            </p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navegação">
          {GLOBAL_NAVIGATION.map((item) => {
            const Icon = NAVIGATION_ICONS[item.id];
            return (
              <CommandItem
                key={item.path}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => goTo(item.path)}
                className="cursor-pointer gap-3"
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {schoolResults.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Unidades escolares · ${schoolResults.length}`}>
              {schoolResults.map((school) => (
                <CommandItem
                  key={school.id}
                  forceMount
                  value={`escola-${school.id}`}
                  onSelect={() => goTo(`/escolas/${school.id}`)}
                  className="cursor-pointer gap-3"
                >
                  <School className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{school.designacao}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[school.nome, school.inep ? `INEP ${school.inep}` : null, school.diretor]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">Abrir</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {searchingSchools && unidadesQuery.isError ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Unidades escolares">
              <CommandItem disabled forceMount value="erro-unidades" className="gap-3">
                <Database className="h-4 w-4 text-destructive" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Não foi possível consultar o localizador de unidades.</span>
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
