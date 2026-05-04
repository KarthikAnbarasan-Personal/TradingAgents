from __future__ import annotations

import html
import re
from io import BytesIO

import markdown
from xhtml2pdf import pisa

_MAX_MARKDOWN_CHARS = 2_500_000


def _strip_control_chars(text: str) -> str:
    return "".join(ch for ch in text if ord(ch) >= 32 or ch in "\n\r\t")


def markdown_to_pdf_bytes(md_text: str, document_title: str) -> bytes:
    """Render Markdown to a PDF byte string (A4, server-side; no browser canvas)."""
    if len(md_text) > _MAX_MARKDOWN_CHARS:
        raise ValueError("markdown exceeds size limit")

    md_text = _strip_control_chars(md_text)
    safe_title = html.escape(document_title.strip() or "Report", quote=True)

    html_body = markdown.markdown(
        md_text,
        extensions=[
            "markdown.extensions.tables",
            "markdown.extensions.fenced_code",
            "markdown.extensions.nl2br",
        ],
    )

    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>{safe_title}</title>
<style>
    @page {{ size: A4; margin: 18mm; }}
    body {{ font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.45; color: #111; }}
    h1 {{ font-size: 18pt; margin: 0 0 12pt; border-bottom: 1px solid #333; padding-bottom: 6pt; }}
    h2 {{ font-size: 14pt; margin: 14pt 0 8pt; }}
    h3 {{ font-size: 12pt; margin: 12pt 0 6pt; }}
    h4 {{ font-size: 11pt; margin: 10pt 0 5pt; }}
    pre {{ font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f5f5f5; padding: 8pt;
           border: 1px solid #ccc; white-space: pre-wrap; word-wrap: break-word; }}
    code {{ font-family: Consolas, monospace; font-size: 9pt; background: #eee; padding: 1px 4px; }}
    pre code {{ background: transparent; padding: 0; border: none; }}
    table {{ border-collapse: collapse; width: 100%; margin: 8pt 0; }}
    th, td {{ border: 1px solid #999; padding: 4pt 6pt; vertical-align: top; }}
    th {{ background: #eee; }}
    blockquote {{ margin: 8pt 0; padding-left: 10pt; border-left: 3px solid #999; color: #333; }}
    a {{ color: #1d4ed8; }}
    ul, ol {{ margin: 6pt 0 6pt 18pt; }}
    hr {{ border: none; border-top: 1px solid #ccc; margin: 12pt 0; }}
</style>
</head>
<body>
<h1>{safe_title}</h1>
{html_body}
</body>
</html>"""

    buf = BytesIO()
    status = pisa.CreatePDF(src=full_html, dest=buf, encoding="utf-8")
    if status.err:
        raise RuntimeError(f"PDF engine reported {status.err} error(s) while rendering")
    out = buf.getvalue()
    if len(out) < 100:
        raise RuntimeError("PDF output was unexpectedly small")
    return out


def safe_pdf_filename(stem: str) -> str:
    stem = stem.strip() or "report"
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem)
    return stem[:160] + ".pdf"
