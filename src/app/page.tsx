"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield, Lock, Globe, Server, AlertTriangle, Database,
  Eye, FileSearch, Radio, Terminal, Zap,
  ArrowRight, CheckCircle, TrendingUp, BarChart2
} from "lucide-react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
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
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

/* ─── Features ───────────────────────────────────────────────────────────── */
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
    color: "#0ea5e9", glow: "rgba(14,165,233,0.1)", badge: "Critical",
  },
  {
    icon: <Shield size={22} />, title: "Security Headers",
    desc: "CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options and 6 more.",
    color: "#8b5cf6", glow: "rgba(139,92,246,0.1)", badge: "High Impact",
  },
  {
    icon: <AlertTriangle size={22} />, title: "OWASP Top 10",
    desc: "Passive detection of injection flaws, broken auth, XSS exposure, IDOR, sensitive data exposure.",
    color: "#ef4444", glow: "rgba(239,68,68,0.1)", badge: "OWASP",
  },
  {
    icon: <Globe size={22} />, title: "DNS & Email Security",
    desc: "DNSSEC validation, SPF/DMARC/DKIM configuration, CAA records, domain expiry, subdomain takeover.",
    color: "#10b981", glow: "rgba(16,185,129,0.1)", badge: "DNS",
  },
  {
    icon: <Server size={22} />, title: "Open Port Analysis",
    desc: "Detect exposed database ports (3306, 5432, 27017), admin interfaces, SSH, Telnet, RDP via Shodan.",
    color: "#f97316", glow: "rgba(249,115,22,0.1)", badge: "Network",
  },
  {
    icon: <Database size={22} />, title: "Threat Intelligence",
    desc: "Real-time checks against VirusTotal, AbuseIPDB, Shodan, Google Safe Browsing for malware & phishing.",
    color: "#06b6d4", glow: "rgba(6,182,212,0.1)", badge: "Threat Intel",
  },
  {
    icon: <FileSearch size={22} />, title: "CVE Vulnerability Scan",
    desc: "Match server fingerprint against NVD database to find known CVEs. Severity-ranked with CVSS scores.",
    color: "#dc2626", glow: "rgba(220,38,38,0.1)", badge: "CVE",
  },
  {
    icon: <Eye size={22} />, title: "Information Leakage",
    desc: "Detect exposed .env files, Git repos, backup files, debug endpoints, server version disclosure.",
    color: "#f59e0b", glow: "rgba(245,158,11,0.1)", badge: "OSINT",
  },
  {
    icon: <Radio size={22} />, title: "Automated Scheduling",
    desc: "Set up daily/weekly/monthly automated scans. Get alerted when your security score drops.",
    color: "#6366f1", glow: "rgba(99,102,241,0.1)", badge: "Pro",
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
  { num: "02", icon: <BarChart2 size={24} />, title: "Engine Runs", desc: "Our 13 live APIs parallel-execute over 120 specialized security checks.", color: "#8b5cf6" },
  { num: "03", icon: <Shield size={24} />, title: "Get Report", desc: "Receive a professional, boardroom-ready security grade in seconds.", color: "#10b981" },
];

export default function Page() {
  const [appState, setAppState] = useState<AppState>("home");
  const [scanUrl, setScanUrl] = useState("");
  const [scanId, setScanId] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -50]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 50]);

  const handleStartScan = async (url: string, depth: string) => {
    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.scanId) {
        setScanUrl(url);
        setScanId(data.scanId);
        setAppState("scanning");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Failed to start scan");
      }
    } catch (e) {
      alert("Network error");
    }
  };

  const handleScanComplete = (finalReport: ScanReport) => {
    setReport(finalReport);
    setAppState("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAppState("home");
    setScanUrl("");
    setScanId("");
    setReport(null);
  };

  // ─── Scan View ──────────────────────────────────────────────────────────
  if (appState === "scanning") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <ScanProgress scanId={scanId} targetUrl={scanUrl} onComplete={handleScanComplete} onCancel={handleReset} />
        </div>
      </div>
    );
  }

  // ─── Report View ──────────────────────────────────────────────────────────
  if (appState === "report" && report) {
    return (
      <div style={{ minHeight: "100vh", padding: "40px 20px 100px" }}>
        <button onClick={handleReset} className="btn-secondary" style={{ marginBottom: 32, display: "inline-flex", padding: "10px 20px" }}>
          ← Back to Scanner
        </button>
        <AuditReport report={report} />
      </div>
    );
  }

  // ─── Home / Landing View ──────────────────────────────────────────────────
  return (
    <div style={{ overflowX: "hidden" }}>


      {/* ── Hero Section ── */}
      <section style={{ position: "relative", padding: "100px 24px 80px", textAlign: "center", minHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

        {/* Animated Background Elements */}
        <motion.div style={{ y: y1, position: "absolute", top: "10%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <motion.div style={{ y: y2, position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 860, width: "100%", position: "relative", zIndex: 10 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 100, color: "#0ea5e9", fontSize: 13, fontWeight: 600, marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", animation: "pulse 2s infinite" }} />
            SecureX Enterprise Intelligence Engine v2.0
          </div>

          <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: "-0.03em" }}>
            The Ultimate Security Audit for<br />
            <TypedHeadline />
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto 48px", lineHeight: 1.6 }}>
            Run an instant, boardroom-ready security sweep combining 13 live APIs to detect vulnerabilities before hackers do. No signups, no wait.
          </p>

          {/* URL Input */}
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <URLInput onSubmit={handleStartScan} />
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { t: "100% Free Audit", c: "#10b981" },
              { t: "No Credit Card", c: "#0ea5e9" },
              { t: "Live Threat Intel", c: "#8b5cf6" },
            ].map((item) => (
              <div key={item.t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
                <CheckCircle size={16} style={{ color: item.c }} />
                {item.t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, marginBottom: 16 }}>Enterprise-Grade Threat Detection</h2>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto" }}>Our engine actively queries over a dozen live threat intelligence databases to build a comprehensive risk profile.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card"
              style={{ padding: "32px", position: "relative", cursor: "default" }}
            >
              {feat.badge && (
                <div style={{ position: "absolute", top: 24, right: 24, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: feat.glow, color: feat.color, letterSpacing: 0.5 }}>
                  {feat.badge.toUpperCase()}
                </div>
              )}
              <div style={{ width: 56, height: 56, borderRadius: 16, background: feat.glow, color: feat.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: "var(--text-primary)" }}>{feat.title}</h3>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "100px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, marginBottom: 16 }}>How SecureX Works</h2>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto" }}>From a single URL to a boardroom-ready whitepaper report in less than 30 seconds.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", color: step.color, position: "relative", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, fontSize: 14, fontWeight: 900, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>{step.num}</div>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APIs Section ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-elevated"
          style={{ padding: "48px", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ maxWidth: 480 }}>
            <div style={{ display: "inline-flex", padding: "6px 12px", background: "rgba(16,185,129,0.1)", borderRadius: 100, color: "#059669", fontSize: 12, fontWeight: 700, marginBottom: 16, letterSpacing: 0.5 }}>INTEGRATIONS</div>
            <h3 style={{ fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>Powered By Live Threat Intelligence</h3>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>Every check uses live API calls to trusted security databases. No mocked data, no stale reports. We verify against the global standard.</p>
          </div>

          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" }}>
            {APIS.map((api, i) => (
              <motion.div
                key={api}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{ padding: "10px 16px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
              >
                {api}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            padding: "64px 48px",
            background: "var(--text-primary)",
            color: "var(--bg-surface)",
            borderRadius: 32,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ display: "inline-block", marginBottom: 24 }}
          >
            <Shield size={64} style={{ color: "#38bdf8" }} />
          </motion.div>

          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, marginBottom: 16, letterSpacing: "-0.02em", color: "#fff" }}>
            Is Your Site Vulnerable?
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            You'll never know until you check. Run a free scan in seconds and find out exactly where you stand.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="btn-primary"
              style={{ fontSize: 16, padding: "16px 40px", borderRadius: 100, background: "#fff", color: "#0f172a", border: "none" }}
            >
              <Zap size={18} /> Scan My Site Now
            </button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
