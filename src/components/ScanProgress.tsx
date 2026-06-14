"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Clock, Loader, X, ExternalLink, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { AuditCategory, CheckResult, CATEGORY_LABELS } from "@/types/audit";
import { ScanReport } from "@/types/audit";

interface ScanProgressProps {
  scanId: string;
  targetUrl: string;
  onComplete: (report: ScanReport) => void;
  onCancel: () => void;
}

interface CheckState {
  category: AuditCategory;
  status: "pending" | "running" | "complete" | "error";
  result?: CheckResult;
  error?: string;
}

const ALL_CATEGORIES: AuditCategory[] = [
  "AUTH_ACCESS", "SSL_TLS", "OWASP_TOP10", "SERVER_SECURITY",
  "DATABASE_SECURITY", "API_SECURITY", "INPUT_VALIDATION", "SECURITY_HEADERS",
  "FILE_UPLOAD", "LOGGING_MONITORING", "BACKUP_RECOVERY", "THIRD_PARTY",
  "CLOUD_HOSTING", "PERFORMANCE_TESTING", "COMPLIANCE", "THREAT_INTELLIGENCE", "OSINT_RECON"
];

export function ScanProgress({ scanId, targetUrl, onComplete, onCancel }: ScanProgressProps) {
  const [checks, setChecks] = useState<CheckState[]>(
    ALL_CATEGORIES.map((cat) => ({ category: cat, status: "pending" }))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing threat engine...");
  const [threatsDetected, setThreatsDetected] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    // Connect to SSE stream
    const es = new EventSource(`/api/audit/stream?scanId=${scanId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "check_start") {
          setStatusMessage(`Analyzing ${CATEGORY_LABELS[data.check as AuditCategory] || data.check}...`);
          setChecks((prev) =>
            prev.map((c) => (c.category === data.check ? { ...c, status: "running" } : c))
          );
        } else if (data.event === "check_complete") {
          setChecks((prev) =>
            prev.map((c) => (c.category === data.check ? { ...c, status: "complete", result: data.result } : c))
          );
          
          if (data.result && data.result.findings) {
            const issues = data.result.findings.filter((f: any) => f.riskLevel !== "PASS" && f.riskLevel !== "INFO").length;
            if (issues > 0) setThreatsDetected(prev => prev + issues);
          }
          if (data.progress) setOverallProgress(data.progress);
        } else if (data.event === "check_error") {
          setChecks((prev) =>
            prev.map((c) => (c.category === data.check ? { ...c, status: "error", error: data.error } : c))
          );
        } else if (data.event === "scan_complete") {
          setOverallProgress(100);
          setStatusMessage("Audit complete. Finalizing report...");
          if (timerRef.current) clearInterval(timerRef.current);
          es.close();

          if (data.report) {
            setTimeout(() => onComplete(data.report), 1000);
          } else {
            fetch(`/api/audit/${scanId}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.report) onComplete(d.report);
              });
          }
        }
      } catch {}
    };

    es.onerror = () => {
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/audit/${scanId}`);
          const data = await res.json();
          if (data.status === "COMPLETE" && data.report) {
            clearInterval(poll);
            onComplete(data.report);
          }
        } catch {}
      }, 2000);
    };

    return () => {
      es.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scanId, onComplete]);

  const completedCount = checks.filter((c) => c.status === "complete" || c.status === "error").length;

  const domain = (() => {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  })();

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      {/* ── Scan Header ─────────────────────────────────────────────────── */}
      <div className="glass-card-elevated" style={{ padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        {/* Radar BG */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, opacity: 0.1, pointerEvents: "none" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #0ea5e9", position: "absolute" }} />
          <div style={{ width: "80%", height: "80%", borderRadius: "50%", border: "2px solid #0ea5e9", position: "absolute", top: "10%", left: "10%" }} />
          <div style={{ width: "60%", height: "60%", borderRadius: "50%", border: "2px solid #0ea5e9", position: "absolute", top: "20%", left: "20%" }} />
          <div style={{ width: "50%", height: "50%", background: "conic-gradient(from 0deg, transparent 0%, rgba(14,165,233,0.5) 100%)", borderRadius: "50%", position: "absolute", top: "25%", left: "25%", animation: "radar 4s linear infinite", transformOrigin: "center" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ea5e9", animation: "pulse-ring 1.5s ease infinite", boxShadow: "0 0 10px rgba(14, 165, 233, 0.8)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "#38bdf8", textTransform: "uppercase" }}>
                SecureX Engine Active
              </span>
            </div>
            
            <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {domain}
              <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", padding: 6, background: "rgba(255,255,255,0.05)", borderRadius: 8, transition: "background 0.2s" }} className="hover:bg-white/10">
                <ExternalLink size={16} />
              </a>
            </div>
            
            <div style={{ fontSize: 15, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} className="animate-pulse" style={{ color: "#8b5cf6" }} />
              {statusMessage}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", color: threatsDetected > 0 ? "#ef4444" : "var(--text-primary)" }} className={threatsDetected > 0 ? "glow-red" : ""}>
                {threatsDetected}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Threats Found</div>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:{String(elapsedTime % 60).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Elapsed Time</div>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.1)" }} />
            <button onClick={onCancel} className="btn-secondary" style={{ padding: "10px", borderRadius: 12 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 32, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Scan Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round((completedCount / ALL_CATEGORIES.length) * 100)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8, background: "rgba(14,165,233,0.1)" }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${(completedCount / ALL_CATEGORIES.length) * 100}%`, background: "linear-gradient(90deg, #0ea5e9, #8b5cf6)", boxShadow: "0 0 12px rgba(14,165,233,0.6)" }}
            />
          </div>
        </div>
      </div>

      {/* ── Checks Grid ─────────────────────────────────────────────────── */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}
      >
        {checks.map((check, i) => (
          <CheckCard key={check.category} check={check} index={i} />
        ))}
      </motion.div>
    </div>
  );
}

function CheckCard({ check, index }: { check: CheckState; index: number }) {
  const statusIcon = {
    pending: <Clock size={18} style={{ color: "var(--text-muted)" }} />,
    running: <Loader size={18} style={{ color: "#0ea5e9" }} className="animate-spin" />,
    complete: <CheckCircle size={18} style={{ color: "#10b981" }} />,
    error: <AlertCircle size={18} style={{ color: "#ef4444" }} />,
  }[check.status];

  const bg =
    check.status === "running" ? "rgba(14,165,233,0.08)"
    : check.status === "complete" ? "rgba(12,18,40,0.8)"
    : check.status === "error" ? "rgba(239,68,68,0.05)"
    : "rgba(12,18,40,0.4)";

  const border =
    check.status === "running" ? "rgba(14,165,233,0.4)"
    : check.status === "complete" ? "rgba(16,185,129,0.2)"
    : check.status === "error" ? "rgba(239,68,68,0.3)"
    : "var(--border-subtle)";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      style={{
        padding: "16px 20px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-lg)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {check.status === "running" && (
        <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, background: "#0ea5e9", width: "100%", animation: "shimmer 2s infinite", backgroundSize: "200% 100%" }} />
      )}
      
      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {statusIcon}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: check.status === "pending" ? "var(--text-muted)" : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {CATEGORY_LABELS[check.category]}
        </div>
        {check.result && (
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: check.result.score >= 80 ? "#34d399" : check.result.score >= 60 ? "#fbbf24" : "#f87171" }}>
            Score: {check.result.score} · {check.result.findings.filter((f) => f.riskLevel !== "PASS" && f.riskLevel !== "INFO").length} threats
          </div>
        )}
        {check.status === "pending" && <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>Waiting...</div>}
        {check.status === "running" && <div style={{ marginTop: 4, fontSize: 12, color: "#38bdf8" }}>Analyzing...</div>}
      </div>
      
      {check.result && (
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: check.result.score >= 80 ? "#34d399" : check.result.score >= 60 ? "#fbbf24" : "#f87171", flexShrink: 0 }}>
          {check.result.score}
        </div>
      )}
    </motion.div>
  );
}
