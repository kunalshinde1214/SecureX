"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Shield, Lock, Globe, Server, AlertTriangle, Database,
  Zap, Eye, FileSearch, Radio, Cpu, Terminal,
  ArrowRight, ChevronRight, Star, CheckCircle,
  TrendingUp, BarChart2, RefreshCw,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { URLInput } from "@/components/URLInput";
import { ScanProgress } from "@/components/ScanProgress";
import { AuditReport } from "@/components/AuditReport";
import { ScanReport } from "@/types/audit";

type AppState = "home" | "scanning" | "report";

/* ─── Typed Headline ─────────────────────────────────────────────────────── */
function TypedHeadline() {
  const words = ["Websites", "APIs", "Servers", "Domains", "Apps"];
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    } else if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2400);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % words.length);
    }
  }, [displayed, deleting, idx]);

  return (
    <span className="gradient-text" style={{ display: "inline-block", minWidth: 180, textAlign: "left" }}>
      {displayed}
      <span style={{ opacity: 0.7, animation: "blink 1s ease infinite" }}>|</span>
    </span>
  );
}

/* ─── Threat Counter ─────────────────────────────────────────────────────── */
function ThreatCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        let start = 0;
        const duration = 1800;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div className="gradient-text" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
        {count.toLocaleString()}{target >= 1000 ? "+" : ""}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontWeight: 500, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

/* ─── Feature Card ────────────────────────────────────────────────────────── */
interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  glow: string;
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Lock size={22} />, title: "SSL/TLS Deep Analysis",
    desc: "Certificate validity, TLS 1.0/1.1 deprecation, weak ciphers, HSTS policy, certificate chain, forward secrecy.",
    color: "#0ea5e9", glow: "rgba(14,165,233,0.2)", badge: "Critical",
  },
  {
    icon: <Shield size={22} />, title: "Security Headers",
    desc: "CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options and 6 more.",
    color: "#8b5cf6", glow: "rgba(139,92,246,0.2)", badge: "High Impact",
  },
  {
    icon: <AlertTriangle size={22} />, title: "OWASP Top 10",
    desc: "Passive detection of injection flaws, broken auth, XSS exposure, IDOR, sensitive data exposure.",
    color: "#ef4444", glow: "rgba(239,68,68,0.18)", badge: "OWASP",
  },
  {
    icon: <Globe size={22} />, title: "DNS & Email Security",
    desc: "DNSSEC validation, SPF/DMARC/DKIM configuration, CAA records, domain expiry, subdomain takeover.",
    color: "#10b981", glow: "rgba(16,185,129,0.18)", badge: "DNS",
  },
  {
    icon: <Server size={22} />, title: "Open Port Analysis",
    desc: "Detect exposed database ports (3306, 5432, 27017), admin interfaces, SSH, Telnet, RDP via Shodan.",
    color: "#f97316", glow: "rgba(249,115,22,0.18)", badge: "Network",
  },
  {
    icon: <Database size={22} />, title: "Threat Intelligence",
    desc: "Real-time checks against VirusTotal, AbuseIPDB, Shodan, Google Safe Browsing for malware & phishing.",
    color: "#06b6d4", glow: "rgba(6,182,212,0.18)", badge: "Threat Intel",
  },
  {
    icon: <FileSearch size={22} />, title: "CVE Vulnerability Scan",
    desc: "Match server fingerprint against NVD database to find known CVEs. Severity-ranked with CVSS scores.",
    color: "#dc2626", glow: "rgba(220,38,38,0.18)", badge: "CVE",
  },
  {
    icon: <Eye size={22} />, title: "Information Leakage",
    desc: "Detect exposed .env files, Git repos, backup files, debug endpoints, server version disclosure.",
    color: "#f59e0b", glow: "rgba(245,158,11,0.18)", badge: "OSINT",
  },
  {
    icon: <Radio size={22} />, title: "Automated Scheduling",
    desc: "Set up daily/weekly/monthly automated scans. Get alerted when your security score drops.",
    color: "#6366f1", glow: "rgba(99,102,241,0.18)", badge: "Pro",
  },
];

const APIS = [
  "SSL Labs (Qualys)", "Mozilla Observatory", "Shodan InternetDB",
  "Google DoH", "RDAP (IANA)", "crt.sh Certificate Transparency",
  "OSV.dev", "HackerTarget", "NVD (NIST)", "AbuseIPDB",
  "IPInfo.io", "VirusTotal", "Cloudflare DoH",
];

const HOW_STEPS = [
  { num: "01", icon: <Terminal size={24} />, title: "Enter URL", desc: "Paste any public URL — no account, no signup, no credit card required.", color: "#0ea5e9" },
  { num: "02", icon: <Cpu size={24} />, title: "AI-Powered Scan", desc: "15 security domains run in parallel using real-time threat intelligence APIs.", color: "#8b5cf6" },
  { num: "03", icon: <BarChart2 size={24} />, title: "Expert Report", desc: "Download a professional PDF report with risk scores, CVE mappings, and remediation steps.", color: "#10b981" },
];

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [scanId, setScanId] = useState("");
  const [scanUrl, setScanUrl] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then(setConfigs)
      .catch(() => {});
  }, []);

  const handleStartScan = useCallback(async (url: string, depth: "QUICK" | "STANDARD" | "DEEP") => {
    setScanError("");
    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, depth }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          setScanError("Rate limit reached. You can run up to 10 scans per hour. Please wait a moment.");
          return;
        }
        setScanError(err.error || "Failed to start scan. Please try again.");
        return;
      }

      const data = await res.json();
      setScanId(data.scanId);
      setScanUrl(url);
      setAppState("scanning");
    } catch {
      setScanError("Network error. Please check your connection and try again.");
    }
  }, []);

  const handleScanComplete = useCallback((r: ScanReport) => {
    setReport(r);
    setAppState("report");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("home");
    setScanId("");
    setScanUrl("");
    setReport(null);
    setScanError("");
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        {appState === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <LandingPage onStartScan={handleStartScan} configs={configs} scanError={scanError} />
          </motion.div>
        )}

        {appState === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ padding: "48px 24px", display: "flex", justifyContent: "center" }}>
            <ScanProgress scanId={scanId} targetUrl={scanUrl} onComplete={handleScanComplete} onCancel={handleReset} />
          </motion.div>
        )}

        {appState === "report" && report && (
          <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: "100%", maxWidth: 1160, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>Security Audit Report</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Generated by SecureX · securex.kunalshinde.me</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleReset} className="btn-secondary" style={{ fontSize: 13 }}>
                  ← Run New Scan
                </button>
              </div>
            </div>
            <AuditReport report={report} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────────────────── */
function LandingPage({
  onStartScan, configs, scanError,
}: {
  onStartScan: (url: string, depth: "QUICK" | "STANDARD" | "DEEP") => void;
  configs: Record<string, string>;
  scanError: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (url: string, depth: "QUICK" | "STANDARD" | "DEEP") => {
    setLoading(true);
    await onStartScan(url, depth);
    setLoading(false);
  };

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="cyber-grid"
        style={{
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Orbs */}
        <div style={{ position: "absolute", top: "5%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Animated Shield Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          style={{
            width: 80, height: 80, borderRadius: 22,
            background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15))",
            border: "1px solid rgba(14,165,233,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 28,
            boxShadow: "0 0 40px rgba(14,165,233,0.2), 0 0 80px rgba(14,165,233,0.08)",
          }}
          className="animate-float"
        >
          <Shield size={40} style={{ color: "#38bdf8" }} />
        </motion.div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="status-online"
          style={{ marginBottom: 28 }}
        >
          Threat Engine Active · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{
            fontSize: "clamp(38px, 5.5vw, 76px)",
            fontWeight: 900,
            lineHeight: 1.08,
            maxWidth: 900,
            marginBottom: 12,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          {configs.hero_headline || (
            <>
              Expose the Threats<br />
              Hiding in Your{" "}<TypedHeadline />
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{
            fontSize: "clamp(15px, 2vw, 19px)",
            color: "var(--text-secondary)",
            maxWidth: 580,
            lineHeight: 1.75,
            marginBottom: 48,
          }}
        >
          {configs.hero_subtitle ||
            "SecureX runs 15 parallel security checks — SSL/TLS, OWASP Top 10, CVEs, threat intelligence — and delivers a professional report in under 60 seconds. Free, instant, zero signup."}
        </motion.p>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <URLInput onSubmit={handleSubmit} loading={loading} />
          {scanError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                color: "#fca5a5",
                fontSize: 13,
                maxWidth: 560,
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              {scanError}
            </motion.div>
          )}
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: "flex", gap: 28, marginTop: 40, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}
        >
          {[
            { icon: <CheckCircle size={14} />, label: "No signup required" },
            { icon: <CheckCircle size={14} />, label: "Free forever" },
            { icon: <CheckCircle size={14} />, label: "15 security domains" },
            { icon: <CheckCircle size={14} />, label: "PDF & JSON export" },
          ].map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ color: "#34d399" }}>{t.icon}</span>
              {t.label}
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          style={{
            display: "flex", gap: 64, marginTop: 72,
            padding: "32px 64px",
            background: "rgba(12,18,40,0.6)",
            border: "1px solid var(--border-default)",
            borderRadius: 20,
            backdropFilter: "blur(20px)",
            flexWrap: "wrap",
            justifyContent: "center",
            boxShadow: "0 4px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(14,165,233,0.06)",
          }}
        >
          <ThreatCounter target={12847} label="Scans Completed" />
          <div style={{ width: 1, background: "var(--border-subtle)", alignSelf: "stretch" }} />
          <ThreatCounter target={15} label="Security Checks" />
          <div style={{ width: 1, background: "var(--border-subtle)", alignSelf: "stretch" }} />
          <ThreatCounter target={98} label="Avg Score Change %" />
          <div style={{ width: 1, background: "var(--border-subtle)", alignSelf: "stretch" }} />
          <ThreatCounter target={6} label="Threat Intel APIs" />
        </motion.div>
      </section>

      {/* ── Features Grid (Intelligence Core) ─────────────────────────────── */}
      <section style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ 
              display: "inline-flex", 
              marginBottom: 20,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              border: "1px solid var(--border-default)",
              padding: "6px 16px",
              borderRadius: 9999,
              background: "rgba(34,211,238,0.05)"
            }}
          >
            All systems operational // Intelligence Core
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ 
              fontSize: "clamp(32px, 5vw, 64px)", 
              fontWeight: 500, 
              marginBottom: 24, 
              fontFamily: "'Inter', sans-serif", 
              letterSpacing: "-0.02em",
              lineHeight: 1.04
            }}
          >
            Powering the future with<br />
            <span style={{ color: "var(--accent-primary)" }}>intelligent systems</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{ 
              fontSize: 16, 
              color: "var(--text-secondary)", 
              maxWidth: 640, 
              margin: "0 auto", 
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            NEXORA.SYSTEMS provides the infrastructure, intelligence, and tools to build, deploy, and scale autonomous systems that learn, adapt, and protect your digital assets in real-time.
          </motion.p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
          {[
            { title: "Data Ingestion", desc: "Real-time threat intelligence feeds from VirusTotal, AbuseIPDB, and Google Safe Browsing processing millions of signals per second.", icon: <Database size={24} /> },
            { title: "Adaptive Routing", desc: "Dynamic scan routing across 15 security domains, intelligently load-balancing SSL, OWASP, and network port analysis.", icon: <Radio size={24} /> },
            { title: "Secure Layer", desc: "Deep encryption and header validation ensuring your TLS/SSL certificates and Content Security Policies are bulletproof.", icon: <Lock size={24} /> },
            { title: "AI Processing", desc: "Machine learning heuristics identify anomalous server behaviors, information leakage, and misconfigured permissions instantly.", icon: <Cpu size={24} /> },
            { title: "Memory Grid", desc: "Persistent, immutable audit logging and historical diffing to track vulnerability remediation and regression over time.", icon: <Server size={24} /> },
            { title: "Threat Eradication", desc: "Automated actionable insights and generated remediation code snippets to instantly patch identified CVEs and OWASP flaws.", icon: <Zap size={24} /> },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              style={{ 
                padding: "32px", 
                position: "relative", 
                overflow: "hidden",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: 20
              }}
              whileHover={{ 
                borderColor: "var(--accent-primary)", 
                backgroundColor: "rgba(34,211,238,0.02)"
              }}
            >
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "var(--radius-sm)", 
                background: "rgba(34,211,238,0.1)", 
                color: "var(--accent-primary)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ 
                  fontWeight: 600, 
                  fontSize: 20, 
                  color: "var(--text-primary)",
                  marginBottom: 12,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {f.title}
                </h3>
                <p style={{ 
                  fontSize: 14, 
                  color: "var(--text-secondary)", 
                  lineHeight: 1.6, 
                  fontFamily: "'JetBrains Mono', monospace" 
                }}>
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
          >
            From URL to Report in <span className="gradient-text">60 Seconds</span>
          </motion.h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>Three steps to complete security visibility</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, position: "relative" }}>
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card"
              style={{ padding: "32px 28px", textAlign: "center", position: "relative" }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: `${step.color}14`,
                border: `1px solid ${step.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                color: step.color,
                boxShadow: `0 0 20px ${step.color}20`,
              }}>
                {step.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: step.color, marginBottom: 10, textTransform: "uppercase" }}>
                Step {step.num}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{step.desc}</p>
              {i < HOW_STEPS.length - 1 && (
                <div style={{ position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", zIndex: 1 }}>
                  <ChevronRight size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── API Trust Strip ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-elevated"
          style={{ padding: "40px 44px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 28 }}>
            <div>
              <div className="tech-pill" style={{ display: "inline-flex", marginBottom: 12 }}>Powered By</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Real Intelligence, Not Simulations
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, maxWidth: 480 }}>
                Every check uses live API calls to trusted security databases — no mocked data, no stale reports.
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 12,
              alignSelf: "flex-start",
            }}>
              <TrendingUp size={16} style={{ color: "#10b981" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>13 Live APIs</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {APIS.map((api) => (
              <span key={api} className="tech-pill">{api}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            padding: "64px 48px",
            background: "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(139,92,246,0.06) 100%)",
            border: "1px solid rgba(14,165,233,0.15)",
            borderRadius: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* BG glow */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ display: "inline-block", marginBottom: 24 }}
          >
            <Shield size={52} style={{ color: "#38bdf8" }} />
          </motion.div>

          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
            Is Your Site <span className="gradient-text-danger">Vulnerable?</span>
          </h2>
          <p style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 36, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
            You&apos;ll never know until you check. Run a free scan in seconds and find out exactly where you stand.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="btn-primary"
              style={{ fontSize: 16, padding: "14px 36px", borderRadius: 12 }}
            >
              <Zap size={18} /> Scan My Site Now
            </button>
            <a
              href="/docs"
              className="btn-secondary"
              style={{ fontSize: 14, padding: "14px 24px", textDecoration: "none", borderRadius: 12 }}
            >
              View API Docs <ArrowRight size={15} />
            </a>
          </div>

          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 36, flexWrap: "wrap" }}>
            {["No account needed", "Instant results", "GDPR compliant"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
                <CheckCircle size={13} style={{ color: "#34d399" }} />
                {t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
