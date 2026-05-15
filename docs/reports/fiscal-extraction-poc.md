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

## Next steps

Recommended next steps for a later controlled phase:

- test 10 to 20 real or anonymized fiscal documents locally;
- measure accuracy by field;
- add OCR only after baseline XML/PDF-text behavior is measured;
- define a database contract for documents, extraction attempts, confirmed expenses, and audit logs;
- design a review screen where the source document and suggested fields are visible together;
- keep official Demonstrativo generation dependent only on confirmed data.
