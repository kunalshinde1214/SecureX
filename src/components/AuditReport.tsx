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
      const doc = new jsPDF();

      // White background for report
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(24);
      doc.text("SecureX Audit Report", 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text(`Target: ${report.target.url}`, 20, 45);
      doc.text(`Date: ${format(new Date(report.startedAt), "MMM dd, yyyy HH:mm")}`, 20, 52);
      doc.text(`Overall Score: ${report.score?.numeric || 0}/100`, 20, 59);

      let y = 80;
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Detailed Findings", 20, y);
      y += 15;

      report.checkResults.forEach((res) => {
        if (y > 270) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(14, 165, 233); // sky-500
        doc.text(`${res.category.replace(/_/g, " ")} - Score: ${res.score}`, 20, y);
        y += 8;

        res.findings.forEach(f => {
          if (y > 270) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); y = 20; }
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85); // slate-700
          doc.text(`[${f.riskLevel}] ${f.title}`, 25, y);
          y += 6;
        });
        y += 6;
      });

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
    <div className="light-theme-report" style={{ 
      width: "100%", 
      maxWidth: 1100, 
      margin: "0 auto", 
      display: "flex", 
      flexDirection: "column", 
      gap: 32,
      background: "var(--bg-base)",
      color: "var(--text-primary)",
      padding: "24px 32px",
      borderRadius: "24px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    }}>
      
      {/* ── Branding Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="SecureX Logo" width={140} height={35} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.05em", color: "var(--text-muted)" }}>
            | Report
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
          <button onClick={() => setEmailModalOpen(true)} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
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
      <div className="glass-card-elevated" style={{ padding: "40px", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
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
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
              <Clock size={16} /> {format(new Date(report.startedAt), "MMM dd, yyyy · HH:mm")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: criticalIssues > 0 ? "#dc2626" : "#059669", fontSize: 14, fontWeight: 600 }}>
              {criticalIssues > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {criticalIssues} High/Critical Threats
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
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
