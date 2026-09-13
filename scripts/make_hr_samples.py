"""Generate a fictional HR sample corpus for QA testing Groundwork end to end.

    pip install fpdf2 openpyxl python-pptx python-docx
    python scripts/make_hr_samples.py

Writes into a throwaway qa-docs/ folder (not committed, not sample-docs/ —
this is a QA fixture, not part of the shipped demo corpus):
  employee-handbook.pdf
  remote-work-policy-v1.docx / remote-work-policy-v2.docx  (compare mode)
  grievance-and-conduct-handbook.docx                       (drives suggestions)
  headcount-and-compensation.xlsx                           (Departments + Employees)
  people-ops-quarterly-review.pptx
"""

from __future__ import annotations

import datetime as dt
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "qa-docs"
ROOT.mkdir(exist_ok=True)
RNG = random.Random(42)

DEPARTMENTS = [
    # dept, headcount, monthly_budget, monthly_payroll
    ("Engineering", 24, 180000, 176400),
    ("Sales", 18, 120000, 133200),          # over budget
    ("Customer Support", 12, 54000, 51200),
    ("HR", 5, 28000, 27500),
    ("Marketing", 9, 58000, 61800),         # over budget
    ("Finance", 6, 42000, 40100),
]

FIRST = ["Amara", "Ben", "Chidi", "Dana", "Eli", "Farah", "Grace", "Hassan", "Ines", "Jack",
         "Kira", "Liam", "Mona", "Noah", "Priya", "Quinn", "Rosa", "Sam", "Tara", "Umar",
         "Vera", "Will", "Xin", "Yara", "Zane"]
TITLES = {
    "Engineering": ["Software Engineer", "Senior Software Engineer", "Engineering Manager", "QA Engineer"],
    "Sales": ["Account Executive", "Sales Development Rep", "Sales Manager"],
    "Customer Support": ["Support Agent", "Senior Support Agent", "Support Team Lead"],
    "HR": ["HR Generalist", "Recruiter", "HR Manager"],
    "Marketing": ["Marketing Executive", "Content Marketer", "Marketing Manager"],
    "Finance": ["Financial Analyst", "Accountant"],
}
SALARY_BAND = {
    "Software Engineer": (48000, 62000), "Senior Software Engineer": (65000, 82000),
    "Engineering Manager": (85000, 98000), "QA Engineer": (42000, 54000),
    "Account Executive": (38000, 52000), "Sales Development Rep": (30000, 38000),
    "Sales Manager": (60000, 75000), "Support Agent": (26000, 32000),
    "Senior Support Agent": (32000, 38000), "Support Team Lead": (40000, 48000),
    "HR Generalist": (34000, 42000), "Recruiter": (36000, 46000), "HR Manager": (55000, 68000),
    "Marketing Executive": (32000, 40000), "Content Marketer": (30000, 38000),
    "Marketing Manager": (52000, 64000), "Financial Analyst": (40000, 52000),
    "Accountant": (36000, 46000),
}


def build_employees() -> list[dict]:
    rows, used_names, eid = [], set(), 1001
    start = dt.date(2026, 6, 15)  # "last 90 days" window ends ~2026-09-13
    for dept, headcount, *_ in DEPARTMENTS:
        for _ in range(headcount):
            name = RNG.choice(FIRST)
            while name in used_names:
                name = RNG.choice(FIRST) + str(RNG.randint(2, 9))
            used_names.add(name)
            title = RNG.choice(TITLES[dept])
            lo, hi = SALARY_BAND[title]
            salary = RNG.randint(lo, hi)
            hire = dt.date(2021, 1, 1) + dt.timedelta(days=RNG.randint(0, 1700))
            status, term_date = "active", ""
            # Sales gets a visible attrition problem; everyone else mostly stable.
            leave_chance = 0.28 if dept == "Sales" else 0.05
            if RNG.random() < leave_chance:
                status = "terminated"
                term_date = (start + dt.timedelta(days=RNG.randint(0, 89))).isoformat()
            elif RNG.random() < 0.04:
                status = "on_leave"
            rows.append({
                "employee_id": f"E-{eid}", "name": name, "department": dept, "title": title,
                "salary_gbp": salary, "hire_date": hire.isoformat(), "status": status,
                "termination_date": term_date,
            })
            eid += 1
    # One clear top-of-the-house outlier for "who is paid the most" questions.
    rows.append({
        "employee_id": f"E-{eid}", "name": "Priya Okonkwo-Chen", "department": "Engineering",
        "title": "VP of Engineering", "salary_gbp": 142000, "hire_date": "2022-03-01",
        "status": "active", "termination_date": "",
    })
    return rows


def write_headcount() -> Path:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Departments"
    ws.append(["department", "headcount", "monthly_budget_gbp", "monthly_payroll_gbp"])
    for row in DEPARTMENTS:
        ws.append(list(row))

    ws2 = wb.create_sheet("Employees")
    emp = build_employees()
    headers = list(emp[0].keys())
    ws2.append(headers)
    for r in emp:
        ws2.append([r[h] for h in headers])

    out = ROOT / "headcount-and-compensation.xlsx"
    wb.save(out)
    return out


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


def write_remote_v1() -> Path:
    return _docx(
        ROOT / "remote-work-policy-v1.docx",
        "Remote Work Policy (v1 — effective Jan 2025)",
        [
            ("p", "This policy sets out the company's approach to remote and hybrid working."),
            ("h", "Eligibility"),
            ("p", "Employees may work from home up to 2 days per week, subject to manager approval "
                  "and role suitability. Customer Support and reception roles are office-based."),
            ("h", "Core hours"),
            ("p", "All staff must be in the office Monday, Wednesday and Friday. On remote days, "
                  "staff must be reachable 10:00-16:00."),
            ("h", "Equipment"),
            ("p", "The company provides a laptop. Home-office equipment (desk, chair, monitor) is "
                  "not reimbursed under this policy."),
            ("h", "Review"),
            ("p", "Managers review each employee's remote arrangement every 6 months."),
        ],
    )


def write_remote_v2() -> Path:
    return _docx(
        ROOT / "remote-work-policy-v2.docx",
        "Remote Work Policy (v2 — effective Aug 2026)",
        [
            ("p", "This policy replaces the January 2025 remote work policy."),
            ("h", "Eligibility"),
            ("p", "Employees may work fully remote, anywhere in the UK, unless their role requires "
                  "a physical presence (Customer Support floor staff, reception, warehouse)."),
            ("h", "Core hours"),
            ("p", "No fixed office days. All staff must be reachable 11:00-15:00 UK time on working "
                  "days. The whole company meets in person once per quarter for an all-hands."),
            ("h", "Equipment"),
            ("p", "A £300/year home-office equipment stipend is available on request, plus the "
                  "standard company laptop."),
            ("h", "Review"),
            ("p", "Arrangements are reviewed annually, or sooner if performance concerns arise."),
        ],
    )


def write_grievance_handbook() -> Path:
    return _docx(
        ROOT / "grievance-and-conduct-handbook.docx",
        "Grievance & Conduct Handbook",
        [
            ("p", "Guidance for HR and people managers handling common employee-relations situations. "
                  "Always document the conversation and follow up in writing within 48 hours."),
            ("h", "Harassment or bullying complaint received"),
            ("b", "Acknowledge the complaint within 2 working days and keep it confidential."),
            ("b", "Open a formal grievance case and assign an independent investigator (never the "
                  "complainant's direct manager)."),
            ("b", "Do not discuss the complaint with the accused until the investigation plan is set."),
            ("h", "Repeated lateness or unauthorised absence"),
            ("b", "First occurrence: informal verbal conversation, note it in the 1:1 log."),
            ("b", "Second occurrence within 3 months: formal verbal warning, HR cc'd."),
            ("b", "Continued pattern: move to the written-warning stage of the disciplinary process."),
            ("h", "Performance improvement needed"),
            ("b", "Agree a Performance Improvement Plan (PIP) with clear, measurable goals and a "
                  "6-8 week timeline."),
            ("b", "Schedule fortnightly check-ins and document progress against each goal."),
            ("h", "Employee requests a reasonable adjustment"),
            ("b", "Meet with the employee and, where relevant, occupational health, within 2 weeks."),
            ("b", "Confirm the agreed adjustment in writing and review after 4 weeks."),
            ("h", "Resignation from a high performer"),
            ("b", "Manager and HR jointly hold a stay conversation before accepting, if there's time."),
            ("b", "Conduct an exit interview regardless of outcome and log themes for the quarterly review."),
            ("h", "Team showing high attrition"),
            ("b", "Pull turnover and engagement data for the team; compare against the company average."),
            ("b", "Run anonymous pulse survey and hold skip-level conversations before proposing changes."),
        ],
    )


def write_handbook() -> Path:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 10, "Employee Handbook", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    body = [
        ("Annual leave",
         "Full-time employees accrue 25 days of annual leave per year, plus UK bank holidays. "
         "Leave is pro-rated for part-time staff and accrues from the first day of employment. "
         "Up to 5 unused days may be carried into the next year with manager approval."),
        ("Sick leave",
         "Employees should notify their manager before 9:30am on the first day of absence. "
         "Sick leave is uncapped for genuine illness; absences of more than 5 consecutive days "
         "require a doctor's note. Persistent short-term absence is reviewed under the attendance "
         "policy, not the disciplinary process, unless there is evidence of misuse."),
        ("Parental leave",
         "Eligible employees receive 16 weeks of paid parental leave, followed by the option of "
         "unpaid leave up to statutory limits. Employees should give at least 8 weeks' notice."),
        ("Code of conduct",
         "Employees are expected to treat colleagues, customers and partners with respect. "
         "Harassment, bullying and discrimination of any kind are not tolerated and will be "
         "investigated under the grievance procedure."),
        ("Disciplinary process",
         "Where informal conversation does not resolve a conduct or performance issue, the formal "
         "process runs: verbal warning, written warning, final written warning, then dismissal. "
         "Each stage remains on file for 12 months. Gross misconduct may result in immediate "
         "dismissal without following earlier stages."),
        ("Grievance procedure",
         "An employee with a concern should raise it with their manager in the first instance, or "
         "with HR directly if the concern involves their manager. See the Grievance & Conduct "
         "Handbook for how HR should respond."),
        ("Probation",
         "New employees serve a 3-month probation period, extendable by up to 1 month at the "
         "manager's discretion. Either party may end employment during probation with 1 week's "
         "notice."),
    ]
    for head, text in body:
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, head, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, text)
    out = ROOT / "employee-handbook.pdf"
    pdf.output(str(out))
    return out


def write_deck() -> Path:
    from pptx import Presentation
    from pptx.util import Inches

    prs = Presentation()
    title_layout = prs.slide_layouts[0]
    bullet_layout = prs.slide_layouts[1]

    s = prs.slides.add_slide(title_layout)
    s.shapes.title.text = "People Ops — Quarterly Review"
    s.placeholders[1].text = "Q3 2026 — internal, HR leadership"

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Highlights"
    tf = s.placeholders[1].text_frame
    tf.text = "Headcount 74 across 6 departments, up 3 this quarter"
    for line in [
        "Overall engagement score 6.9/10, down from 7.8 last quarter",
        "Sales attrition running well above the company average",
        "Two departments are over their monthly payroll budget",
    ]:
        tf.add_paragraph().text = line

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Benefit enrolment (% of eligible staff)"
    t = s.shapes.add_table(4, 3, Inches(0.6), Inches(1.7), Inches(8.5), Inches(2.2)).table
    for ci, h in enumerate(["Benefit", "Q2 2026", "Q3 2026"]):
        t.cell(0, ci).text = h
    for ri, row in enumerate(
        [("Private health cover", "81%", "84%"),
         ("Pension (above minimum)", "62%", "65%"),
         ("Dental", "40%", "47%")],
        start=1,
    ):
        for ci, v in enumerate(row):
            t.cell(ri, ci).text = v

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Issues to fix"
    tf = s.placeholders[1].text_frame
    tf.text = "Sales attrition is roughly 3x the company average this quarter"
    for line in [
        "Marketing and Sales are both over monthly payroll budget",
        "Engagement score dropped a full point company-wide",
        "Exit interviews cite unclear progression and target pressure in Sales",
    ]:
        tf.add_paragraph().text = line

    s = prs.slides.add_slide(bullet_layout)
    s.shapes.title.text = "Next quarter"
    tf = s.placeholders[1].text_frame
    tf.text = "Run a Sales-specific engagement and pay-benchmarking review"
    for line in [
        "Rebuild the Sales career ladder with clearer progression criteria",
        "Revisit Marketing and Sales headcount plans against budget",
        "Re-run the engagement survey in 8 weeks to check for movement",
    ]:
        tf.add_paragraph().text = line

    out = ROOT / "people-ops-quarterly-review.pptx"
    prs.save(out)
    return out


if __name__ == "__main__":
    for fn in (write_handbook, write_remote_v1, write_remote_v2, write_grievance_handbook,
               write_headcount, write_deck):
        print(f"wrote {fn()}")
