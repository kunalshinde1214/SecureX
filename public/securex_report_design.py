from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    HRFlowable, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase.pdfmetrics import stringWidth

# ---------- Palette ----------
NAVY = colors.HexColor("#0B1F3A")
BLUE = colors.HexColor("#1E5FA8")
LIGHT_BLUE = colors.HexColor("#EAF2FB")
GREY = colors.HexColor("#6B7280")
LIGHT_GREY = colors.HexColor("#F4F5F7")
WHITE = colors.white

# Risk colors
GREEN = colors.HexColor("#1E8E5A")
GREEN_BG = colors.HexColor("#E6F4EC")
YELLOW = colors.HexColor("#C9A227")
YELLOW_BG = colors.HexColor("#FBF4DD")
ORANGE = colors.HexColor("#E0792A")
ORANGE_BG = colors.HexColor("#FCEBDD")
RED = colors.HexColor("#D14343")
RED_BG = colors.HexColor("#FBE6E6")
BLUE_INFO = colors.HexColor("#3478C4")
BLUE_INFO_BG = colors.HexColor("#E6EFFA")

SEVERITY_STYLE = {
    "PASS":   (GREEN, GREEN_BG, "PASS"),
    "INFO":   (BLUE_INFO, BLUE_INFO_BG, "INFO"),
    "LOW":    (colors.HexColor("#8A8F45"), colors.HexColor("#F3F4DD"), "LOW"),
    "MEDIUM": (YELLOW, YELLOW_BG, "MEDIUM"),
    "HIGH":   (ORANGE, ORANGE_BG, "HIGH"),
    "CRITICAL": (RED, RED_BG, "CRITICAL"),
}

def score_color(score):
    if score >= 90:
        return GREEN, GREEN_BG
    elif score >= 75:
        return BLUE_INFO, BLUE_INFO_BG
    elif score >= 60:
        return YELLOW, YELLOW_BG
    elif score >= 40:
        return ORANGE, ORANGE_BG
    else:
        return RED, RED_BG

# ---------- Data ----------
TARGET = "https://turfthings.com"
DATE = "Jun 15, 2026 09:54"
OVERALL = 85

CATEGORIES = [
    ("Performance Testing", 80, [
        ("INFO", "Performance API Timeout"),
    ]),
    ("OSINT Recon", 100, [
        ("INFO", "InternetDB: 1 Open Ports"),
    ]),
    ("Compliance", 65, [
        ("MEDIUM", "GDPR: Cookie Consent Mechanism Missing"),
        ("MEDIUM", "PCI-DSS: HSTS Not Configured"),
        ("INFO", "SOC 2: No WAF Detected"),
    ]),
    ("Third Party", 85, []),
    ("Input Validation", 90, [
        ("INFO", "1 Form(s) Detected"),
    ]),
    ("File Upload", 90, [
        ("PASS", "No File Upload Forms Detected"),
    ]),
    ("Security Headers", 40, [
        ("PASS", "Content-Security-Policy Header Present"),
        ("HIGH", "Missing Strict-Transport-Security Header"),
        ("MEDIUM", "Missing X-Frame-Options Header"),
        ("MEDIUM", "Missing X-Content-Type-Options Header"),
        ("MEDIUM", "Missing Referrer-Policy Header"),
        ("MEDIUM", "Missing Permissions-Policy Header"),
        ("LOW", "X-Powered-By Header Exposes Technology Stack"),
    ]),
    ("Threat Intelligence", 100, [
        ("PASS", "Clean Threat Intelligence Profile"),
    ]),
    ("Server Security", 65, [
        ("LOW", "Server Software Disclosed"),
        ("MEDIUM", "Framework Disclosed (X-Powered-By)"),
    ]),
    ("API Security", 90, [
        ("MEDIUM", "No Rate Limiting Detected"),
    ]),
    ("Backup Recovery", 100, [
        ("PASS", "No Exposed Backup Files Found"),
    ]),
    ("OWASP Top 10", 95, [
        ("INFO", "robots.txt Found"),
        ("MEDIUM", "Sensitive Paths Revealed in robots.txt"),
    ]),
    ("Logging & Monitoring", 75, [
        ("INFO", "security.txt Not Found"),
    ]),
    ("Auth & Access", 90, [
        ("INFO", "Exposed Login Portal: /admin"),
    ]),
    ("Database Security", 90, [
        ("INFO", "Hosting Provider Info: AS47583 Hostinger International Limited"),
        ("PASS", "Clean IP Reputation & No Exposed DB"),
    ]),
    ("Cloud Hosting", 65, [
        ("MEDIUM", "No WAF Detected"),
        ("INFO", "Host Reconnaissance: 1 Associated Records"),
        ("INFO", "Hosting Provider: AS47583 Hostinger International Limited"),
        ("PASS", "HTTP to HTTPS Redirect Configured"),
    ]),
    ("SSL / TLS", 100, []),
]

# ---------- Severity-weighted finding count ----------
sev_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0, "PASS": 0}
for _, _, findings in CATEGORIES:
    for sev, _ in findings:
        sev_counts[sev] += 1

# ---------- Styles ----------
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleStyle", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=24, textColor=NAVY, leading=28, spaceAfter=2
)
subtitle_style = ParagraphStyle(
    "SubtitleStyle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10.5, textColor=GREY, leading=14
)
section_header_style = ParagraphStyle(
    "SectionHeader", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=12.5, textColor=NAVY, spaceBefore=14, spaceAfter=6
)
cat_title_style = ParagraphStyle(
    "CatTitle", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=11.5, textColor=NAVY
)
finding_text_style = ParagraphStyle(
    "FindingText", parent=styles["Normal"], fontName="Helvetica",
    fontSize=9.3, textColor=colors.HexColor("#2A2E35"), leading=12.5
)
badge_text_style = ParagraphStyle(
    "BadgeText", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=8, leading=9, alignment=TA_CENTER
)
footer_style = ParagraphStyle(
    "Footer", parent=styles["Normal"], fontName="Helvetica",
    fontSize=8, textColor=GREY, alignment=TA_CENTER
)


# ---------- Custom flowables ----------
class ScoreCircle(Flowable):
    """A circular score badge."""
    def __init__(self, score, diameter=1.35 * inch, label="OVERALL SCORE"):
        super().__init__()
        self.score = score
        self.diameter = diameter
        self.label = label

    def wrap(self, availWidth, availHeight):
        return self.diameter, self.diameter + 0.3 * inch

    def draw(self):
        c = self.canv
        d = self.diameter
        color, bg = score_color(self.score)
        # outer ring
        c.setStrokeColor(color)
        c.setLineWidth(5)
        c.setFillColor(bg)
        c.circle(d/2, d/2 + 0.18*inch, d/2 - 3, stroke=1, fill=1)
        # score number
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 26)
        text = str(self.score)
        tw = stringWidth(text, "Helvetica-Bold", 26)
        c.drawString(d/2 - tw/2, d/2 + 0.18*inch - 9, text)
        c.setFont("Helvetica", 8)
        sub = "/ 100"
        sw = stringWidth(sub, "Helvetica", 8)
        c.drawString(d/2 - sw/2, d/2 + 0.18*inch - 22, sub)


class CategoryScoreBar(Flowable):
    """A small horizontal progress bar colored by risk."""
    def __init__(self, score, width=1.6 * inch, height=8):
        super().__init__()
        self.score = score
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 2

    def draw(self):
        c = self.canv
        color, bg = score_color(self.score)
        c.setFillColor(LIGHT_GREY)
        c.roundRect(0, 0, self.width, self.height, self.height/2, stroke=0, fill=1)
        fill_w = self.width * (self.score / 100.0)
        if fill_w > 0:
            c.setFillColor(color)
            c.roundRect(0, 0, fill_w, self.height, self.height/2, stroke=0, fill=1)


def severity_badge(sev):
    color, bg, label = SEVERITY_STYLE.get(sev, (GREY, LIGHT_GREY, sev))
    t = Table([[Paragraph(label, ParagraphStyle(
        "B", parent=badge_text_style, textColor=color
    ))]], colWidths=[0.78*inch], rowHeights=[0.22*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def score_pill(score):
    color, bg = score_color(score)
    t = Table([[Paragraph(f"{score}", ParagraphStyle(
        "S", parent=badge_text_style, textColor=color, fontSize=10
    ))]], colWidths=[0.62*inch], rowHeights=[0.26*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.6, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    return t


# ---------- Build story ----------
story = []

# Header band: logo + title
logo = Image("/home/claude/work/logo.png", width=1.7*inch, height=1.7*inch*(155/384))

header_table = Table(
    [[logo, Paragraph("Web Application<br/>Security Audit Report", title_style)]],
    colWidths=[2.0*inch, 4.6*inch]
)
header_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (0, 0), "LEFT"),
]))
story.append(header_table)
story.append(Spacer(1, 6))

meta_table = Table(
    [[Paragraph(f"<b>Target:</b> {TARGET}", subtitle_style),
      Paragraph(f"<b>Date:</b> {DATE}", subtitle_style)]],
    colWidths=[4.0*inch, 2.6*inch]
)
story.append(meta_table)
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceAfter=10))

# Overall score + summary band
sev_summary_data = [
    [Paragraph(f"<b>{sev_counts['HIGH']}</b><br/><font size=7 color='#6B7280'>HIGH</font>",
               ParagraphStyle("x", parent=badge_text_style, textColor=ORANGE, fontSize=14, leading=16)),
     Paragraph(f"<b>{sev_counts['MEDIUM']}</b><br/><font size=7 color='#6B7280'>MEDIUM</font>",
               ParagraphStyle("x", parent=badge_text_style, textColor=YELLOW, fontSize=14, leading=16)),
     Paragraph(f"<b>{sev_counts['LOW']}</b><br/><font size=7 color='#6B7280'>LOW</font>",
               ParagraphStyle("x", parent=badge_text_style, textColor=colors.HexColor("#8A8F45"), fontSize=14, leading=16)),
     Paragraph(f"<b>{sev_counts['INFO']}</b><br/><font size=7 color='#6B7280'>INFO</font>",
               ParagraphStyle("x", parent=badge_text_style, textColor=BLUE_INFO, fontSize=14, leading=16)),
     Paragraph(f"<b>{sev_counts['PASS']}</b><br/><font size=7 color='#6B7280'>PASS</font>",
               ParagraphStyle("x", parent=badge_text_style, textColor=GREEN, fontSize=14, leading=16)),
     ]
]
sev_summary = Table(sev_summary_data, colWidths=[0.78*inch]*5)
sev_summary.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D6E4F5")),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))

overall_summary_table = Table(
    [[ScoreCircle(OVERALL), sev_summary]],
    colWidths=[1.6*inch, 5.0*inch]
)
overall_summary_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (0, 0), "CENTER"),
]))
story.append(overall_summary_table)
story.append(Spacer(1, 14))

story.append(Paragraph("Category Breakdown", section_header_style))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#D6DAE0"), spaceAfter=8))

# Category cards
for i, (name, score, findings) in enumerate(CATEGORIES):
    color, bg = score_color(score)

    cat_header = Table(
        [[Paragraph(name, cat_title_style), CategoryScoreBar(score), score_pill(score)]],
        colWidths=[3.3*inch, 1.65*inch, 0.72*inch]
    )
    cat_header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))

    rows = [[cat_header]]

    if findings:
        for sev, text in findings:
            frow = Table(
                [[severity_badge(sev), Paragraph(text, finding_text_style)]],
                colWidths=[0.9*inch, 4.8*inch]
            )
            frow.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            rows.append([frow])
    else:
        rows.append([Paragraph("No findings reported.", ParagraphStyle(
            "none", parent=finding_text_style, textColor=GREY, fontName="Helvetica-Oblique"
        ))])

    card = Table(rows, colWidths=[5.7*inch])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E5EA")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.75, color),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))

    story.append(card)
    story.append(Spacer(1, 8))

story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#D6DAE0"), spaceBefore=4, spaceAfter=8))
story.append(Paragraph(
    "Generated by SecureX Cybersecurity Solutions &nbsp;|&nbsp; Confidential Security Assessment Report",
    footer_style
))

# ---------- Page decoration ----------
def draw_page_frame(canvas, doc):
    canvas.saveState()
    # top accent bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, letter[1] - 0.12*inch, letter[0], 0.12*inch, stroke=0, fill=1)
    # bottom accent bar
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0, letter[0], 0.06*inch, stroke=0, fill=1)
    # page number
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawRightString(letter[0] - 0.6*inch, 0.3*inch, f"Page {doc.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    "/home/claude/work/SecureX_Audit_Report_TurfThings.pdf",
    pagesize=letter,
    topMargin=0.55*inch,
    bottomMargin=0.55*inch,
    leftMargin=0.6*inch,
    rightMargin=0.6*inch,
)
doc.build(story, onFirstPage=draw_page_frame, onLaterPages=draw_page_frame)
print("done")
