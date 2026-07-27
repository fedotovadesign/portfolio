"""Reorder CV contact strip so city is last; keep design, fonts, links."""

import os
import shutil
import fitz
from fontTools.subset import main as subset_main

SRC = "/Users/vera/Desktop/Fedotova Vera Design Portfolio/UX:UI Designer  Fedotova Vera.pdf"
BACKUP = "/Users/vera/Desktop/Fedotova Vera Design Portfolio/UX:UI Designer  Fedotova Vera.reorder-backup.pdf"
OUT = "/Users/vera/Projects/portfolio-github/.cv-tmp/cv_reordered.pdf"
REPO_PDF = "/Users/vera/Projects/portfolio-github/Fedotova-Vera-UX-UI-Designer-CV.pdf"
FONT = "/Users/vera/Projects/portfolio-github/.cv-tmp/inter-regular.ttf"
SUBSET = "/Users/vera/Projects/portfolio-github/.cv-tmp/inter-strip-subset.ttf"

INK = (0.949, 0.9451, 0.9255)
TEXT_ALPHA = 0.7804
DOT_ALPHA = 0.3412
PHONE = "+48 509 047 484"

# New order: city last
ITEMS = [
    ("fvo.fedotova@gmail.com", "mailto:fvo.fedotova@gmail.com"),
    ("LinkedIn", "https://www.linkedin.com/in/vera-fedotova/"),
    ("Portfolio ↗", "https://fedotovadesign.github.io/portfolio/index.html"),
    (PHONE, "tel:+48509047484"),
    ("Warsaw, Poland", None),
]


def main():
    doc = fitz.open(SRC)
    page = doc[0]

    # Measure existing rhythm from current strip
    email = next(
        s
        for b in page.get_text("dict")["blocks"]
        if not b["type"]
        for l in b["lines"]
        for s in l["spans"]
        if "fvo.fedotova@gmail.com" in s["text"]
    )
    baseline = email["origin"][1]
    fontsize = email["size"]
    start_x = email["bbox"][0]
    link_y0, link_y1 = 88.5, 100.5

    band = fitz.Rect(0, baseline - 10, page.rect.x1, baseline + 5)
    strip_spans = sorted(
        [
            s
            for b in page.get_text("dict")["blocks"]
            if not b["type"]
            for l in b["lines"]
            for s in l["spans"]
            if band.contains(fitz.Rect(s["bbox"])) and s["text"].strip()
        ],
        key=lambda s: s["bbox"][0],
    )

    dots = []
    for d in page.get_drawings():
        if not (band.contains(d["rect"]) and d["fill"]):
            continue
        if not (1.0 < d["rect"].width < 3.5 and abs(d["rect"].width - d["rect"].height) < 0.4):
            continue
        cx = (d["rect"].x0 + d["rect"].x1) / 2
        if any(s["bbox"][0] - 1 <= cx <= s["bbox"][2] + 1 for s in strip_spans):
            continue
        dots.append(d)
    dots.sort(key=lambda d: d["rect"].x0)
    last_dot = dots[0]
    dot_r = last_dot["rect"].width / 2
    dot_cy = (last_dot["rect"].y0 + last_dot["rect"].y1) / 2

    # Average gap from existing separators
    gaps_b, gaps_a = [], []
    for d in dots:
        cx = (d["rect"].x0 + d["rect"].x1) / 2
        before = max((s for s in strip_spans if s["bbox"][2] <= cx), key=lambda s: s["bbox"][2])
        after = min((s for s in strip_spans if s["bbox"][0] >= cx), key=lambda s: s["bbox"][0])
        gaps_b.append(cx - before["bbox"][2])
        gaps_a.append(after["bbox"][0] - cx)
    gap_before = sum(gaps_b) / len(gaps_b)
    gap_after = sum(gaps_a) / len(gaps_a)
    print(f"baseline={baseline} size={fontsize} start_x={start_x:.2f}")
    print(f"gap_before={gap_before:.3f} gap_after={gap_after:.3f} dot_r={dot_r:.3f}")

    subset_main([
        FONT,
        f"--text={' '.join(t for t, _ in ITEMS)}+0123456789↗,",
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
        f"--output-file={SUBSET}",
    ])
    font = fitz.Font(fontfile=SUBSET)

    # Cover old strip (black page bg)
    cover = fitz.Rect(20, 86.5, 520, 102.5)
    page.draw_rect(cover, color=None, fill=(0, 0, 0), fill_opacity=1)

    # Delete old contact-strip links
    for i in reversed(range(len(page.get_links()))):
        link = page.get_links()[i]
        if link["from"].y0 < 110:
            page.delete_link(link)

    # Draw new strip
    x = start_x
    for i, (text, uri) in enumerate(ITEMS):
        w = font.text_length(text, fontsize=fontsize)
        page.insert_text(
            fitz.Point(x, baseline),
            text,
            fontsize=fontsize,
            fontname="InterStrip",
            fontfile=SUBSET,
            color=INK,
            fill=INK,
            fill_opacity=TEXT_ALPHA,
        )
        if uri:
            page.insert_link({
                "kind": fitz.LINK_URI,
                "from": fitz.Rect(x - 0.3, link_y0, x + w + 0.3, link_y1),
                "uri": uri,
            })
        x_end = x + w
        if i < len(ITEMS) - 1:
            dot_cx = x_end + gap_before
            page.draw_circle(
                fitz.Point(dot_cx, dot_cy),
                dot_r,
                color=None,
                fill=INK,
                fill_opacity=DOT_ALPHA,
            )
            x = dot_cx + gap_after
        else:
            x = x_end

    print(f"strip ends at {x:.2f} (page {page.rect.x1:.2f})")
    assert x < page.rect.x1 - 20, "strip overflows page"

    if not os.path.exists(BACKUP):
        shutil.copy2(SRC, BACKUP)

    doc.subset_fonts()
    doc.save(OUT, garbage=4, deflate=True, clean=True)
    doc.close()

    # Verify
    b = fitz.open(OUT)
    print("strip text:", repr(b[0].get_textbox(fitz.Rect(0, 80, 595, 110))))
    print("links:")
    for l in b[0].get_links():
        if l["from"].y0 < 110:
            print(" ", [round(v, 2) for v in l["from"]], l.get("uri"))
    b[0].get_pixmap(dpi=500, clip=fitz.Rect(20, 80, 480, 110)).save(
        "/Users/vera/Projects/portfolio-github/.cv-tmp/strip_reordered.png"
    )
    b.close()

    shutil.copy2(OUT, SRC)
    shutil.copy2(OUT, REPO_PDF)
    print("updated Desktop + repo PDF")


if __name__ == "__main__":
    main()
