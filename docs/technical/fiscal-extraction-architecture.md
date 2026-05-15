# Fiscal document extraction architecture

## Objective

The fiscal document extraction module is a controlled proof of concept for a future document-to-data flow:

```txt
nota fiscal / XML / PDF / imagem
-> extracao estruturada
-> validacao humana
-> dados confirmados
-> prestacao de contas e demonstrativos
```

The current POC is local-only. It validates extraction mechanics without changing Supabase, the frontend, Auth/RLS, Vercel, or the current Demonstrativo generation path.

## Human validation is mandatory

Extracted data must be treated as suggestions. Fiscal documents can have OCR errors, ambiguous layouts, missing fields, duplicated values, rounding differences, and provider-specific formats.

For PDDE accountability, fields such as CNPJ, document number, issue date, access key, and total value cannot become official records without explicit review and correction by a responsible user.

The intended future flow is:

```txt
arquivo enviado
-> extracao automatica
-> campos sugeridos
-> servidor confere/corrige
-> dados confirmados
-> registros oficiais
-> demonstrativo e relatorios
```

## Future architecture

A production version should keep storage, extraction, review, and document generation separated:

```txt
Supabase Storage
  guarda arquivos fiscais enviados

Supabase Postgres
  guarda documentos, extracoes, dados confirmados e auditoria

Backend Python/Node
  executa parsers, OCR, validacoes e filas de processamento

Frontend
  apresenta documento original e campos sugeridos para revisao humana

Gerador Excel
  consome apenas dados confirmados
```

Heavy parsing, OCR, and retries should run in a backend worker or container runtime, not in the browser. Supabase Edge Functions can orchestrate small operations, but PDF/OCR workloads are better isolated in a worker service when they grow.

## Why not integrate with the Demonstrativo now

The Demonstrativo is an official accounting artifact. Connecting raw extraction directly to it would create a high-risk path:

```txt
nota fiscal -> parser -> demonstrativo oficial
```

The safe path is:

```txt
nota fiscal -> parser -> revisao humana -> dado confirmado -> demonstrativo oficial
```

This POC therefore stops at local extraction output. It does not write `despesas`, does not create migrations, and does not alter the workbook generator.

## Minimum fields

The initial extraction contract focuses on:

- `source_file`
- `source_type`
- `document_type`
- `document_number`
- `access_key`
- `issue_date`
- `supplier.cnpj`
- `supplier.name`
- `recipient.cnpj`
- `recipient.name`
- `total_value`
- `items`
- `raw_text`
- `confidence`
- `warnings`
- `status`

For this POC, `source_type` is limited to `xml`, `pdf_text`, `manual_text` and reserved future values `pdf_ocr`, `image_ocr`, `unknown`. The POC only emits `status = "extraido"` or `status = "requer_revisao"`. It must never emit `status = "confirmado"` because confirmation is a future human-review action.

## Extraction strategy

XML is the preferred source when available because it is structured and avoids OCR. PDF with selectable text is second, using PyMuPDF and pdfplumber. Scanned PDFs and images require OCR and are intentionally outside this first local implementation.

The `confidence` value is a transparent initial heuristic, not a decision engine. It considers valid supplier CNPJ, valid recipient CNPJ when present, document number, issue date, total value, access key for NF-e, and supplier name. Any official use still requires human validation.

## Risks

- OCR can misread CNPJ, monetary values, and access keys.
- PDF text order may not match visual order.
- NFS-e layouts vary by municipality.
- Receipts and coupons may not expose all fiscal fields.
- Supplier and recipient roles can be inverted in weak text layouts.
- Duplicate documents need separate business validation.
- Real documents can contain sensitive fiscal and personal data.

## Future acceptance criteria

Before integration with official records, a later phase should prove:

- extraction accuracy by field over a representative sample set;
- false-positive and false-negative rates for CNPJ, total value, date, and document number;
- a review UI that always shows the source document beside suggested fields;
- explicit confirmation audit trail;
- duplicate detection by access key, supplier, number, date, and value;
- storage policies and retention rules reviewed before real uploads;
- no automatic write to Demonstrativo without confirmed data.
