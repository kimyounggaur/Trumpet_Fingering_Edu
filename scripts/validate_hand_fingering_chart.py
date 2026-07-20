from __future__ import annotations

import hashlib
import json
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "output" / "trumpet-fingering-chart-hand.svg"
HTML_PATH = ROOT / "output" / "trumpet-fingering-chart-hand.html"
PDF_PATH = ROOT / "output" / "pdf" / "trumpet-fingering-chart-hand.pdf"
PROMPT_PATH = ROOT / "output" / "trumpet-fingering-chart-vibe-coding-prompt-ko.md"


class ArtifactHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.note_buttons = 0
        self.svg_titles = 0
        self.svg_descs = 0
        self._svg_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        classes = set((attr.get("class") or "").split())
        if tag == "button" and "note-button" in classes:
            self.note_buttons += 1
        if tag == "svg":
            self._svg_depth += 1
        elif self._svg_depth and tag == "title":
            self.svg_titles += 1
        elif self._svg_depth and tag == "desc":
            self.svg_descs += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "svg":
            self._svg_depth -= 1


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def pitch_to_midi(pitch: str) -> int:
    match = re.fullmatch(r"([A-G])([♯♭]?)(\d)", pitch)
    if not match:
        raise ValueError(pitch)
    letter, accidental, octave_text = match.groups()
    semitone = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[letter]
    if accidental == "♯":
        semitone += 1
    elif accidental == "♭":
        semitone -= 1
    return (int(octave_text) + 1) * 12 + semitone


def read_notes_from_html(html_text: str) -> list[dict]:
    match = re.search(r"const NOTES=(\[.*?\]);\s*const FINGER_NAMES", html_text, re.S)
    if not match:
        raise AssertionError("NOTES JSON not found in HTML")
    return json.loads(match.group(1))


def validate_notes(notes: list[dict]) -> dict:
    assert len(notes) == 31
    assert [note["midi"] for note in notes] == list(range(54, 85))
    for note in notes:
        assert note["valves"] == sorted(set(note["valves"]))
        assert set(note["valves"]) <= {1, 2, 3}
        for alt in note["alts"]:
            assert alt == sorted(set(alt))
            assert set(alt) <= {1, 2, 3}
        assert pitch_to_midi(note["concert"]) == note["midi"] - 2
    by_midi = {note["midi"]: note for note in notes}
    assert by_midi[61]["valves"] == [1, 2, 3]
    assert by_midi[62]["valves"] == [1, 3]
    assert by_midi[62]["alts"] == []
    assert by_midi[73]["valves"] == [1, 2]
    assert by_midi[76]["valves"] == []
    assert by_midi[76]["alts"] == [[1, 2], [3]]
    assert by_midi[78]["alts"] == []
    alternate_notes = sum(bool(note["alts"]) for note in notes)
    alternate_combinations = sum(len(note["alts"]) for note in notes)
    assert alternate_notes == 10
    assert alternate_combinations == 11
    return {
        "count": len(notes),
        "midi_range": [notes[0]["midi"], notes[-1]["midi"]],
        "alternate_notes": alternate_notes,
        "alternate_combinations": alternate_combinations,
    }


def validate_svg() -> dict:
    tree = ET.parse(SVG_PATH)
    root = tree.getroot()
    assert root.attrib["viewBox"] == "0 0 1600 1131"
    assert root.attrib["width"] == "297mm"
    assert root.attrib["height"] == "210mm"
    elements = list(root.iter())
    ids = [element.attrib["id"] for element in elements if "id" in element.attrib]
    assert len(ids) == len(set(ids))
    note_cells = [element for element in elements if "note-cell" in element.attrib.get("class", "").split()]
    mini_hands = [element for element in elements if "mini-hand" in element.attrib.get("class", "").split()]
    assert len(note_cells) == 31
    assert len(mini_hands) == 31
    assert not any(element.tag.endswith("image") for element in elements)
    for element in elements:
        for name, value in element.attrib.items():
            if name.endswith("href"):
                assert not re.match(r"https?://", value)
    tags = {element.tag.rsplit("}", 1)[-1] for element in elements}
    assert {"title", "desc", "metadata"} <= tags
    return {
        "elements": len(elements),
        "ids": len(ids),
        "note_cells": len(note_cells),
        "mini_hands": len(mini_hands),
        "raster_images": 0,
    }


def validate_html() -> tuple[dict, list[dict]]:
    text = HTML_PATH.read_text(encoding="utf-8")
    parser = ArtifactHTMLParser()
    parser.feed(text)
    assert parser.note_buttons == 31
    assert parser.svg_titles >= 2
    assert parser.svg_descs >= 2
    assert '<html lang="ko">' in text
    assert '@media(prefers-reduced-motion:reduce)' in text
    assert 'let selectedIndex=8;' in text
    external_urls = [
        url
        for url in re.findall(r"https?://[^\"'<>\s]+", text)
        if url != "http://www.w3.org/2000/svg"
    ]
    assert external_urls == []
    notes = read_notes_from_html(text)
    return (
        {
            "note_buttons": parser.note_buttons,
            "svg_titles": parser.svg_titles,
            "svg_descs": parser.svg_descs,
            "initial_note_index": 8,
            "external_requests": 0,
        },
        notes,
    )


def collect_pdf_images(resource_object, found: list[dict], seen: set[int]) -> None:
    if resource_object is None:
        return
    resources = resource_object.get_object()
    xobjects = resources.get("/XObject")
    if not xobjects:
        return
    xobjects = xobjects.get_object()
    for _, reference in xobjects.items():
        object_id = getattr(reference, "idnum", None)
        if object_id is not None and object_id in seen:
            continue
        if object_id is not None:
            seen.add(object_id)
        item = reference.get_object()
        subtype = item.get("/Subtype")
        if subtype == "/Image":
            found.append({"width": int(item.get("/Width", 0)), "height": int(item.get("/Height", 0))})
        elif subtype == "/Form":
            collect_pdf_images(item.get("/Resources"), found, seen)


def validate_pdf() -> dict:
    reader = PdfReader(str(PDF_PATH))
    assert len(reader.pages) == 1
    page = reader.pages[0]
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    assert abs(width - 841.8898) <= 0.5
    assert abs(height - 595.2756) <= 0.5
    text = page.extract_text() or ""
    for required in ("손가락으로 익히는", "C4", "C6", "계이름"):
        assert required in text, f"Missing PDF text: {required}"
    images: list[dict] = []
    collect_pdf_images(page.get("/Resources"), images, set())
    # Filters may rasterize small hand shadows, but the complete A4 page must
    # never be represented as one full-page bitmap.
    assert not any(image["width"] >= 1500 and image["height"] >= 1000 for image in images)
    return {
        "pages": 1,
        "page_size_pt": [round(width, 4), round(height, 4)],
        "extracted_text_chars": len(text),
        "image_xobjects": images,
        "full_page_raster": False,
    }


def main() -> None:
    for path in (SVG_PATH, HTML_PATH, PDF_PATH, PROMPT_PATH):
        assert path.exists() and path.stat().st_size > 0, path

    html_result, notes = validate_html()
    result = {
        "data": validate_notes(notes),
        "svg": validate_svg(),
        "html": html_result,
        "pdf": validate_pdf(),
        "files": {
            path.name: {"bytes": path.stat().st_size, "sha256": sha256(path)}
            for path in (PROMPT_PATH, HTML_PATH, SVG_PATH, PDF_PATH)
        },
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
