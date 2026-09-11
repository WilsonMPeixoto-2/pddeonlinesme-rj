from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


escolas_path = Path("src/pages/Escolas.tsx")
escolas = escolas_path.read_text()

escolas = replace_once(
    escolas,
    'import { useNavigate } from "react-router-dom";',
    'import { useNavigate, useSearchParams } from "react-router-dom";',
    "Escolas router import",
)

escolas = replace_once(
    escolas,
    'import { cn } from "@/lib/utils";\n',
    'import { cn } from "@/lib/utils";\nimport {\n  buildEscolasSearchParams,\n  buildSchoolDetailPath,\n  parseEscolasSearchParams,\n  type EscolasStatusFilter,\n} from "@/lib/escolasNavigation";\n',
    "Escolas navigation helper import",
)

escolas = replace_once(
    escolas,
    'type StatusFilter = "todas" | "completo" | "incompleto";',
    'type StatusFilter = EscolasStatusFilter;',
    "Escolas status type",
)

escolas = replace_once(
    escolas,
    '''export default function Escolas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [confirmLote, setConfirmLote] = useState(false);
  const { exercicio } = useExercicio();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  // Documents panel state''',
    '''export default function Escolas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseEscolasSearchParams(searchParams);
  const q = filters.q;
  const statusFilter: StatusFilter = filters.status;
  const [confirmLote, setConfirmLote] = useState(false);
  const { exercicio } = useExercicio();

  const updateFilters = (next: { q?: string; status?: StatusFilter }) => {
    const current = parseEscolasSearchParams(searchParams);
    setSearchParams(buildEscolasSearchParams({ ...current, ...next }), { replace: true });
  };
  const setQ = (value: string) => updateFilters({ q: value });
  const setStatusFilter = (value: StatusFilter) => updateFilters({ status: value });
  const schoolDetailPath = (schoolId: string) =>
    buildSchoolDetailPath(
      schoolId,
      buildEscolasSearchParams({ q, status: statusFilter }),
    );

  // Documents panel state''',
    "Escolas filter state",
)

escolas = replace_once(
    escolas,
    '''  useEffect(() => {
    if (error) toast.error(error.message ?? "Erro ao carregar unidades.");
  }, [error]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {''',
    '''  useEffect(() => {
    if (error) toast.error(error.message ?? "Erro ao carregar unidades.");
  }, [error]);

  useEffect(() => {
    const canonical = buildEscolasSearchParams({ q, status: statusFilter });
    if (canonical.toString() !== searchParams.toString()) {
      setSearchParams(canonical, { replace: true });
    }
  }, [q, searchParams, setSearchParams, statusFilter]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {''',
    "Escolas canonical URL effect",
)

escolas = replace_once(
    escolas,
    '''  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
  };''',
    '''  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };''',
    "Escolas clear filters",
)

direct_nav = 'navigate(`/escolas/${e.id}`, { viewTransition: true })'
direct_count = escolas.count(direct_nav)
if direct_count != 3:
    raise SystemExit(f"Escolas detail navigation: expected 3 matches, found {direct_count}")
escolas = escolas.replace(direct_nav, 'navigate(schoolDetailPath(e.id), { viewTransition: true })')

escolas_path.write_text(escolas)

detalhe_path = Path("src/pages/EscolaEditar.tsx")
detalhe = detalhe_path.read_text()

detalhe = replace_once(
    detalhe,
    'import { useNavigate, useParams, Link } from "react-router-dom";',
    'import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";',
    "EscolaEditar router import",
)

detalhe = replace_once(
    detalhe,
    'import { getErrorMessage } from "@/lib/errors";\n',
    'import { getErrorMessage } from "@/lib/errors";\nimport { resolveSafeEscolasReturn } from "@/lib/escolasNavigation";\n',
    "EscolaEditar helper import",
)

detalhe = replace_once(
    detalhe,
    '''  const { id } = useParams();
  const navigate = useNavigate();
  const { exercicio } = useExercicio();''',
    '''  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = resolveSafeEscolasReturn(searchParams.get("return"));
  const { exercicio } = useExercicio();''',
    "EscolaEditar return context",
)

detalhe = replace_once(
    detalhe,
    '<Button variant="outline" onClick={() => navigate("/escolas", { viewTransition: true })}>',
    '<Button variant="outline" onClick={() => navigate(returnTo, { viewTransition: true })}>',
    "EscolaEditar empty-state return",
)

detalhe = replace_once(
    detalhe,
    '              to="/escolas"\n              viewTransition',
    '              to={returnTo}\n              viewTransition',
    "EscolaEditar breadcrumb return",
)

detalhe_path.write_text(detalhe)
