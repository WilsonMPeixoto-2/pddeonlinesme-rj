# Fiscal document extraction POC

Local proof of concept for extracting structured fiscal data from XML, PDF and text files.

This module is intentionally isolated from the PDDE Online application. It does not write to Supabase, does not change the Demonstrativo generator, and does not expose a UI flow.

## Local setup

From the repository root:

```powershell
python -m venv .venv-fiscal
.\.venv-fiscal\Scripts\python.exe -m pip install --upgrade pip
.\.venv-fiscal\Scripts\python.exe -m pip install -r tools/fiscal-extraction/requirements.txt
```

On Unix-like shells:

```sh
python -m venv .venv-fiscal
. .venv-fiscal/bin/activate
python -m pip install --upgrade pip
python -m pip install -r tools/fiscal-extraction/requirements.txt
```

## Samples

Only synthetic samples are committed under `tools/fiscal-extraction/samples/`.
All committed names, CNPJs, access keys, school labels, supplier labels, item descriptions, dates and values are fictitious technical examples. They do not represent any real school, CEC, supplier, government entity, invoice or accountability record.

Real local fiscal samples, when used for private testing, must stay under:

```txt
.local/fiscal-samples/
```

Do not commit real fiscal PDFs, XMLs, images, receipts, invoices, or payment documents.

## Commands

```powershell
$env:PYTHONPATH="tools/fiscal-extraction/src"
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli extract tools/fiscal-extraction/samples/synthetic_nfe.xml
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli extract tools/fiscal-extraction/samples/synthetic_nf_text.txt
.\.venv-fiscal\Scripts\python.exe -m fiscal_extraction.cli batch tools/fiscal-extraction/samples
.\.venv-fiscal\Scripts\python.exe -m pytest tools/fiscal-extraction/tests
```

## Scope

The POC validates extraction mechanics only:

- XML is preferred when present.
- PDF text extraction is attempted with PyMuPDF and pdfplumber.
- Text parsing uses conservative heuristics.
- `source_type` distinguishes `xml`, `pdf_text` and `manual_text`; `pdf_ocr` and `image_ocr` are reserved for future OCR work.
- `status` is limited to `extraido` or `requer_revisao` in this POC. It never returns `confirmado`; confirmation requires future human review.
- All extracted values are suggestions that require human review before any official accounting use.
