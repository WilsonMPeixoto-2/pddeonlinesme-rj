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
    "  const lista = useMemo(() => {",
    "  const lista = (() => {",
    "lista memo start",
)
escolas = replace_once(
    escolas,
    "  }, [detalheByUnidadeId, deferredQ, statusFilter, unidades]);",
    "  })();",
    "lista memo end",
)
escolas_path.write_text(escolas)


detalhe_path = Path("src/pages/EscolaEditar.tsx")
detalhe = detalhe_path.read_text()
detalhe = replace_once(
    detalhe,
    '<Button variant="outline" onClick={() => navigate(returnTo, { viewTransition: true })}>',
    '<Button variant="outline" onClick={() => navigate(returnTo, { replace: true, viewTransition: true })}>',
    "not found return replace",
)
detalhe = replace_once(
    detalhe,
    "              to={returnTo}\n              viewTransition",
    "              to={returnTo}\n              replace\n              viewTransition",
    "breadcrumb return replace",
)
detalhe_path.write_text(detalhe)
