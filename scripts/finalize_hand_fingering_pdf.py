from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import NameObject, RectangleObject, TextStringObject


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "output" / "pdf" / "trumpet-fingering-chart-hand.pdf"
TEMP_PATH = ROOT / "tmp" / "pdfs" / "trumpet-fingering-chart-hand-normalized.pdf"

A4_LANDSCAPE_WIDTH = 841.8897637795277
A4_LANDSCAPE_HEIGHT = 595.2755905511812


def main() -> None:
    if not PDF_PATH.exists():
        raise FileNotFoundError(PDF_PATH)

    reader = PdfReader(str(PDF_PATH))
    if len(reader.pages) != 1:
        raise ValueError(f"Expected one page, found {len(reader.pages)}")

    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    page = writer.pages[0]
    current_width = float(page.mediabox.width)
    current_height = float(page.mediabox.height)
    page.add_transformation(
        Transformation().scale(
            sx=A4_LANDSCAPE_WIDTH / current_width,
            sy=A4_LANDSCAPE_HEIGHT / current_height,
        )
    )
    exact_box = RectangleObject([0, 0, A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT])
    page.mediabox = exact_box
    page.cropbox = RectangleObject(exact_box)
    page.trimbox = RectangleObject(exact_box)
    page.bleedbox = RectangleObject(exact_box)

    writer.add_metadata(
        {
            "/Title": "손가락으로 익히는 B♭ 트럼펫 계이름 운지표",
            "/Subject": "기보음 F♯3-C6의 오선, 한국어 계이름, 오른손 손가락, 표준·대표 대체 운지",
            "/Author": "OpenAI",
            "/Keywords": "B-flat trumpet, fingering chart, solfege, 트럼펫, 계이름, 운지표",
            "/Creator": "HTML/SVG generator and Chromium",
        }
    )
    writer._root_object[NameObject("/Lang")] = TextStringObject("ko-KR")
    writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)

    TEMP_PATH.parent.mkdir(parents=True, exist_ok=True)
    with TEMP_PATH.open("wb") as handle:
        writer.write(handle)
    TEMP_PATH.replace(PDF_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
