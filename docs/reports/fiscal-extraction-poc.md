# Fiscal extraction POC report

## Implemented

This proof of concept adds a local Python module under `tools/fiscal-extraction/` for extracting structured suggestions from synthetic fiscal documents.

Implemented capabilities:

- Pydantic models for parties, items, and extraction results.
- CNPJ normalization and real check-digit validation.
- Brazilian money parsing for common formats.
- Date normalization.
- NF-e XML parsing from a synthetic sample.
- Text/PDF extraction helpers using PyMuPDF and pdfplumber.
- Conservative fiscal-text heuristics for CNPJ, number, date, access key, supplier, recipient, and total value.
- Typer CLI for single-file extraction, text inspection, and local batch processing.
- Unit tests using only synthetic samples.
- More explicit `source_type` values: `xml`, `pdf_text`, `manual_text`, with `pdf_ocr` and `image_ocr` reserved for later.
- Extraction `status` limited to `extraido` or `requer_revisao`.
- Structural warnings for invalid NF-e access-key check digit, access key not matching supplier CNPJ, date outside the initial accepted range, non-positive total value, and item-total reconciliation mismatch.

## Libraries

The local POC dependencies are listed in `tools/fiscal-extraction/requirements.txt`:

- pymupdf
- pdfplumber
- pydantic
- python-dateutil
- pytest
- rich
- typer
- lxml
- xmltodict

## Validation commands

Python tests:

```powershell
$env:PYTHONPATH="tools/fiscal-extraction/src"
.\.venv-fiscal\Scripts\python.exe -m pytest tools/fiscal-extraction/tests
```

Example extraction commands:

```powershell
$env:PYTHONPATH="tools/fiscal-extraction/src"
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli extract tools/fiscal-extraction/samples/synthetic_nfe.xml
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli extract tools/fiscal-extraction/samples/synthetic_nf_text.txt --output table
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli batch tools/fiscal-extraction/samples
```

Repository validation, when available:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Limitations

- The committed samples are synthetic and do not prove real-world accuracy.
- All committed names, CNPJs, access keys, school labels, supplier labels, item descriptions, dates and values are fictitious technical examples. They do not represent any real school, CEC, supplier, government entity, invoice or accountability record.
- PDF parsing currently depends on text already present in the PDF.
- OCR for scanned PDFs and images is not implemented.
- Text heuristics can confuse supplier and recipient in weak layouts.
- NFS-e municipal layouts are not covered.
- No duplicate detection is implemented.
- No database persistence, storage upload, review UI, or official accounting write path exists in this POC.

## Explicit non-integration

This POC does not integrate with:

- Supabase Storage;
- Supabase Postgres;
- Supabase Auth/RLS;
- the PDDE Online UI;
- the Portal do Diretor;
- the Demonstrativo generator;
- Vercel deployment or environment variables.

## Alignment with validation protocol

PR #59 defines the validation protocol, field dictionary, sample-corpus protocol and governance notes. PR #58 remains only the local technical POC.

Fields already represented in the Pydantic model include `source_file`, `source_type`, `document_type`, `document_number`, `access_key`, `issue_date`, `supplier`, `recipient`, `total_value`, `items`, `raw_text`, `confidence`, `warnings` and `status`.

Future institutional fields remain outside this POC, including reviewer identity, review timestamp, file hash, storage path conventions, per-field confidence, audit-log transitions, duplicate detection and database persistence.

The POC never confirms official data. It can only return `extraido` or `requer_revisao`; `confirmado`, `rejeitado` and `substituido` are reserved states for a future human-review workflow. The current `confidence` is a simple heuristic score based on presence and structural validity of critical fields, not an automatic approval rule. Warnings that indicate structural risk force `status = "requer_revisao"`.

## Next steps

Recommended next steps for a later controlled phase:

- test 10 to 20 real or anonymized fiscal documents locally;
- measure accuracy by field;
- add OCR only after baseline XML/PDF-text behavior is measured;
- define a database contract for documents, extraction attempts, confirmed expenses, and audit logs;
- design a review screen where the source document and suggested fields are visible together;
- keep official Demonstrativo generation dependent only on confirmed data.
