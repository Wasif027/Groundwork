"""Generate the fictional sample corpus — a small online candle shop.

    pip install fpdf2 openpyxl python-pptx python-docx
    python scripts/make_candleshop_samples.py

Writes 6 files into sample-docs/ (all PDF / Word / Excel / PowerPoint):
  returns-and-refunds-policy.pdf
  shipping-information.docx
  product-catalogue.xlsx        (Products + Suppliers sheets)
  orders-last-90-days.xlsx      (Orders sheet)
  complaints-and-faq-handbook.docx
  monthly-review.pptx
"""

from __future__ import annotations

import datetime as dt
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "sample-docs"
ROOT.mkdir(exist_ok=True)
RNG = random.Random(90210)

# product -> (scent, wax_cost, packaging_cost, sale_price, stock, reorder_level)
CATALOG = {
    "AMB-01": ("Amber & Oud", 4.10, 1.20, 5.00, 18, 20),          # sold at a loss
    "LAV-01": ("Lavender Fields", 2.30, 1.10, 12.00, 64, 25),
    "SEA-01": ("Sea Salt & Sage", 2.80, 1.10, 14.00, 12, 25),
    "VAN-01": ("Vanilla Bean", 2.10, 1.00, 11.00, 140, 30),
    "PINE-01": ("Winter Pine", 3.40, 1.30, 4.50, 8, 15),          # sold at a loss
    "CIT-01": ("Citrus Grove", 2.60, 1.10, 13.00, 47, 25),
    "ROSE-01": ("English Rose", 3.10, 1.40, 19.00, 33, 20),
    "TEA-01": ("Green Tea", 2.40, 1.05, 12.50, 71, 25),
}
CHANNELS = ["website", "etsy", "wholesale", "market stall"]
COUNTRIES = ["UK", "UK", "UK", "Ireland", "France", "Germany", "US"]


# --------------------------------------------------------------------- Excel
def build_orders() -> list[dict]:
    skus = list(CATALOG)
    start = dt.date(2026, 3, 1)
    rows: list[dict] = []
    for i in range(140):
        d = start + dt.timedelta(days=RNG.randint(0, 89))
        sku = RNG.choice(skus)
        _, wax, pack, price, *_ = CATALOG[sku]
        qty = RNG.randint(1, 8)
        refunded = RNG.random() < 0.06
        rows.append(
            {
                "order_id": f"CS-{5000 + i}",
                "date": d.isoformat(),
                "month": d.strftime("%Y-%m"),
                "sku": sku,
                "qty": qty,
                "revenue": 0.0 if refunded else round(qty * price, 2),
                "unit_cost": round(wax + pack, 2),
                "channel": RNG.choice(CHANNELS),
                "country": RNG.choice(COUNTRIES),
                "refunded": refunded,
            }
        )
    rows.sort(key=lambda r: r["date"])
    return rows


def write_catalogue() -> Path:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Products"
    ws.append(
        ["sku", "name", "wax_cost", "packaging_cost", "sale_price", "unit_cost",
         "margin_per_unit", "stock_qty", "reorder_level"]
    )
    for sku, (name, wax, pack, price, stock, reorder) in CATALOG.items():
        unit_cost = round(wax + pack, 2)
        ws.append(
            [sku, name, wax, pack, price, unit_cost, round(price - unit_cost, 2), stock, reorder]
        )

    sup = wb.create_sheet("Suppliers")
    sup.append(["supplier", "material", "lead_time_days", "min_order_gbp", "notes"])
    for row in [
        ("WaxWorks Ltd", "soy wax", 7, 150, "primary wax supplier"),
        ("WaxWorks Ltd", "wicks", 7, 40, ""),
        ("The Jar Company", "glass jars", 14, 200, "long lead time - order early"),
        ("PrintPals", "labels", 5, 25, ""),
        ("ScentSource", "fragrance oils", 10, 120, "amber & oud is their most expensive oil"),
    ]:
        sup.append(list(row))

    out = ROOT / "product-catalogue.xlsx"
    wb.save(out)
    return out


def write_orders() -> Path:
    from openpyxl import Workbook

    rows = build_orders()
    wb = Workbook()
    ws = wb.active
    ws.title = "Orders"
    headers = list(rows[0].keys())
    ws.append(headers)
    for r in rows:
        ws.append([r[h] for h in headers])
    out = ROOT / "orders-last-90-days.xlsx"
    wb.save(out)
    return out


# --------------------------------------------------------------------- Word
def _docx(path: Path, title: str, blocks: list[tuple[str, str]]) -> Path:
    from docx import Document as Docx

    doc = Docx()
    doc.add_heading(title, level=0)
    for kind, text in blocks:
        if kind == "h":
            doc.add_heading(text, level=1)
        elif kind == "b":
            doc.add_paragraph(text, style="List Bullet")
        else:
            doc.add_paragraph(text)
    doc.save(path)
    return path


def write_shipping() -> Path:
    return _docx(
        ROOT / "shipping-information.docx",
        "Shipping & Delivery",
        [
            ("h", "UK delivery"),
            ("p", "Standard UK delivery is Royal Mail Tracked 48 and costs £3.95. "
                  "Orders over £40 ship free. Dispatch is within 2 working days."),
            ("p", "Express UK delivery is Tracked 24 and costs £6.50."),
            ("h", "International delivery"),
            ("p", "Europe: £9.50, 5–10 working days. Rest of world: £14.00, 10–20 working days. "
                  "Customers are responsible for any import duties."),
            ("h", "Damages in transit"),
            ("p", "Candles are packed in moulded pulp trays. If an item arrives broken we replace it "
                  "free of charge or refund it in full — the customer's choice."),
            ("h", "Lost parcels"),
            ("p", "A UK parcel is considered lost after 10 working days, international after 25. "
                  "At that point we resend or refund."),
        ],
    )


def write_returns() -> Path:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 10, "Returns & Refunds Policy", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    body = [
        ("Return window",
         "You can return any unused candle within 30 days of delivery for a full refund. "
         "The candle must be unburned and in its original packaging."),
        ("Faulty or damaged items",
         "If a candle arrives broken, cracked, or with a fault (a wick that won't light, a "
         "cracked jar), contact us within 30 days with a photo. We will send a free replacement "
         "or a full refund - your choice. You do not need to return a broken item."),
        ("Wrong item sent",
         "If we sent the wrong scent or product, we cover return postage and send the correct "
         "item straight away."),
        ("How refunds are issued",
         "Refunds go back to the original payment method within 5 working days of us receiving "
         "the return (or of approving a faulty-item claim). Shipping is refunded only when the "
         "return is our fault."),
        ("Sale items",
         "Sale and clearance items can be returned for store credit, not a cash refund, unless "
         "they are faulty."),
        ("Allergies",
         "Every product lists its fragrance ingredients on the label and product page. We cannot "
         "accept returns for a scent a customer simply didn't like, but we always refund a "
         "genuine allergic reaction."),
    ]
    for head, text in body:
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, head, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, text)
    out = ROOT / "returns-and-refunds-policy.pdf"
    pdf.output(str(out))
    return out


def write_faq() -> Path:
    return _docx(
        ROOT / "complaints-and-faq-handbook.docx",
        "Complaints & FAQ Handbook",
        [
            ("p", "Guidance for handling common customer messages. Be warm, quick, and generous - "
                  "a good recovery keeps a customer."),
            ("h", "Broken on arrival"),
            ("b", "Apologise and offer a free replacement or a full refund (their choice)."),
            ("b", "Ask for a photo so we can claim against the courier."),
            ("b", "Log the breakage in the courier-claims sheet."),
            ("h", "Late delivery"),
            ("b", "If a UK order is past 10 working days, treat the parcel as lost: resend or refund."),
            ("b", "For a parcel that's late but not yet lost, refund the shipping fee and send a "
                  "10% discount code."),
            ("h", "Wrong scent received"),
            ("b", "Send the correct item immediately and email a prepaid return label."),
            ("h", "Candle quality complaint (poor scent throw, tunnelling, smoking)"),
            ("b", "Offer a replacement. If it's a repeat complaint about the same SKU, flag the "
                  "batch to the maker and pause sales of that SKU."),
            ("h", "Allergic reaction"),
            ("b", "Full refund, no return needed. Ask which ingredient so we can review the recipe."),
            ("h", "Pricing / 'is this on sale' questions"),
            ("b", "No action - just answer. Do not create a discount unless a manager approves it."),
        ],
    )


# --------------------------------------------------------------------- PowerPoint
def write_deck() -> Path:
    from pptx import Presentation
    from pptx.util import Inches

    prs = Presentation()
    title_layout = prs.slide_layouts[0]
    bullet_layout = prs.slide_layouts[1]

    s = prs.slides.add_slide(title_layout)
    s.shapes.title.text = "Little Flame Candles - Monthly Review"
    s.placeholders[1].text = "May 2026 - internal"

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Highlights"
    tf = s.placeholders[1].text_frame
    tf.text = "Revenue £6,180 this month, up 9% on April"
    for line in [
        "Website is now 61% of sales, Etsy 22%",
        "Two scents are being sold below cost and need repricing",
        "Sea Salt & Sage and Winter Pine are close to stock-out",
    ]:
        tf.add_paragraph().text = line

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Sales by channel (£, last 3 months)"
    t = s.shapes.add_table(4, 4, Inches(0.6), Inches(1.7), Inches(8.5), Inches(2.4)).table
    for ci, h in enumerate(["Channel", "Mar", "Apr", "May"]):
        t.cell(0, ci).text = h
    for ri, row in enumerate(
        [("Website", "2,910", "3,380", "3,770"),
         ("Etsy", "1,240", "1,180", "1,360"),
         ("Wholesale", "980", "1,110", "1,050")],
        start=1,
    ):
        for ci, v in enumerate(row):
            t.cell(ri, ci).text = v

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Issues to fix"
    tf = s.placeholders[1].text_frame
    tf.text = "Amber & Oud: unit cost £5.30, sells for £5.00 - loss of £0.30/unit"
    for line in [
        "Winter Pine: unit cost £4.70, sells for £4.50 - loss of £0.20/unit",
        "Reprice both to a 55% gross margin from 1 June",
        "3 late-delivery complaints this month, all the same courier",
    ]:
        tf.add_paragraph().text = line

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Next month"
    tf = s.placeholders[1].text_frame
    tf.text = "Reprice the two loss-making scents"
    for line in [
        "Reorder glass jars now (14-day lead time)",
        "Trial a second courier for tracked UK delivery",
        "Add fragrance-ingredient list to every Etsy listing",
    ]:
        tf.add_paragraph().text = line

    out = ROOT / "monthly-review.pptx"
    prs.save(out)
    return out


if __name__ == "__main__":
    for fn in (write_returns, write_shipping, write_catalogue, write_orders, write_faq, write_deck):
        print(f"wrote {fn()}")
