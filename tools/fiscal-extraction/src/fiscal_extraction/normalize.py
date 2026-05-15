from __future__ import annotations

import re
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from dateutil import parser as date_parser


def only_digits(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\D+", "", str(value))


def normalize_cnpj(value: Any) -> str | None:
    digits = only_digits(value)
    if len(digits) != 14:
        return None
    return digits


def is_valid_cnpj(value: Any) -> bool:
    digits = normalize_cnpj(value)
    if not digits or digits == digits[0] * 14:
        return False

    def calculate_digit(prefix: str) -> str:
        weights = list(range(len(prefix) - 7, 1, -1)) + list(range(9, 1, -1))
        total = sum(int(digit) * weight for digit, weight in zip(prefix, weights))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    first_digit = calculate_digit(digits[:12])
    second_digit = calculate_digit(digits[:12] + first_digit)
    return digits[-2:] == first_digit + second_digit


def parse_money_br(value: Any) -> Decimal | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    text = re.sub(r"[^\d,.\-]", "", text)
    if not text or text in {"-", ".", ","}:
        return None

    last_comma = text.rfind(",")
    last_dot = text.rfind(".")

    if last_comma >= 0 and last_dot >= 0:
        decimal_separator = "," if last_comma > last_dot else "."
    elif last_comma >= 0:
        decimal_separator = ","
    elif last_dot >= 0 and len(text) - last_dot - 1 == 2:
        decimal_separator = "."
    else:
        decimal_separator = ""

    if decimal_separator:
        thousands_separator = "." if decimal_separator == "," else ","
        normalized = text.replace(thousands_separator, "")
        normalized = normalized.replace(decimal_separator, ".")
    else:
        normalized = text.replace(".", "").replace(",", "")

    try:
        return Decimal(normalized)
    except InvalidOperation:
        return None


def normalize_date(value: Any) -> date | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    try:
        return date_parser.parse(text, dayfirst=True).date()
    except (ValueError, OverflowError, TypeError):
        return None


def clean_text(value: Any) -> str:
    if value is None:
        return ""

    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    cleaned_lines = []
    for line in text.split("\n"):
        cleaned = re.sub(r"[ \t\f\v]+", " ", line).strip()
        if cleaned:
            cleaned_lines.append(cleaned)
    return "\n".join(cleaned_lines)
