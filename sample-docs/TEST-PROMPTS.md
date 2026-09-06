# Full test procedure — Little Flame Candles

Work top to bottom. Each step says what it exercises and what you should see.
`[ ]` boxes are for a real pass.

---

## 0. Pre-flight

1. `[ ]` Stop any old servers, then start fresh:
   ```
   ./dev.ps1
   ```
   Wait for `backend -> http://localhost:8000` and `frontend -> http://localhost:3000`.
2. `[ ]` Backend booted clean — the terminal shows `startup_complete` and no
   `db_init_failed`. (On boot it auto-adds the `suggestions.kind` column and the
   chunk index — additive, safe.)
3. `[ ]` Right backend is answering:
   ```
   curl http://localhost:8000/health
   ```
   → `{"ok": true}`. If you see `"TrueNews"` anywhere, a stale server owns :8000 —
   kill it and restart.
4. `[ ]` Open http://localhost:3000 → **register** a fresh account (username +
   password ≥ 8). A new account starts empty.

## 1. Upload the corpus

Sidebar → **Add document** → file → set **Category** → upload. All six:

| File (`sample-docs/`) | Category |
| --------------------- | -------- |
| `returns-and-refunds-policy.pdf` | `policy` |
| `shipping-information.docx` | `policy` |
| `complaints-and-faq-handbook.docx` | `policy` |
| `product-catalogue.xlsx` | `data` |
| `orders-last-90-days.xlsx` | `sales` |
| `monthly-review.pptx` | `deck` |

5. `[ ]` All six land with a green dot + a section count. Wait for all before testing.

---

## 2. Plain Q&A + citations

Open a **new chat**. Ask one at a time (don't name a document — retrieval searches everything):

| Prompt | Expected |
| ------ | -------- |
| `What's the returns window?` | 30 days from delivery, unused, original packaging. |
| `A candle arrived broken — do I need to send it back?` | No — photo, then free replacement or refund. |
| `How much is UK delivery and when is it free?` | £3.95 Tracked 48, free over £40. |
| `When is a UK parcel considered lost?` | After 10 working days (25 international). |
| `Can someone return a sale item for a cash refund?` | No — store credit only unless faulty. |

6. `[ ]` Every answer has `[1]` (`[2]`…) markers **in the prose**, numbered from 1
   with no gaps.
7. `[ ]` Clicking a marker highlights that passage in the right panel.
8. `[ ]` Right panel: **cited passages appear first**, in `[1] [2]` order; uncited
   ones below with a faint dot (not a bold "01").
9. `[ ]` No "Next steps" appear for these — they're pure lookups.

---

## 3. Spreadsheet analytics

New chat. These route to the **analysis** path (a "computed answer" chip + the SQL + a result table in the panel).

| Prompt | Expected |
| ------ | -------- |
| `Which candles are we selling at a loss?` | Amber & Oud, Winter Pine (`sale_price < unit_cost`). |
| `What's total revenue by month?` | Mar / Apr / May totals — **line chart**. |
| `Which channel brings in the most revenue?` | website, then etsy — **bar chart**. |
| `What's our refund rate?` | refunded ÷ total orders, as a %. |
| `Which products are at or below their reorder level?` | Sea Salt & Sage, Winter Pine, Amber & Oud. |
| `Join the orders to the catalogue and show gross profit per scent.` | a cross-sheet JOIN. |
| `Which supplier has the longest lead time?` | The Jar Company (14 days) — Suppliers sheet. |
| `Give me the percentage earned by the top-selling scent.` | routes to analysis (this used to fail). |

10. `[ ]` Each has the **"computed answer"** chip; "Show query" reveals a
    `SELECT`; the panel names which sheets were used.
11. `[ ]` Typos still work — try `waht scent brings in the most muney` → still analysis.
12. `[ ]` Hover `orders-last-90-days.xlsx` in the sidebar → **▮▮ Analyse** button → data overview.

---

## 4. Deck summary (`monthly-review.pptx`)

New chat.

| Prompt | Expected |
| ------ | -------- |
| `Summarise the monthly review deck.` | "full-document read"; slides with `Slide N` badges in the panel. |
| `Which slides have the important numbers?` | the sales-by-channel table slide + the "issues" slide rank highest. |
| `What are the issues we need to fix?` | two loss-making scents + repeated late deliveries; `[n]` jumps to that slide. |

---

## 5. Next-step suggestions + the Run button

New chat. Situational questions produce **suggested next steps** in the right-hand "Next steps" tab.

13. `[ ]` `A customer emailed that their Sea Salt & Sage candle arrived smashed. What do I do?`
    → ~3 suggestions: reply offering replacement/refund · ask for a photo · log the breakage.
14. `[ ]` `Amber & Oud keeps selling below cost. What should I do about it?`
    → at least one suggestion is tagged as runnable and shows a **Run** button
    (e.g. "Review the margin on Amber & Oud").
15. `[ ]` Click **Run** on that one → it asks the question and drops a grounded
    answer into the chat; the suggestion flips to **done · "ran from suggestion"**.
16. `[ ]` A suggestion like "Email the customer" or "Reprice in the shop" has **no
    Run button** — Accept / Reject / Already done only.
17. `[ ]` **Reject** a suggestion → a different one takes its slot, tagged
    "Alternative" (up to 3, then the slot closes).
18. `[ ]` **Accept** one with a note (`done in Zendesk #812`).
19. `[ ]` `What's the returns window?` → **no suggestions** (pure lookup).
20. `[ ]` Top bar → **Suggestions** → the full history, filterable by status.
    Click a row → jumps to that chat and flashes the message that produced it.
21. `[ ]` Delete that chat → reopen the history → the row still exists, says
    "conversation deleted"; clicking it just says so.

---

## 6. Compare mode

22. `[ ]` Sidebar → tick `returns-and-refunds-policy.pdf` + `complaints-and-faq-handbook.docx`.
23. `[ ]` Ask `How should a broken-item claim be handled according to each document?`
    → "comparing documents" badge; retrieval restricted to those two; the answer contrasts them.
24. `[ ]` Untick both afterwards.

---

## 7. Confidence (the recalibration)

New chat.

| Prompt | Expected label |
| ------ | -------------- |
| `What is the minimum order value for free UK shipping?` | **high** (this used to read "medium") |
| `How many days do I have to return an unused candle?` | **high** |
| `Roughly how seasonal is demand?` | **medium** — inferred, not stated |
| `What's our policy on wholesale pricing tiers?` | **insufficient evidence** — "couldn't find anything… You have: Data & Reports, Policies, Sales" |

25. `[ ]` The clear factual questions read **high**, and the answer still has a
    `[1]` even when the fact sits in the 2nd-ranked passage.

---

## 8. Stability (the flip-flop fix)

26. `[ ]` In one chat, ask a borderline question twice in a row, verbatim —
    e.g. `Which slides have the important numbers?` then the same again.
    → **same verdict both times** (both answered, or both "couldn't find"). It must
    not answer one turn and refuse the next.

---

## 9. Multi-turn follow-ups

New chat, in order:

27. `[ ]` `What are the shipping options to Europe?`
28. `[ ]` `And how long does that take?` → understands "that" = Europe shipping (5–10 days).
29. `[ ]` `What if it gets lost?` → international lost after 25 working days → resend or refund.
30. `[ ]` **Reload the page** → the whole conversation is restored.

---

## 10. Robustness / edge cases

31. `[ ]` New chat, type `hi` → friendly one-liner, **no** "insufficient evidence"
    banner, and **no new chat saved** in the sidebar.
32. `[ ]` `what can you do?` → capability rundown that names your real categories
    (Data & Reports, Decks, Policies, Sales). Also not saved.
33. `[ ]` `what documents do I have?` → lists all six titles. (This one *is* saved.)
34. `[ ]` `what should a delivery company's standard delivery policy be?` → politely
    declines / answers only from your documents — no free-associating.
35. `[ ]` Rename a `.txt` file to `bad.pdf` and upload it → clear error toast
    ("couldn't read this PDF…"), not a crash. The row shows a red dot; hover it for
    the reason.
36. `[ ]` Log out → register a **second** account → ask `what's the refund policy?`
    → "you haven't added any documents yet…" prompt.

---

## 11. Optional — optimization sanity checks

37. `[ ]` Ask any question, then check the backend terminal — the `X-Process-Time`
    header / span timings should be well under a second for retrieval (LLM time is
    separate).
38. `[ ]` Re-ask an identical question in a new chat → returns near-instantly with a
    "cached" chip.
39. `[ ]` Watch the backend log during a burst of questions — a Gemini `429` is a
    free-tier rate limit, not a bug; the app retries. Slow down a few seconds.

---

## What to report if something's off

- The **exact prompt**, the **answer text**, the **confidence label**, and whether
  markers/citations were present.
- The backend terminal output around that request (it logs the plan mode, the
  retrieval, and any error).
