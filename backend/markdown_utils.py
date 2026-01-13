import re
import textwrap
from dataclasses import dataclass
from typing import List, Tuple

import bleach
import markdown as md


@dataclass(frozen=True)
class TocItem:
    level: int
    text: str
    id: str


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def _slugify_heading(text: str) -> str:
    """
    Create stable heading IDs for both latin and cyrillic.
    Mirrors the frontend logic that kept only word chars + spaces + Cyrillic.
    """
    clean = re.sub(r"[^\w\s\u0400-\u04FF]", "", text, flags=re.UNICODE).strip().lower()
    clean = re.sub(r"\s+", "-", clean)
    return clean or "section"


def _normalize_markdown(text: str) -> str:
    # init_db.py stores triple-quoted strings indented with code;
    # dedent prevents the markdown renderer from treating most text as code blocks.
    return textwrap.dedent(text or "").strip()


def inject_heading_ids_and_extract_toc(markdown_text: str) -> Tuple[str, List[TocItem]]:
    """
    Replace markdown headings with explicit <hN id="...">...</hN>
    and build a TOC (skipping code fences).
    """
    text = _normalize_markdown(markdown_text)
    if not text:
        return "", []

    lines = text.splitlines()
    out_lines: List[str] = []
    toc: List[TocItem] = []
    in_fence = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            in_fence = not in_fence
            out_lines.append(line)
            continue

        if not in_fence:
            m = _HEADING_RE.match(stripped)
            if m:
                hashes, heading_text = m.group(1), m.group(2).strip()
                level = len(hashes)
                heading_id = _slugify_heading(heading_text)
                toc.append(TocItem(level=level, text=heading_text, id=heading_id))
                # Use raw HTML heading so ids are guaranteed.
                out_lines.append(f'<h{level} id="{heading_id}">{heading_text}</h{level}>')
                continue

        out_lines.append(line)

    return "\n".join(out_lines), toc


def markdown_to_sanitized_html(markdown_text: str) -> Tuple[str, List[TocItem]]:
    """
    Returns (safe_html, toc).
    """
    with_ids, toc = inject_heading_ids_and_extract_toc(markdown_text)
    if not with_ids:
        return "", toc

    html = md.markdown(
        with_ids,
        extensions=[
            "fenced_code",
            "tables",
            "sane_lists",
            "smarty",
        ],
        output_format="html5",
    )

    # We intentionally avoid relying on Tailwind classes inside HTML content
    # because Tailwind won't see classes coming from the backend at build time.
    allowed_tags = set(bleach.sanitizer.ALLOWED_TAGS).union(
        {
            "p",
            "br",
            "hr",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "pre",
            "code",
            "blockquote",
            "ul",
            "ol",
            "li",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "span",
            "div",
        }
    )

    allowed_attrs = {
        "a": ["href", "title", "target", "rel"],
        # Keep language-* if present, but do not depend on it for styling.
        "code": ["class"],
        "pre": ["class"],
        # Allow ids for TOC navigation.
        "*": ["id"],
    }

    safe_html = bleach.clean(
        html,
        tags=list(allowed_tags),
        attributes=allowed_attrs,
        strip=True,
    )

    # Add rel/target to plain links (optional hardening).
    safe_html = bleach.linkify(
        safe_html,
        callbacks=[bleach.callbacks.nofollow, bleach.callbacks.target_blank],
        skip_tags=["pre", "code"],
    )

    return safe_html, toc

