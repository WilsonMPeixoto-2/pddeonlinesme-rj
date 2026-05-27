from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SourceType = Literal["xml", "pdf_text", "pdf_ocr", "image_ocr", "manual_text", "unknown"]
ExtractionStatus = Literal["extraido", "requer_revisao"]


class FiscalParty(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    cnpj: str | None = None


class FiscalItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str | None = None
    description: str | None = None
    quantity: Decimal | None = None
    unit_value: Decimal | None = None
    total_value: Decimal | None = None


class FiscalExtractionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_file: str | None = None
    source_type: SourceType = "unknown"
    document_type: str | None = None
    document_number: str | None = None
    access_key: str | None = None
    issue_date: date | None = None
    supplier: FiscalParty | None = None
    recipient: FiscalParty | None = None
    total_value: Decimal | None = None
    items: list[FiscalItem] = Field(default_factory=list)
    raw_text: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    warnings: list[str] = Field(default_factory=list)
    status: ExtractionStatus = "extraido"
