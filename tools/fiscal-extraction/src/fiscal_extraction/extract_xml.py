from __future__ import annotations

from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import xmltodict

from .models import FiscalExtractionResult, FiscalItem, FiscalParty
from .normalize import normalize_cnpj, normalize_date
from .validators import validate_result


def _strip_namespace(value: Any) -> Any:
    if isinstance(value, dict):
        stripped: dict[str, Any] = {}
        for key, child in value.items():
            normalized_key = key.split(":", 1)[-1]
            stripped[normalized_key] = _strip_namespace(child)
        return stripped
    if isinstance(value, list):
        return [_strip_namespace(item) for item in value]
    return value


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _get_path(data: dict[str, Any], *path: str) -> Any:
    current: Any = data
    for part in path:
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def extract_from_xml(path: str | Path) -> FiscalExtractionResult:
    source_path = Path(path)
    raw_xml = source_path.read_text(encoding="utf-8")
    parsed = _strip_namespace(xmltodict.parse(raw_xml))

    nfe_proc = parsed.get("nfeProc", parsed)
    nfe = nfe_proc.get("NFe", nfe_proc)
    inf_nfe = nfe.get("infNFe", nfe)

    ide = inf_nfe.get("ide", {})
    emit = inf_nfe.get("emit", {})
    dest = inf_nfe.get("dest", {})
    total = _get_path(inf_nfe, "total", "ICMSTot") or {}

    access_key = _get_path(nfe_proc, "protNFe", "infProt", "chNFe")
    if not access_key:
        inf_id = inf_nfe.get("@Id") or inf_nfe.get("Id")
        if isinstance(inf_id, str) and inf_id.startswith("NFe"):
            access_key = inf_id[3:]

    items: list[FiscalItem] = []
    for detail in _as_list(inf_nfe.get("det")):
        product = detail.get("prod", {}) if isinstance(detail, dict) else {}
        items.append(
            FiscalItem(
                code=product.get("cProd"),
                description=product.get("xProd"),
                quantity=_decimal(product.get("qCom")),
                unit_value=_decimal(product.get("vUnCom")),
                total_value=_decimal(product.get("vProd")),
            )
        )

    result = FiscalExtractionResult(
        source_file=str(source_path),
        source_type="xml",
        document_type="NF-e",
        document_number=ide.get("nNF"),
        access_key=access_key,
        issue_date=normalize_date(ide.get("dhEmi") or ide.get("dEmi")),
        supplier=FiscalParty(name=emit.get("xNome"), cnpj=normalize_cnpj(emit.get("CNPJ"))),
        recipient=FiscalParty(name=dest.get("xNome"), cnpj=normalize_cnpj(dest.get("CNPJ"))),
        total_value=_decimal(total.get("vNF")),
        items=items,
        raw_text=None,
        confidence=0.0,
        warnings=[],
    )

    return validate_result(result)
