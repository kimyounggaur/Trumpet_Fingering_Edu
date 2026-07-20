from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
PDF_OUTPUT = OUTPUT / "pdf"


NOTES = [
    {"midi": 54, "name": "F♯3", "enh": "G♭3", "solfege": "파♯ / 솔♭", "valves": [1, 2, 3], "alts": [], "concert": "E3"},
    {"midi": 55, "name": "G3", "enh": None, "solfege": "솔", "valves": [1, 3], "alts": [], "concert": "F3"},
    {"midi": 56, "name": "G♯3", "enh": "A♭3", "solfege": "솔♯ / 라♭", "valves": [2, 3], "alts": [], "concert": "G♭3"},
    {"midi": 57, "name": "A3", "enh": None, "solfege": "라", "valves": [1, 2], "alts": [[3]], "concert": "G3"},
    {"midi": 58, "name": "A♯3", "enh": "B♭3", "solfege": "라♯ / 시♭", "valves": [1], "alts": [], "concert": "A♭3"},
    {"midi": 59, "name": "B3", "enh": None, "solfege": "시", "valves": [2], "alts": [], "concert": "A3"},
    {"midi": 60, "name": "C4", "enh": None, "solfege": "도", "valves": [], "alts": [], "concert": "B♭3"},
    {"midi": 61, "name": "C♯4", "enh": "D♭4", "solfege": "도♯ / 레♭", "valves": [1, 2, 3], "alts": [], "concert": "B3"},
    {"midi": 62, "name": "D4", "enh": None, "solfege": "레", "valves": [1, 3], "alts": [], "concert": "C4"},
    {"midi": 63, "name": "D♯4", "enh": "E♭4", "solfege": "레♯ / 미♭", "valves": [2, 3], "alts": [], "concert": "D♭4"},
    {"midi": 64, "name": "E4", "enh": None, "solfege": "미", "valves": [1, 2], "alts": [[3]], "concert": "D4"},
    {"midi": 65, "name": "F4", "enh": None, "solfege": "파", "valves": [1], "alts": [], "concert": "E♭4"},
    {"midi": 66, "name": "F♯4", "enh": "G♭4", "solfege": "파♯ / 솔♭", "valves": [2], "alts": [], "concert": "E4"},
    {"midi": 67, "name": "G4", "enh": None, "solfege": "솔", "valves": [], "alts": [[1, 3]], "concert": "F4"},
    {"midi": 68, "name": "G♯4", "enh": "A♭4", "solfege": "솔♯ / 라♭", "valves": [2, 3], "alts": [], "concert": "G♭4"},
    {"midi": 69, "name": "A4", "enh": None, "solfege": "라", "valves": [1, 2], "alts": [[3]], "concert": "G4"},
    {"midi": 70, "name": "A♯4", "enh": "B♭4", "solfege": "라♯ / 시♭", "valves": [1], "alts": [], "concert": "A♭4"},
    {"midi": 71, "name": "B4", "enh": None, "solfege": "시", "valves": [2], "alts": [], "concert": "A4"},
    {"midi": 72, "name": "C5", "enh": None, "solfege": "도", "valves": [], "alts": [[2, 3]], "concert": "B♭4"},
    {"midi": 73, "name": "C♯5", "enh": "D♭5", "solfege": "도♯ / 레♭", "valves": [1, 2], "alts": [], "concert": "B4"},
    {"midi": 74, "name": "D5", "enh": None, "solfege": "레", "valves": [1], "alts": [[1, 3]], "concert": "C5"},
    {"midi": 75, "name": "D♯5", "enh": "E♭5", "solfege": "레♯ / 미♭", "valves": [2], "alts": [[2, 3]], "concert": "D♭5"},
    {"midi": 76, "name": "E5", "enh": None, "solfege": "미", "valves": [], "alts": [[1, 2], [3]], "concert": "D5"},
    {"midi": 77, "name": "F5", "enh": None, "solfege": "파", "valves": [1], "alts": [], "concert": "E♭5"},
    {"midi": 78, "name": "F♯5", "enh": "G♭5", "solfege": "파♯ / 솔♭", "valves": [2], "alts": [], "concert": "E5"},
    {"midi": 79, "name": "G5", "enh": None, "solfege": "솔", "valves": [], "alts": [[1, 3]], "concert": "F5"},
    {"midi": 80, "name": "G♯5", "enh": "A♭5", "solfege": "솔♯ / 라♭", "valves": [2, 3], "alts": [], "concert": "G♭5"},
    {"midi": 81, "name": "A5", "enh": None, "solfege": "라", "valves": [1, 2], "alts": [[3]], "concert": "G5"},
    {"midi": 82, "name": "A♯5", "enh": "B♭5", "solfege": "라♯ / 시♭", "valves": [1], "alts": [], "concert": "A♭5"},
    {"midi": 83, "name": "B5", "enh": None, "solfege": "시", "valves": [2], "alts": [], "concert": "A5"},
    {"midi": 84, "name": "C6", "enh": None, "solfege": "도", "valves": [], "alts": [], "concert": "B♭5"},
]


LETTER_INDEX = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
RANGES = [
    ("낮은 음역", "LOW REGISTER", "F♯3-F4", 0, 12),
    ("중간 음역", "MIDDLE REGISTER", "F♯4-F5", 12, 24),
    ("높은 음역", "HIGH REGISTER", "F♯5-C6", 24, 31),
]


def display_name(note: dict) -> str:
    return note["name"] + (f" / {note['enh']}" if note["enh"] else "")


def valve_text(valves: list[int]) -> str:
    return "-".join(str(v) for v in valves) if valves else "0 (개방)"


def alt_text(alts: list[list[int]]) -> str:
    return " / ".join(valve_text(alt).replace(" (개방)", "") for alt in alts)


def xml_text(value: object) -> str:
    return html.escape(str(value), quote=True)


def mini_hand(cx: float, top: float, valves: list[int]) -> str:
    """Compact hand-and-valve pictogram used for every note in the print chart."""
    bits = [
        f'<g class="mini-hand" transform="translate({cx - 44:.2f},{top:.2f})" role="img" aria-label="오른손 운지 {xml_text(valve_text(valves))}">',
        '<path d="M6 8 Q20 -1 48 1 Q72 2 84 15 L80 31 Q56 25 28 29 Q13 30 5 23 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="1.4"/>',
        '<path d="M67 6 Q82 3 89 12 L86 25 Q75 20 64 18 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="1.2"/>',
    ]
    finger_xs = [20, 44, 68]
    for valve, x in zip((1, 2, 3), finger_xs):
        pressed = valve in valves
        offset = 6 if pressed else 0
        bits.extend(
            [
                f'<g transform="translate(0,{offset})">',
                f'<rect x="{x - 6}" y="17" width="12" height="30" rx="6" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="1.2"/>',
                f'<path d="M{x - 4} 29 Q{x} 31 {x + 4} 29" fill="none" stroke="#B98163" stroke-width="1" stroke-linecap="round"/>',
                f'<ellipse cx="{x}" cy="42" rx="3.8" ry="2.4" fill="#F9E4D2" stroke="#C89578" stroke-width=".7"/>',
                '</g>',
            ]
        )
    for valve, x in zip((1, 2, 3), finger_xs):
        pressed = valve in valves
        cap_y = 54 if pressed else 48
        fill = "#C62828" if pressed else "#FFFDFC"
        stroke = "#981B1B" if pressed else "#8F9AA8"
        text_fill = "#FFFFFF" if pressed else "#263C58"
        bits.extend(
            [
                f'<rect x="{x - 7}" y="{cap_y + 5}" width="14" height="16" rx="4" fill="url(#chart-brass)" stroke="#7A5B17" stroke-width="1"/>',
                f'<circle cx="{x}" cy="{cap_y}" r="8" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>',
                f'<text x="{x}" y="{cap_y + 3.5}" class="mini-num" text-anchor="middle" fill="{text_fill}">{valve}</text>',
            ]
        )
    bits.append('</g>')
    return "".join(bits)


def hand_legend() -> str:
    return r'''
    <g id="chart-hand-guide" transform="translate(930,24)" role="img" aria-label="오른손 검지는 1번, 중지는 2번, 약지는 3번 밸브를 누릅니다">
      <text x="0" y="20" class="guide-title">오른손 손가락과 밸브 위치</text>
      <text x="574" y="20" class="guide-caption" text-anchor="end">벨 ← 3 · 2 · 1 → 마우스피스</text>
      <path d="M18 139 H455" stroke="url(#chart-brass)" stroke-width="18" stroke-linecap="round"/>
      <path d="M455 139 H558" stroke="#D6B24E" stroke-width="10" stroke-linecap="round"/>
      <path d="M558 132 L586 139 L558 146 Z" fill="#D6B24E"/>
      <g fill="url(#chart-brass)" stroke="#765817" stroke-width="2">
        <rect x="101" y="110" width="34" height="70" rx="7"/><rect x="196" y="110" width="34" height="70" rx="7"/><rect x="291" y="110" width="34" height="70" rx="7"/>
      </g>
      <g fill="#FFFDF8" stroke="#314152" stroke-width="3">
        <circle cx="118" cy="101" r="17"/><circle cx="213" cy="101" r="17"/><circle cx="308" cy="101" r="17"/>
      </g>
      <g filter="url(#chart-hand-shadow)">
        <path d="M570 42 Q526 23 476 31 Q422 40 381 64 Q357 79 360 111 Q365 143 395 162 Q444 181 494 161 Q535 145 570 123 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="2.2"/>
        <path d="M570 42 Q605 35 632 47 L640 125 Q607 128 570 123 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="2.2"/>
        <path d="M393 144 Q375 166 386 185 Q399 196 411 183 Q417 166 418 151 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="2"/>
        <path d="M493 155 Q477 178 451 188 Q427 195 411 187 Q403 181 408 174 Q439 174 471 148 Z" fill="url(#chart-skin)" stroke="#9B684B" stroke-width="2"/>
        <g fill="none" stroke-linecap="round">
          <path d="M458 72 Q390 66 315 93 Q303 98 308 108" stroke="#9B684B" stroke-width="34"/>
          <path d="M458 72 Q390 66 315 93 Q303 98 308 108" stroke="url(#chart-skin)" stroke-width="29"/>
          <path d="M431 56 Q330 45 220 88 Q205 94 213 104" stroke="#9B684B" stroke-width="35"/>
          <path d="M431 56 Q330 45 220 88 Q205 94 213 104" stroke="url(#chart-skin)" stroke-width="30"/>
          <path d="M407 69 Q290 58 129 88 Q112 92 118 104" stroke="#9B684B" stroke-width="34"/>
          <path d="M407 69 Q290 58 129 88 Q112 92 118 104" stroke="url(#chart-skin)" stroke-width="29"/>
          <path d="M454 67 Q392 63 318 91" stroke="#FFF2E7" stroke-opacity=".48" stroke-width="4"/>
          <path d="M426 51 Q331 43 224 84" stroke="#FFF2E7" stroke-opacity=".48" stroke-width="4"/>
          <path d="M402 64 Q289 54 133 84" stroke="#FFF2E7" stroke-opacity=".48" stroke-width="4"/>
        </g>
        <g fill="#FBE9DA" stroke="#C69374" stroke-width="1.2">
          <ellipse cx="309" cy="104" rx="10" ry="5" transform="rotate(-14 309 104)"/>
          <ellipse cx="213" cy="101" rx="10" ry="5" transform="rotate(-10 213 101)"/>
          <ellipse cx="118" cy="101" rx="10" ry="5" transform="rotate(-7 118 101)"/>
        </g>
        <g fill="none" stroke="#B78062" stroke-width="1.5" stroke-linecap="round">
          <path d="M359 83 q8 4 16 0"/><path d="M327 71 q8 4 16 0"/><path d="M284 73 q8 4 16 0"/>
          <path d="M267 84 q8 4 16 0"/><path d="M235 73 q8 4 16 0"/><path d="M185 79 q8 4 16 0"/>
        </g>
      </g>
      <g class="guide-label" text-anchor="middle">
        <text x="118" y="184">3 · 약지</text><text x="213" y="184">2 · 중지</text><text x="308" y="184">1 · 검지</text>
      </g>
    </g>'''


def note_diatonic_index(note: dict) -> int:
    return int(note["name"][-1]) * 7 + LETTER_INDEX[note["name"][0]]


def staff_note(note: dict, cx: float, staff_bottom: float) -> str:
    # Treble clef bottom line E4 = index 30; one staff step = 5 px.
    idx = note_diatonic_index(note)
    y = staff_bottom - (idx - 30) * 5
    bits: list[str] = []
    if idx < 30:
        # Ledger lines at C4, A3, F3 ... (even diatonic offsets below E4).
        line_idx = 28
        while line_idx >= idx:
            ly = staff_bottom - (line_idx - 30) * 5
            bits.append(f'<line x1="{cx - 17:.2f}" y1="{ly:.2f}" x2="{cx + 17:.2f}" y2="{ly:.2f}" class="ledger"/>')
            line_idx -= 2
    elif idx > 38:
        # Ledger lines above treble staff: A5, C6 ...
        line_idx = 40
        while line_idx <= idx:
            ly = staff_bottom - (line_idx - 30) * 5
            bits.append(f'<line x1="{cx - 17:.2f}" y1="{ly:.2f}" x2="{cx + 17:.2f}" y2="{ly:.2f}" class="ledger"/>')
            line_idx += 2
    if "♯" in note["name"]:
        bits.append(f'<text x="{cx - 18:.2f}" y="{y + 6:.2f}" class="accidental" text-anchor="middle">♯</text>')
    bits.append(f'<ellipse cx="{cx:.2f}" cy="{y:.2f}" rx="10" ry="6.2" transform="rotate(-16 {cx:.2f} {y:.2f})" class="notehead"/>')
    return "".join(bits)


def chart_row(row_y: float, label: str, english: str, pitch_range: str, start: int, end: int) -> str:
    row_notes = NOTES[start:end]
    x0, x1 = 135.0, 1540.0
    col_w = (x1 - x0) / len(row_notes)
    # Shift each staff vertically so extreme ledger-line notes never collide
    # with the pitch/solfege labels or the range pill.
    staff_bottom = row_y + {0: 82, 12: 92, 24: 108}[start]
    out = [
        f'<g id="chart-range-{start}" aria-label="{xml_text(label)} {xml_text(pitch_range)}">',
        f'<rect x="38" y="{row_y}" width="1524" height="260" rx="18" class="range-bg"/>',
        f'<path d="M56 {row_y + 4} H1544" class="range-accent"/>',
        f'<rect x="54" y="{row_y + 12}" width="206" height="31" rx="15.5" class="range-pill"/>',
        f'<text x="157" y="{row_y + 33}" class="range-title" text-anchor="middle">{xml_text(label)} · {xml_text(pitch_range)}</text>',
        f'<text x="275" y="{row_y + 33}" class="range-en">{xml_text(english)}</text>',
    ]
    for i in range(5):
        y = staff_bottom - 40 + i * 10
        out.append(f'<line x1="104" y1="{y}" x2="1544" y2="{y}" class="staff"/>')
    # A compact vector treble-clef silhouette; avoids relying on a music font.
    out.append(
        f'<path transform="translate(61,{row_y + 98}) scale(.047,-.047)" class="clef" d="M376 415C374 427 376 428 382 434C490 535 572 662 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C153 432 0 289 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 750 435 660 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z"/>'
    )
    for j, note in enumerate(row_notes):
        cx = x0 + col_w * (j + 0.5)
        if j:
            divider_x = x0 + col_w * j
            out.append(f'<line x1="{divider_x:.2f}" y1="{row_y + 48}" x2="{divider_x:.2f}" y2="{row_y + 250}" class="divider"/>')
        name = display_name(note)
        label_size = "note-name compact" if len(name) > 7 else "note-name"
        fingering = valve_text(note["valves"])
        aria = f"{name}, 계이름 {note['solfege']}, 운지 {fingering}"
        if note["alts"]:
            aria += f", 대체 운지 {alt_text(note['alts'])}"
        out.extend(
            [
                f'<g class="note-cell" role="group" aria-label="{xml_text(aria)}">',
                staff_note(note, cx, staff_bottom),
                f'<text x="{cx:.2f}" y="{row_y + 126}" class="{label_size}" text-anchor="middle">{xml_text(name)}</text>',
                f'<text x="{cx:.2f}" y="{row_y + 148}" class="solfege" text-anchor="middle">{xml_text(note["solfege"])}</text>',
                mini_hand(cx, row_y + 153, note["valves"]),
                f'<text x="{cx:.2f}" y="{row_y + 233}" class="fingering" text-anchor="middle">{xml_text(fingering)}</text>',
            ]
        )
        if note["alts"]:
            out.extend(
                [
                    f'<rect x="{cx - 44:.2f}" y="{row_y + 238}" width="88" height="18" rx="9" class="alt-pill"/>',
                    f'<text x="{cx:.2f}" y="{row_y + 251}" class="alt-text" text-anchor="middle">대체 {xml_text(alt_text(note["alts"]))}</text>',
                ]
            )
        else:
            out.append(f'<text x="{cx:.2f}" y="{row_y + 251}" class="standard-text" text-anchor="middle">표준 운지</text>')
        out.append('</g>')
    out.append('</g>')
    return "".join(out)


def build_chart_svg(include_xml: bool = True) -> str:
    prefix = '<?xml version="1.0" encoding="UTF-8"?>\n' if include_xml else ""
    rows = "".join(
        chart_row(208 + i * 274, label, english, pitch_range, start, end)
        for i, (label, english, pitch_range, start, end) in enumerate(RANGES)
    )
    return prefix + f'''<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 1600 1131" role="img" aria-labelledby="chart-title chart-desc">
  <title id="chart-title">손가락으로 익히는 B♭ 트럼펫 계이름 운지표</title>
  <desc id="chart-desc">기보음 F♯3부터 C6까지 31개 음의 오선 위치, 한국어 계이름, 오른손 손가락, 세 밸브 주운지와 대표 대체 운지를 보여주는 A4 가로형 차트입니다.</desc>
  <metadata>Based on local 01 Source fingering datasets; alternate fingerings cross-checked against Yamaha's official fingering chart. Treble-clef outline derived from Bravura, copyright Steinberg Media Technologies GmbH, licensed under SIL OFL 1.1.</metadata>
  <defs>
    <linearGradient id="chart-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5DE8C"/><stop offset=".45" stop-color="#CAA22F"/><stop offset="1" stop-color="#8B681B"/></linearGradient>
    <linearGradient id="chart-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7D1"/><stop offset=".55" stop-color="#F1C59F"/><stop offset="1" stop-color="#D99A70"/></linearGradient>
    <filter id="chart-hand-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#14243B" flood-opacity=".18"/></filter>
    <style><![CDATA[
      .ko, text {{ font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans CJK KR",Arial,sans-serif; }}
      .title {{ font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans CJK KR",Arial,sans-serif; font-size:45px; font-weight:700; fill:#13243A; letter-spacing:-1px; }}
      .subtitle {{ font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans CJK KR",Arial,sans-serif; font-size:19px; font-weight:400; fill:#586579; }}
      .eyebrow {{ font-size:14px; font-weight:700; fill:#8A691B; letter-spacing:1.2px; }}
      .badge {{ fill:#F6ECD0; stroke:#C9972B; stroke-width:1.2; }}
      .badge-text {{ font-size:13px; font-weight:700; fill:#614914; }}
      .legend {{ font-size:14px; font-weight:600; fill:#26364B; }}
      .legend-muted {{ font-size:12.5px; font-weight:400; fill:#697487; }}
      .guide-title {{ font-size:16px; font-weight:700; fill:#14243B; }}
      .guide-caption {{ font-size:12px; font-weight:500; fill:#687486; }}
      .guide-label {{ font-size:13px; font-weight:700; fill:#14243B; }}
      .range-bg {{ fill:#F7F9FC; stroke:#CFD7E3; stroke-width:1.4; }}
      .range-accent {{ fill:none; stroke:#C9972B; stroke-width:5; stroke-linecap:round; }}
      .range-pill {{ fill:#F6ECD0; stroke:#C9972B; stroke-width:1.1; }}
      .range-title {{ font-size:14px; font-weight:700; fill:#14243B; }}
      .range-en {{ font-size:11px; font-weight:700; fill:#7B8492; letter-spacing:1.4px; }}
      .staff {{ stroke:#293443; stroke-width:1.35; }}
      .ledger {{ stroke:#293443; stroke-width:1.6; }}
      .clef {{ fill:#14243B; }}
      .notehead {{ fill:#14243B; }}
      .accidental {{ font-size:19px; font-weight:500; fill:#14243B; }}
      .divider {{ stroke:#D7DDE6; stroke-width:1; stroke-dasharray:2 4; }}
      .note-name {{ font-size:14px; font-weight:700; fill:#14243B; }}
      .note-name.compact {{ font-size:12.5px; }}
      .solfege {{ font-size:17px; font-weight:700; fill:#173B38; }}
      .fingering {{ font-size:14px; font-weight:700; fill:#14243B; }}
      .mini-num {{ font-size:9px; font-weight:700; }}
      .alt-pill {{ fill:#FFF3D4; stroke:#C9972B; stroke-width:1; }}
      .alt-text {{ font-size:10.5px; font-weight:700; fill:#795508; }}
      .standard-text {{ font-size:10.5px; font-weight:400; fill:#9AA3AF; }}
      .footer-head {{ font-size:14px; font-weight:700; fill:#14243B; }}
      .footer-text {{ font-size:12px; font-weight:400; fill:#647083; }}
    ]]></style>
  </defs>
  <rect width="1600" height="1131" fill="#FFFFFF"/>
  <rect width="1600" height="14" fill="#C9972B"/><rect y="14" width="1600" height="4" fill="#173B38"/>
  <text x="48" y="52" class="eyebrow">VISUAL FINGERING · WRITTEN PITCH · FIXED-DO</text>
  <text x="48" y="99" class="title">손가락으로 익히는 B♭ 트럼펫 계이름 운지표</text>
  <text x="51" y="130" class="subtitle">기보음 F♯3-C6 · 31음 · 오른손 실제 손가락 대응 · 표준 주운지 + 대표 대체 운지</text>
  <g transform="translate(48,149)">
    <rect x="0" y="0" width="122" height="28" rx="14" class="badge"/><text x="61" y="19" text-anchor="middle" class="badge-text">A4 LANDSCAPE</text>
    <rect x="132" y="0" width="118" height="28" rx="14" class="badge"/><text x="191" y="19" text-anchor="middle" class="badge-text">B♭ TRUMPET</text>
    <circle cx="276" cy="14" r="8" fill="#C62828" stroke="#981B1B" stroke-width="1.4"/><text x="291" y="19" class="legend">누름</text>
    <circle cx="345" cy="14" r="8" fill="#FFFFFF" stroke="#8F9AA8" stroke-width="1.4"/><text x="360" y="19" class="legend">떼기</text>
    <text x="423" y="19" class="legend">0 = 개방</text>
    <text x="500" y="19" class="legend-muted">(세 밸브를 모두 놓음)</text>
  </g>
  {hand_legend()}
  {rows}
  <line x1="42" y1="1034" x2="1558" y2="1034" stroke="#173B38" stroke-width="2"/>
  <text x="46" y="1061" class="footer-head">읽는 순서: 계이름 → 악보 위치 → 오른손 손가락 → 밸브 번호</text>
  <text x="46" y="1084" class="footer-text">검지=1번 · 중지=2번 · 약지=3번. 붉은 캡은 누름, 흰 캡은 떼기입니다. 같은 운지라도 입술·공기 속도로 서로 다른 배음을 냅니다.</text>
  <text x="46" y="1107" class="footer-text">B♭ 트럼펫은 기보음보다 장2도 낮게 울립니다. 예: 기보 C4 → 실음 B♭3. 대체 운지는 음정·음색·빠른 패시지에 맞춰 선택합니다.</text>
  <text x="1554" y="1061" class="footer-head" text-anchor="end">31 NOTE · F♯3-C6</text>
  <text x="1554" y="1084" class="footer-text" text-anchor="end">자료 기준: 01 Source의 두 운지표 데이터 상호 대조</text>
  <text x="1554" y="1107" class="footer-text" text-anchor="end">음표 글리프: Bravura (SIL OFL) · SVG/HTML/PDF 공통 데이터</text>
</svg>'''


def scene_svg() -> str:
    return r'''<svg id="trumpet-scene" viewBox="0 0 760 460" role="img" aria-labelledby="scene-title scene-desc">
  <title id="scene-title">B♭ 트럼펫과 양손 운지</title>
  <desc id="scene-desc">오른손 검지, 중지, 약지가 각각 1번, 2번, 3번 밸브를 누르며 선택한 음의 운지를 보여줍니다.</desc>
  <defs>
    <linearGradient id="scene-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#102A28"/><stop offset="1" stop-color="#204540"/></linearGradient>
    <linearGradient id="scene-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE69A"/><stop offset=".3" stop-color="#D7B343"/><stop offset=".65" stop-color="#B08218"/><stop offset="1" stop-color="#765414"/></linearGradient>
    <linearGradient id="scene-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE8D3"/><stop offset=".55" stop-color="#F0C19A"/><stop offset="1" stop-color="#D59165"/></linearGradient>
    <linearGradient id="scene-pearl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9E0E1"/></linearGradient>
    <filter id="scene-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#041312" flood-opacity=".36"/></filter>
    <filter id="hand-shadow" x="-20%" y="-20%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#071B1A" flood-opacity=".32"/></filter>
  </defs>
  <rect width="760" height="460" rx="26" fill="url(#scene-bg)"/>
  <path d="M28 381 C164 340 294 360 419 405 C538 448 654 429 732 385" fill="none" stroke="#FFF6E2" stroke-opacity=".08" stroke-width="2"/>
  <g id="scene-trumpet" filter="url(#scene-shadow)">
    <path id="scene-bell" d="M42 241 C92 252 166 273 238 286 L238 320 C166 333 92 354 42 365 C30 346 24 324 24 303 C24 282 30 260 42 241 Z" fill="url(#scene-brass)" stroke="#614713" stroke-width="4"/>
    <ellipse cx="42" cy="303" rx="13" ry="62" fill="#F6D66E" stroke="#614713" stroke-width="4"/>
    <ellipse cx="43" cy="303" rx="7" ry="48" fill="#6E4F13" opacity=".72"/>
    <path d="M233 288 H570 Q585 288 585 303 Q585 318 570 318 H233 Z" fill="url(#scene-brass)" stroke="#614713" stroke-width="3"/>
    <path d="M570 292 H662 L690 282 L690 324 L662 314 H570 Z" fill="url(#scene-brass)" stroke="#614713" stroke-width="3"/>
    <path d="M690 290 H729 V316 H690" fill="url(#scene-pearl)" stroke="#314C48" stroke-width="3"/>
    <path d="M170 320 V372 Q170 402 201 402 H244 Q275 402 275 372 V320" fill="none" stroke="url(#scene-brass)" stroke-width="17"/>
    <g id="scene-valve-casings" fill="url(#scene-brass)" stroke="#614713" stroke-width="3">
      <rect x="302" y="213" width="36" height="165" rx="7"/><rect x="367" y="213" width="36" height="165" rx="7"/><rect x="432" y="213" width="36" height="165" rx="7"/>
    </g>
    <g fill="none" stroke="#FFE9A1" stroke-opacity=".58" stroke-width="4">
      <path d="M311 224 V364"/><path d="M376 224 V364"/><path d="M441 224 V364"/>
    </g>
    <g id="scene-slide-3">
      <path d="M304 327 H257 Q236 327 236 349 Q236 370 257 370 H304" fill="none" stroke="url(#scene-brass)" stroke-width="13"/>
      <circle cx="246" cy="316" r="17" fill="none" stroke="#D2AA36" stroke-width="6"/>
    </g>
    <path d="M466 253 Q501 255 501 281 Q501 307 468 310" fill="none" stroke="#D3AA37" stroke-width="8"/>
    <g id="scene-valve-3" class="scene-valve" data-valve="3"><rect x="315" y="179" width="10" height="38" rx="4" fill="#76908B"/><circle cx="320" cy="165" r="18" fill="url(#scene-pearl)" stroke="#314C48" stroke-width="4"/><text x="320" y="171" class="valve-number" text-anchor="middle">3</text></g>
    <g id="scene-valve-2" class="scene-valve" data-valve="2"><rect x="380" y="179" width="10" height="38" rx="4" fill="#76908B"/><circle cx="385" cy="165" r="18" fill="url(#scene-pearl)" stroke="#314C48" stroke-width="4"/><text x="385" y="171" class="valve-number" text-anchor="middle">2</text></g>
    <g id="scene-valve-1" class="scene-valve" data-valve="1"><rect x="445" y="179" width="10" height="38" rx="4" fill="#76908B"/><circle cx="450" cy="165" r="18" fill="url(#scene-pearl)" stroke="#314C48" stroke-width="4"/><text x="450" y="171" class="valve-number" text-anchor="middle">1</text></g>
  </g>
  <g id="scene-left-hand" filter="url(#hand-shadow)" fill="url(#scene-skin)" stroke="#9D684A" stroke-width="2.5">
    <path d="M279 321 Q263 361 279 411 Q318 447 405 424 Q435 392 425 337 Q406 316 386 326 Q351 359 315 323 Z"/>
    <path d="M423 337 Q451 315 447 281 Q436 264 423 276 Q416 305 399 327 Z"/>
    <path d="M304 329 Q273 319 259 341 Q253 365 272 379 Q289 382 305 367 Z"/>
    <path id="scene-lh-ring" d="M277 342 Q252 326 242 316 Q232 307 239 298 Q251 294 262 304 Q276 317 291 329 Z"/>
    <path d="M304 389 Q342 402 386 384" fill="none" stroke="#B77A58" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g id="scene-right-hand" filter="url(#hand-shadow)">
    <path d="M724 34 Q664 24 608 46 Q558 66 523 98 Q508 125 522 171 Q553 207 614 204 Q673 184 724 154 Z" fill="url(#scene-skin)" stroke="#9D684A" stroke-width="3"/>
    <path d="M724 34 H760 V168 Q742 162 724 154 Z" fill="url(#scene-skin)" stroke="#9D684A" stroke-width="3"/>
    <path d="M548 174 Q525 202 536 230 Q549 244 565 226 Q570 201 573 182 Z" fill="url(#scene-skin)" stroke="#9D684A" stroke-width="2.5"/>
    <path d="M625 187 Q608 219 576 232 Q545 242 516 226 Q507 215 518 207 Q558 215 602 177 Z" fill="url(#scene-skin)" stroke="#9D684A" stroke-width="2.5"/>
    <g id="scene-finger-ring" class="scene-finger" data-valve="3">
      <path d="M525 101 Q430 89 337 144 Q317 153 320 165" fill="none" stroke="#9D684A" stroke-width="39" stroke-linecap="round"/>
      <path d="M525 101 Q430 89 337 144 Q317 153 320 165" fill="none" stroke="url(#scene-skin)" stroke-width="34" stroke-linecap="round"/>
      <path d="M519 95 Q432 87 341 138" fill="none" stroke="#FFF1E4" stroke-opacity=".44" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="320" cy="161" rx="11" ry="6" fill="#FCE8D7" stroke="#C58F70" stroke-width="1.3" transform="rotate(-10 320 161)"/>
      <path d="M403 116 q10 6 20 0 M456 101 q10 6 20 0" fill="none" stroke="#B77857" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g id="scene-finger-middle" class="scene-finger" data-valve="2">
      <path d="M550 88 Q472 64 403 123 Q383 142 385 165" fill="none" stroke="#9D684A" stroke-width="40" stroke-linecap="round"/>
      <path d="M550 88 Q472 64 403 123 Q383 142 385 165" fill="none" stroke="url(#scene-skin)" stroke-width="35" stroke-linecap="round"/>
      <path d="M544 82 Q475 62 409 117" fill="none" stroke="#FFF1E4" stroke-opacity=".44" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="385" cy="161" rx="11" ry="6" fill="#FCE8D7" stroke="#C58F70" stroke-width="1.3" transform="rotate(-7 385 161)"/>
      <path d="M450 97 q10 6 20 0 M493 79 q10 6 20 0" fill="none" stroke="#B77857" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g id="scene-finger-index" class="scene-finger" data-valve="1">
      <path d="M575 105 Q520 88 470 130 Q451 146 450 165" fill="none" stroke="#9D684A" stroke-width="38" stroke-linecap="round"/>
      <path d="M575 105 Q520 88 470 130 Q451 146 450 165" fill="none" stroke="url(#scene-skin)" stroke-width="33" stroke-linecap="round"/>
      <path d="M570 99 Q520 86 475 125" fill="none" stroke="#FFF1E4" stroke-opacity=".44" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="450" cy="161" rx="11" ry="6" fill="#FCE8D7" stroke="#C58F70" stroke-width="1.3" transform="rotate(-5 450 161)"/>
      <path d="M493 112 q9 5 18 0 M531 96 q9 5 18 0" fill="none" stroke="#B77857" stroke-width="2" stroke-linecap="round"/>
    </g>
  </g>
  <g class="scene-labels" aria-hidden="true">
    <text x="320" y="437" text-anchor="middle">3 · 약지</text><text x="385" y="437" text-anchor="middle">2 · 중지</text><text x="450" y="437" text-anchor="middle">1 · 검지</text>
  </g>
</svg>'''


def note_button(note: dict, index: int) -> str:
    dots = "".join(
        f'<span class="mini-valve {"is-on" if n in note["valves"] else ""}" aria-hidden="true">{n}</span>'
        for n in (1, 2, 3)
    )
    name = display_name(note)
    fingering = valve_text(note["valves"])
    aria = f"{note['solfege']}, {name}, 운지 {fingering}"
    return (
        f'<button class="note-button" type="button" data-note-index="{index}" aria-pressed="false" aria-label="{xml_text(aria)}">'
        f'<span class="button-solfege">{xml_text(note["solfege"])}</span>'
        f'<span class="button-pitch">{xml_text(name)}</span>'
        f'<span class="mini-valves">{dots}</span>'
        '</button>'
    )


def build_html(chart_inline: str) -> str:
    groups = []
    for label, english, pitch_range, start, end in RANGES:
        buttons = "".join(note_button(NOTES[i], i) for i in range(start, end))
        groups.append(
            f'<section class="note-range" aria-labelledby="range-{start}">'
            f'<div class="range-heading"><h2 id="range-{start}">{label}</h2><span>{english} · {pitch_range}</span></div>'
            f'<div class="note-grid">{buttons}</div></section>'
        )
    notes_json = json.dumps(NOTES, ensure_ascii=False, separators=(",", ":"))
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="오른손 손가락 애니메이션으로 배우는 B♭ 트럼펫 계이름 운지표. 기보음 F♯3-C6, 31음, 표준·대체 운지.">
<title>손가락으로 익히는 B♭ 트럼펫 계이름 운지표</title>
<style>
:root{{--navy:#14243b;--velvet:#173b38;--velvet-2:#214a45;--brass:#c9a227;--brass-dark:#795914;--paper:#fffdfa;--surface:#f4f6f3;--line:#d7ddd9;--muted:#667085;--red:#c62828;--skin:#f1c39d;--focus:#2878d0;color-scheme:light;}}
*{{box-sizing:border-box}}
body{{margin:0;background:#e8edea;color:var(--navy);font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif;}}
button,input{{font:inherit}}
.page{{max-width:1460px;margin:0 auto;padding:24px;}}
.hero{{display:flex;justify-content:space-between;gap:24px;align-items:end;margin:0 0 16px;padding:6px 2px;}}
.eyebrow{{margin:0 0 7px;color:var(--brass-dark);font-size:12px;font-weight:700;letter-spacing:.12em;}}
h1{{margin:0;font-size:clamp(27px,3vw,44px);line-height:1.15;letter-spacing:-.035em;}}
.hero-copy{{margin:8px 0 0;color:var(--muted);font-size:15px;}}
.toolbar{{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;align-items:center;}}
.button,.mode-button{{border:1px solid #bbc5c0;border-radius:12px;background:var(--paper);color:var(--navy);min-height:42px;padding:9px 13px;font-weight:700;cursor:pointer;}}
.button.primary{{background:var(--velvet);border-color:var(--velvet);color:white;}}
.mode-group{{display:inline-flex;border:1px solid #bbc5c0;border-radius:12px;overflow:hidden;background:var(--paper);}}
.mode-button{{border:0;border-radius:0;}}
.mode-button[aria-pressed="true"]{{background:var(--navy);color:white;}}
button:focus-visible,input:focus-visible{{outline:3px solid var(--focus);outline-offset:3px;}}
.workspace{{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:16px;align-items:stretch;}}
.scene-card,.detail-card,.note-browser{{background:var(--paper);border:1px solid var(--line);border-radius:22px;box-shadow:0 14px 38px rgba(20,36,59,.09);}}
.scene-card{{overflow:hidden;min-width:0;}}
#trumpet-scene{{display:block;width:100%;height:auto;}}
.detail-card{{padding:22px;display:flex;flex-direction:column;gap:18px;}}
.detail-kicker{{margin:0;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.08em;}}
.current-solfege{{margin:2px 0 0;color:var(--velvet);font-size:clamp(34px,5vw,60px);line-height:1.05;font-weight:700;letter-spacing:-.04em;}}
.current-pitch{{margin:5px 0 0;color:var(--muted);font-size:18px;font-weight:700;}}
.data-list{{display:grid;gap:10px;margin:0;}}
.data-row{{display:grid;grid-template-columns:94px 1fr;align-items:start;gap:10px;padding-top:10px;border-top:1px solid var(--line);}}
.data-row dt{{color:var(--muted);font-size:13px;font-weight:700;}}
.data-row dd{{margin:0;font-size:15px;font-weight:700;}}
.large-valves{{display:flex;gap:9px;align-items:center;min-height:46px;}}
.large-valve{{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;border:2px solid #9aa6b2;background:white;font-weight:700;}}
.large-valve.is-on{{background:var(--red);border-color:#991f1f;color:white;transform:translateY(4px);}}
.tip{{margin:auto 0 0;padding:13px 14px;border-radius:14px;background:#edf3f0;color:#41524f;font-size:13px;line-height:1.55;}}
.note-browser{{margin-top:16px;padding:18px;}}
.note-range+.note-range{{margin-top:18px;padding-top:18px;border-top:1px solid var(--line);}}
.range-heading{{display:flex;align-items:baseline;gap:10px;margin-bottom:10px;}}
.range-heading h2{{margin:0;font-size:17px;}}
.range-heading span{{color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.09em;}}
.note-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;}}
.note-button{{display:grid;gap:5px;justify-items:center;min-height:102px;padding:10px 7px;border:1px solid var(--line);border-radius:14px;background:#fbfcfa;color:var(--navy);cursor:pointer;}}
.note-button:hover{{border-color:#a89760;background:#fffaf0;}}
.note-button[aria-pressed="true"]{{border:2px solid var(--brass);background:#fff4d8;box-shadow:inset 0 0 0 2px rgba(201,151,43,.14);}}
.button-solfege{{font-size:16px;font-weight:700;color:var(--velvet);}}
.button-pitch{{font-size:11px;font-weight:700;color:var(--muted);}}
.mini-valves{{display:flex;gap:4px;}}
.mini-valve{{width:20px;height:20px;display:grid;place-items:center;border:1.5px solid #9aa6b2;border-radius:50%;background:white;font-size:10px;font-weight:700;}}
.mini-valve.is-on{{background:var(--red);border-color:#991f1f;color:white;}}
.scene-valve,.scene-finger{{transition:transform 120ms cubic-bezier(.3,0,.2,1);}}
.scene-valve:not(.pressed),.scene-finger:not(.pressed){{transition-duration:170ms;transition-timing-function:cubic-bezier(.34,1.3,.3,1);}}
.scene-valve.pressed{{transform:translateY(14px);}}
.scene-valve.pressed circle{{fill:#d5ad39;stroke:#6a4b12;}}
#scene-finger-index{{transform-origin:575px 105px;}}
#scene-finger-middle{{transform-origin:550px 88px;}}
#scene-finger-ring{{transform-origin:525px 101px;}}
#scene-finger-index.pressed{{transform:rotate(-8deg);}}
#scene-finger-middle.pressed{{transform:rotate(-5deg);}}
#scene-finger-ring.pressed{{transform:rotate(-4deg);}}
#scene-slide-3,#scene-lh-ring{{transition:transform 220ms ease-out;}}
#scene-slide-3.extended,#scene-lh-ring.extended{{transform:translateX(-14px);}}
.valve-number{{font-size:13px;font-weight:700;fill:#173b38;}}
.scene-labels{{font-size:13px;font-weight:700;fill:#f7ead0;}}
.print-sheet{{display:none;}}
@media(max-width:940px){{.page{{padding:14px}}.hero{{align-items:flex-start;flex-direction:column}}.toolbar{{justify-content:flex-start}}.workspace{{grid-template-columns:1fr}}.detail-card{{display:grid;grid-template-columns:1fr 1fr;}}.tip{{grid-column:1/-1}}}}
@media(max-width:560px){{.detail-card{{grid-template-columns:1fr}}.toolbar{{width:100%}}.button{{flex:1}}.mode-group{{width:100%}}.mode-button{{flex:1}}.note-grid{{grid-template-columns:repeat(3,minmax(0,1fr));}}.note-button{{min-height:98px;padding:8px 4px}}}}
@media(prefers-reduced-motion:reduce){{*,*::before,*::after{{scroll-behavior:auto!important;transition-duration:.001ms!important;animation-duration:.001ms!important;animation-iteration-count:1!important;}}}}
@page{{size:A4 landscape;margin:0;}}
@media print{{html,body{{margin:0!important;padding:0!important;background:white!important;width:297mm;height:210mm;}}.page{{display:none!important}}.print-sheet{{display:block!important;width:297mm;height:210mm;overflow:hidden}}.print-sheet>svg{{display:block;width:297mm;height:210mm}}}}
</style>
</head>
<body>
<main class="page">
  <header class="hero">
    <div><p class="eyebrow">VISUAL FINGERING LAB · B♭ TRUMPET</p><h1>손가락으로 익히는 계이름 운지표</h1><p class="hero-copy">음표를 고르면 실제 오른손 손가락과 피스톤이 함께 움직입니다.</p></div>
    <div class="toolbar" aria-label="차트 도구">
      <div class="mode-group" role="group" aria-label="재생 음높이"><button type="button" class="mode-button" data-pitch-mode="written" aria-pressed="true">기보음</button><button type="button" class="mode-button" data-pitch-mode="concert" aria-pressed="false">실음</button></div>
      <button type="button" class="button" id="play-note">선택 음 재생</button>
      <button type="button" class="button primary" id="print-chart">A4 차트 인쇄</button>
    </div>
  </header>
  <div class="workspace">
    <section class="scene-card" aria-label="손가락 운지 애니메이션">{scene_svg()}</section>
    <aside class="detail-card" aria-live="polite" aria-atomic="true">
      <div><p class="detail-kicker">현재 선택 · 기보음 기준</p><p class="current-solfege" id="detail-solfege">레</p><p class="current-pitch" id="detail-pitch">D4</p></div>
      <dl class="data-list">
        <div class="data-row"><dt>오른손</dt><dd id="detail-fingers">검지 + 약지</dd></div>
        <div class="data-row"><dt>밸브</dt><dd><span class="large-valves" id="detail-valves"></span><span id="detail-fingering">1-3</span></dd></div>
        <div class="data-row"><dt>대체 운지</dt><dd id="detail-alts">3</dd></div>
        <div class="data-row"><dt>실음</dt><dd id="detail-concert">C4</dd></div>
      </dl>
      <p class="tip" id="detail-tip">1번은 검지, 2번은 중지, 3번은 약지로 누릅니다. 낮은 1-3·1-2-3 운지는 3번 밸브 슬라이드로 음정을 보정할 수 있습니다.</p>
    </aside>
  </div>
  <section class="note-browser" aria-label="31음 운지 선택">{''.join(groups)}</section>
</main>
<section class="print-sheet" aria-label="A4 인쇄용 전체 운지표">{chart_inline}</section>
<script>
const NOTES={notes_json};
const FINGER_NAMES={{1:"검지",2:"중지",3:"약지"}};
let selectedIndex=8;
let pitchMode="written";
let audioContext=null;
let activeNodes=[];
const byId=id=>document.getElementById(id);
const sceneValves={{1:byId("scene-valve-1"),2:byId("scene-valve-2"),3:byId("scene-valve-3")}};
const sceneFingers={{1:byId("scene-finger-index"),2:byId("scene-finger-middle"),3:byId("scene-finger-ring")}};
function fingeringText(valves){{return valves.length?valves.join("-"):"0 (개방)";}}
function displayName(note){{return note.name+(note.enh?" / "+note.enh:"");}}
function stopAudio(){{for(const node of activeNodes){{try{{node.stop();}}catch(_){{}}}}activeNodes=[];}}
function playSelected(){{
  const note=NOTES[selectedIndex];
  const midi=note.midi-(pitchMode==="concert"?2:0);
  const frequency=440*Math.pow(2,(midi-69)/12);
  audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended") audioContext.resume();
  stopAudio();
  const now=audioContext.currentTime;
  const main=audioContext.createOscillator(), overtone=audioContext.createOscillator();
  const overtoneGain=audioContext.createGain(), filter=audioContext.createBiquadFilter(), gain=audioContext.createGain();
  main.type="sawtooth";main.frequency.value=frequency;
  overtone.type="sine";overtone.frequency.value=frequency*2;overtoneGain.gain.value=.1;
  filter.type="lowpass";filter.frequency.value=frequency*5.2;filter.Q.value=.8;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.22,now+.035);gain.gain.setTargetAtTime(.16,now+.08,.11);gain.gain.setTargetAtTime(0,now+.78,.08);
  main.connect(filter);overtone.connect(overtoneGain);overtoneGain.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
  main.start(now);overtone.start(now);main.stop(now+1.25);overtone.stop(now+1.25);activeNodes=[main,overtone];
}}
function render(index){{
  selectedIndex=index;
  const note=NOTES[index];
  for(const n of [1,2,3]){{const on=note.valves.includes(n);sceneValves[n].classList.toggle("pressed",on);sceneFingers[n].classList.toggle("pressed",on);}}
  const needsSlide=note.midi<=62&&note.valves.includes(1)&&note.valves.includes(3);
  byId("scene-slide-3").classList.toggle("extended",needsSlide);byId("scene-lh-ring").classList.toggle("extended",needsSlide);
  byId("detail-solfege").textContent=note.solfege;byId("detail-pitch").textContent=displayName(note);
  byId("detail-fingers").textContent=note.valves.length?note.valves.map(v=>FINGER_NAMES[v]).join(" + "):"손가락을 모두 뗌";
  byId("detail-fingering").textContent=fingeringText(note.valves);
  byId("detail-alts").textContent=note.alts.length?note.alts.map(fingeringText).join(" / "):"없음 (표준 주운지)";
  byId("detail-concert").textContent=note.concert;
  byId("detail-valves").innerHTML=[1,2,3].map(n=>`<span class="large-valve ${{note.valves.includes(n)?"is-on":""}}">${{n}}</span>`).join("");
  document.querySelectorAll(".note-button").forEach(button=>button.setAttribute("aria-pressed",Number(button.dataset.noteIndex)===index?"true":"false"));
}}
document.querySelectorAll(".note-button").forEach(button=>{{button.addEventListener("click",()=>render(Number(button.dataset.noteIndex)));button.addEventListener("keydown",event=>{{
  const buttons=[...document.querySelectorAll(".note-button")];const current=buttons.indexOf(button);let next=null;
  if(event.key==="ArrowRight")next=Math.min(buttons.length-1,current+1);if(event.key==="ArrowLeft")next=Math.max(0,current-1);if(event.key==="Home")next=0;if(event.key==="End")next=buttons.length-1;
  if(next!==null){{event.preventDefault();buttons[next].focus();render(Number(buttons[next].dataset.noteIndex));}}
}});}});
document.querySelectorAll("[data-pitch-mode]").forEach(button=>button.addEventListener("click",()=>{{pitchMode=button.dataset.pitchMode;document.querySelectorAll("[data-pitch-mode]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));}}));
byId("play-note").addEventListener("click",playSelected);byId("print-chart").addEventListener("click",()=>window.print());
render(selectedIndex);
</script>
</body>
</html>'''


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PDF_OUTPUT.mkdir(parents=True, exist_ok=True)
    svg = build_chart_svg(include_xml=True)
    svg_path = OUTPUT / "trumpet-fingering-chart-hand.svg"
    html_path = OUTPUT / "trumpet-fingering-chart-hand.html"
    svg_path.write_text(svg, encoding="utf-8", newline="\n")
    inline_svg = build_chart_svg(include_xml=False)
    html_path.write_text(build_html(inline_svg), encoding="utf-8", newline="\n")
    print(svg_path)
    print(html_path)


if __name__ == "__main__":
    main()
