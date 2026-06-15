"use client";

import { useState } from "react";
import { Download, Share2, Shield, Globe, Clock, CheckCircle, AlertTriangle, Printer, Mail, Send, X } from "lucide-react";
import { ScanReport } from "@/types/audit";
import { ScoreGauge } from "./ScoreGauge";
import { CategoryCard } from "./CategoryCard";
import { format } from "date-fns";
import Image from "next/image";

export function AuditReport({ report }: { report: ScanReport }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });

      const NAVY = "#0B1F3A";
      const BLUE = "#1E5FA8";
      const LIGHT_BLUE = "#EAF2FB";
      const GREY = "#6B7280";
      const LIGHT_GREY = "#F4F5F7";

      const SEV_STYLE = {
        PASS: { color: "#1E8E5A", bg: "#E6F4EC" },
        INFO: { color: "#3478C4", bg: "#E6EFFA" },
        LOW: { color: "#8A8F45", bg: "#F3F4DD" },
        MEDIUM: { color: "#C9A227", bg: "#FBF4DD" },
        HIGH: { color: "#E0792A", bg: "#FCEBDD" },
        CRITICAL: { color: "#D14343", bg: "#FBE6E6" }
      } as const;

      const scoreColor = (s: number) => {
        if (s >= 90) return SEV_STYLE.PASS;
        if (s >= 75) return SEV_STYLE.INFO;
        if (s >= 60) return SEV_STYLE.MEDIUM;
        if (s >= 40) return SEV_STYLE.HIGH;
        return SEV_STYLE.CRITICAL;
      };

      const addText = (text: string, x: number, y: number, size: number, color: string, weight: "normal"|"bold" = "normal", align: "left"|"center"|"right" = "left") => {
        doc.setFont("helvetica", weight);
        doc.setFontSize(size);
        doc.setTextColor(color);
        doc.text(text, x, y, { align });
      };

      const counts = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, PASS: 0 };
      report.checkResults.forEach(cat => {
        cat.findings.forEach(f => {
          const fSev = f.riskLevel === "CRITICAL" ? "HIGH" : f.riskLevel;
          if (counts[fSev as keyof typeof counts] !== undefined) {
            counts[fSev as keyof typeof counts]++;
          }
        });
      });

      let y = 0;
      const marginX = 40;
      const pageWidth = 612;
      const pageHeight = 792;

      const newPage = () => {
        doc.addPage();
        y = marginX;
        doc.setFillColor(NAVY);
        doc.rect(0, 0, pageWidth, 8, "F");
        doc.setFillColor(BLUE);
        doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
      };

      doc.setFillColor(NAVY);
      doc.rect(0, 0, pageWidth, 8, "F");
      doc.setFillColor(BLUE);
      doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

      y = 60;
      
      try {
        const logoRes = await fetch("/logo.png");
        if (!logoRes.ok) throw new Error("Failed to fetch logo");
        const logoBlob = await logoRes.blob();
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        
        // 1.7 inch width = 1.7 * 72 = 122.4 pt. Height = 122.4 * (155/384) = 49.4 pt
        doc.addImage(base64data, "PNG", marginX, y, 122.4, 49.4);
        
        // Offset text to the right by 2.0 inches (144 pt)
        addText("Web Application", marginX + 144, y + 18, 24, NAVY, "bold");
        addText("Security Audit Report", marginX + 144, y + 46, 24, NAVY, "bold");
      } catch (err) {
        // Fallback if logo fails
        addText("Web Application", marginX, y + 18, 24, NAVY, "bold");
        addText("Security Audit Report", marginX, y + 46, 24, NAVY, "bold");
      }
      
      y += 80;

      addText(`Target: ${report.target.url}`, marginX, y, 10.5, GREY);
      addText(`Date: ${format(new Date(report.startedAt), "MMM dd, yyyy HH:mm")}`, marginX + 280, y, 10.5, GREY);
      y += 20;

      doc.setDrawColor(BLUE);
      doc.setLineWidth(1.2);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 40;

      const score = report.score?.numeric || 0;
      const scColor = scoreColor(score);
      doc.setDrawColor(scColor.color);
      doc.setFillColor(scColor.bg);
      doc.setLineWidth(4);
      doc.circle(marginX + 50, y + 40, 45, "FD");
      
      addText(score.toString(), marginX + 50, y + 45, 26, scColor.color, "bold", "center");
      addText("/ 100", marginX + 50, y + 60, 8, scColor.color, "normal", "center");

      doc.setFillColor(LIGHT_BLUE);
      doc.setDrawColor("#D6E4F5");
      doc.setLineWidth(0.5);
      doc.roundedRect(marginX + 130, y, 380, 80, 6, 6, "FD");
      
      const sevs = ["HIGH", "MEDIUM", "LOW", "INFO", "PASS"] as const;
      const boxW = 380 / 5;
      sevs.forEach((sev, i) => {
        const sx = marginX + 130 + i * boxW + boxW / 2;
        addText(counts[sev].toString(), sx, y + 35, 18, SEV_STYLE[sev].color, "bold", "center");
        addText(sev, sx, y + 55, 8, GREY, "bold", "center");
      });

      y += 110;
      addText("Category Breakdown", marginX, y, 12.5, NAVY, "bold");
      y += 10;
      doc.setDrawColor("#D6DAE0");
      doc.setLineWidth(0.6);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      report.checkResults.forEach(cat => {
        const catH = 40 + (cat.findings.length > 0 ? cat.findings.length * 20 : 20);
        if (y + catH > pageHeight - 50) {
          newPage();
          y += 40;
        }

        const catCol = scoreColor(cat.score);
        doc.setFillColor(catCol.bg);
        doc.setDrawColor("#E2E5EA");
        doc.roundedRect(marginX, y, pageWidth - marginX * 2, catH, 6, 6, "FD");
        doc.setDrawColor(catCol.color);
        doc.setLineWidth(0.75);
        doc.line(marginX, y + 30, pageWidth - marginX, y + 30);

        addText(cat.category.replace(/_/g, " "), marginX + 10, y + 20, 11.5, NAVY, "bold");
        
        doc.setFillColor(LIGHT_GREY);
        doc.roundedRect(marginX + 280, y + 12, 120, 8, 4, 4, "F");
        if (cat.score > 0) {
          doc.setFillColor(catCol.color);
          doc.roundedRect(marginX + 280, y + 12, Math.max(120 * (cat.score / 100), 8), 8, 4, 4, "F");
        }

        doc.setFillColor(catCol.bg);
        doc.setDrawColor(catCol.color);
        doc.roundedRect(marginX + 420, y + 8, 40, 16, 4, 4, "FD");
        addText(cat.score.toString(), marginX + 440, y + 19, 10, catCol.color, "bold", "center");

        let fy = y + 45;
        if (cat.findings.length === 0) {
          addText("No findings reported.", marginX + 15, fy, 9.5, GREY);
        } else {
          cat.findings.forEach(f => {
            const fSev = (f.riskLevel === "CRITICAL" ? "HIGH" : f.riskLevel) as keyof typeof SEV_STYLE;
            const style = SEV_STYLE[fSev] || SEV_STYLE.INFO;
            
            doc.setFillColor(style.bg);
            doc.setDrawColor(style.color);
            doc.roundedRect(marginX + 10, fy - 10, 50, 14, 2, 2, "FD");
            addText(f.riskLevel, marginX + 35, fy, 7, style.color, "bold", "center");
            
            addText(f.title.substring(0, 80) + (f.title.length > 80 ? "..." : ""), marginX + 70, fy, 9.3, "#2A2E35");
            fy += 20;
          });
        }
        y += catH + 15;
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addText("Generated by SecureX Cybersecurity Solutions", pageWidth / 2, pageHeight - 15, 8, GREY, "normal", "center");
        addText(`Page ${i}`, pageWidth - marginX, 20, 8, GREY, "normal", "right");
      }

      doc.save(`securex-report-${new URL(report.target.url).hostname}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    }
    setDownloading(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;
    
    setSendingEmail(true);
    setEmailStatus("idle");

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailAddress,
          reportUrl: window.location.href,
          score: report.score?.numeric || 0,
          targetUrl: report.target.url,
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");
      
      setEmailStatus("success");
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailStatus("idle");
        setEmailAddress("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    } finally {
      setSendingEmail(false);
    }
  };

  const domain = (() => {
    try { return new URL(report.target.url).hostname; }
    catch { return report.target.url; }
  })();

  const criticalIssues = report.checkResults.flatMap((c) =>
    c.findings.filter((f) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH")
  ).length;

  return (
    <div className="light-theme-report w-full max-w-[1100px] mx-auto flex flex-col gap-8 bg-[var(--bg-base)] text-[var(--text-primary)] p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl">
      
      {/* ── Branding Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b-2 border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SecureX Logo" width={140} height={35} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.05em", color: "var(--text-muted)" }}>
            | Report
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-3 items-center relative w-full md:w-auto mt-4 md:mt-0">
          <button onClick={() => setEmailModalOpen(true)} className="btn-secondary flex items-center gap-2" style={{ padding: "8px 16px", fontSize: 13, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
            <Mail size={15} /> Email
          </button>
          <button onClick={() => window.print()} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
            <Printer size={15} /> Print
          </button>
          <button onClick={handleDownloadPdf} disabled={downloading} className="btn-primary" style={{ padding: "8px 16px", fontSize: 13, background: "var(--text-primary)", color: "var(--bg-surface)", border: "none" }}>
            {downloading ? <span className="animate-spin">⟳</span> : <Download size={15} />}
            Export PDF
          </button>
          <button onClick={handleShare} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            <Share2 size={15} />
            {copied ? "Copied Link" : "Share"}
          </button>

          {/* Email Modal / Dropdown */}
          {emailModalOpen && (
            <div style={{ position: "absolute", top: "110%", right: 0, width: 320, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 16, padding: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", zIndex: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={16} color="var(--accent-primary)" /> Email Report
                </h4>
                <button onClick={() => setEmailModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input 
                  type="email" 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                />
                <button type="submit" disabled={sendingEmail} className="btn-primary" style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, background: "var(--accent-primary)", color: "#fff" }}>
                  {sendingEmail ? <span className="animate-spin">⟳</span> : <Send size={15} />}
                  {sendingEmail ? "Sending..." : "Send Report"}
                </button>
                {emailStatus === "success" && <div style={{ color: "#10b981", fontSize: 12, textAlign: "center", fontWeight: 600 }}>Email sent successfully!</div>}
                {emailStatus === "error" && <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", fontWeight: 600 }}>Failed to send email. Try again.</div>}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Header ── */}
      <div className="glass-card-elevated flex flex-col md:flex-row flex-wrap gap-10 items-center justify-between p-6 sm:p-10">
        <div className="flex-1 min-w-[280px] w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9" }}>
              <Globe size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{domain}</h1>
              <a href={report.target.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "none" }} className="hover:text-sky-600">
                {report.target.url}
              </a>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <Clock size={16} /> {format(new Date(report.startedAt), "MMM dd, yyyy · HH:mm")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: criticalIssues > 0 ? "#dc2626" : "#059669", fontSize: 14, fontWeight: 600 }}>
              {criticalIssues > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {criticalIssues} High/Critical Threats
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-6 md:mt-0 w-full md:w-auto">
          <ScoreGauge score={report.score?.numeric || 0} size={200} lightMode={true} />
        </div>
      </div>

      {/* ── Categories ── */}
      <div style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif" }}>Detailed Security Findings</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {report.checkResults.map((res) => (
            <CategoryCard key={res.category} category={res.category as any} result={res} />
          ))}
        </div>
      </div>

    </div>
  );
}
