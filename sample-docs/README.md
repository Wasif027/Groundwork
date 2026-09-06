# Sample documents — "Little Flame Candles" (a fictional online shop)

Upload these through the app (**Add document**) to have something realistic to
try. Everything here is invented.

Uploads are **PDF / Word / Excel / PowerPoint** only. (Google Sheets/Slides:
*File → Download* to `.xlsx` / `.pptx`.)

The **Category** dropdown is a fixed list. Suggested mapping:

| File to upload | Category | What it's for |
| -------------- | -------- | ------------- |
| `returns-and-refunds-policy.pdf` | `policy` | Q&A, page-numbered citations |
| `shipping-information.docx` | `policy` | everyday Q&A |
| `product-catalogue.xlsx` | `data` | **analytics** — margins, "sold at a loss", stock vs reorder level, supplier lead times (Products ⋈ Suppliers) |
| `orders-last-90-days.xlsx` | `sales` | **analytics** — revenue by month / channel / country, refund rate, best sellers |
| `complaints-and-faq-handbook.docx` | `policy` | Q&A + drives **next-step suggestions** ("email the customer offering a replacement", "flag the batch") |
| `monthly-review.pptx` | `deck` | **deck summary** — the sales-table slide and the "issues" slide are the data-rich ones |

See **`TEST-PROMPTS.md`** for a walk-through of every feature.

## Regenerating the sample files

```bash
pip install fpdf2 openpyxl python-pptx python-docx
python scripts/make_candleshop_samples.py
```
