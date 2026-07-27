"""Reorder CV contact strip so city is last; keep design, fonts, links."""

import os
import shutil
import fitz
from fontTools.subset import main as subset_main

SRC = "/Users/vera/Desktop/Fedotova Vera Design Portfolio/UX:UI Designer  Fedotova Vera.reorder-backup.pdf"
DEST = "/Users/vera/Desktop/Fedotova Vera Design Portfolio/UX:UI Designer  Fedotova Vera.pdf"
OUT = "/Users/vera/Projects/portfolio-github/.cv-tmp/cv_reordered.pdf"
REPO_PDF = "/Users/vera/Projects/portfolio-github/Fedotova-Vera-UX-UI-Designer-CV.pdf"
INTER = "/Users/vera/Projects/portfolio-github/.cv-tmp/inter-regular.ttf"
SF = os.path.expanduser("~/Library/Fonts/SF-Pro-Text-Regular.otf")
INTER_SUB = "/Users/vera/Projects/portfolio-github/.cv-tmp/inter-strip-subset.ttf"
SF_SUB = "/Users/vera/Projects/portfolio-github/.cv-tmp/sf-arrow-subset.otf"

INK = (0.949, 0.9451, 0.9255)
TEXT_ALPHA = 0.7804
DOT_ALPHA = 0.3412
PHONE = "+48 509 047 484"

# (label, uri, use_arrow_suffix)
ITEMS = [
    ("fvo.fedotova@gmail.com", "mailto:fvo.fedotova@gmail.com", False),
    ("LinkedIn", "https://www.linkedin.com/in/vera-fedotova/", False),
    ("Portfolio", "https://fedotovadesign.github.io/portfolio/index.html", True),
    (PHONE, "tel:+48509047484", False),
    ("Warsaw, Poland", None, False),
]


def main():
    doc = fitz.open(SRC)
    page = doc[0]

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
    arrow_size = 7.5
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

    gaps_b, gaps_a = [], []
    for d in dots:
        cx = (d["rect"].x0 + d["rect"].x1) / 2
        before = max((s for s in strip_spans if s["bbox"][2] <= cx), key=lambda s: s["bbox"][2])
        after = min((s for s in strip_spans if s["bbox"][0] >= cx), key=lambda s: s["bbox"][0])
        gaps_b.append(cx - before["bbox"][2])
        gaps_a.append(after["bbox"][0] - cx)
    gap_before = sum(gaps_b) / len(gaps_b)
    gap_after = sum(gaps_a) / len(gaps_a)

    # Measured original space between Portfolio and arrow (~0.16-0.2 pt content)
    arrow_gap = 308.71 - 306.55  # from original spans

    subset_main([
        INTER,
        "--text=fvo.fedotova@gmail.com LinkedIn Portfolio+48 509 047 484Warsaw, Poland",
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
        f"--output-file={INTER_SUB}",
    ])
    subset_main([
        SF,
        "--text=↗ ",
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
        f"--output-file={SF_SUB}",
    ])
    font = fitz.Font(fontfile=INTER_SUB)
    arrow_font = fitz.Font(fontfile=SF_SUB)

    # Opaque cover over the whole strip band
    page.draw_rect(fitz.Rect(18, 85.5, 530, 103.5), color=None, fill=(0, 0, 0), fill_opacity=1)

    for i in reversed(range(len(page.get_links()))):
        link = page.get_links()[i]
        if link["from"].y0 < 110:
            page.delete_link(link)

    x = start_x
    for i, (text, uri, with_arrow) in enumerate(ITEMS):
        w = font.text_length(text, fontsize=fontsize)
        page.insert_text(
            fitz.Point(x, baseline),
            text,
            fontsize=fontsize,
            fontname="InterStrip",
            fontfile=INTER_SUB,
            color=INK,
            fill=INK,
            fill_opacity=TEXT_ALPHA,
        )
        item_end = x + w
        if with_arrow:
            ax = item_end + arrow_gap
            page.insert_text(
                fitz.Point(ax, baseline),
                "↗",
                fontsize=arrow_size,
                fontname="SFArrow",
                fontfile=SF_SUB,
                color=INK,
                fill=INK,
                fill_opacity=TEXT_ALPHA,
            )
            item_end = ax + arrow_font.text_length("↗", fontsize=arrow_size)

        if uri:
            page.insert_link({
                "kind": fitz.LINK_URI,
                "from": fitz.Rect(x - 0.3, link_y0, item_end + 0.3, link_y1),
                "uri": uri,
            })

        if i < len(ITEMS) - 1:
            dot_cx = item_end + gap_before
            page.draw_circle(
                fitz.Point(dot_cx, dot_cy),
                dot_r,
                color=None,
                fill=INK,
                fill_opacity=DOT_ALPHA,
            )
            x = dot_cx + gap_after
        else:
            x = item_end

    print(f"strip ends at {x:.2f}")
    assert x < page.rect.x1 - 20

    doc.subset_fonts()
    doc.save(OUT, garbage=4, deflate=True, clean=True)
    doc.close()

    b = fitz.open(OUT)
    # Visual-only check via pixmap crop
    b[0].get_pixmap(dpi=500, clip=fitz.Rect(20, 80, 480, 110)).save(
        "/Users/vera/Projects/portfolio-github/.cv-tmp/strip_reordered.png"
    )
    print("links:")
    for l in b[0].get_links():
        if l["from"].y0 < 110:
            print(" ", [round(v, 2) for v in l["from"]], l.get("uri"))
    # Extract only newly drawn text by checking fonts - show all strip band text for sanity
    print("band text chars present:", "+48" in b[0].get_textbox(fitz.Rect(0, 80, 595, 110)),
          "Warsaw" in b[0].get_textbox(fitz.Rect(0, 80, 595, 110)))
    b.close()

    shutil.copy2(OUT, DEST)
    shutil.copy2(OUT, REPO_PDF)
    print("updated Desktop + repo PDF")


if __name__ == "__main__":
    main()
