"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuditCategory, CheckResult, Finding, CATEGORY_LABELS } from "@/types/audit";

interface CategoryCardProps {
  category: AuditCategory;
  result: CheckResult;
}

export function CategoryCard({ category, result }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getRiskColor = (risk: Finding["riskLevel"]) => {
    switch (risk) {
      case "CRITICAL": return "#ef4444";
      case "HIGH":     return "#f97316";
      case "MEDIUM":   return "#fbbf24";
      case "LOW":      return "#34d399";
      case "INFO":     return "#38bdf8";
      case "PASS":     return "#10b981";
      default:         return "var(--text-muted)";
    }
  };

  const getRiskBadge = (risk: Finding["riskLevel"]) => {
    const cls = `risk-badge risk-${risk.toLowerCase()}`;
    return <span className={cls}>{risk}</span>;
  };

  const scoreColor =
    result.score >= 80 ? "#34d399" :
    result.score >= 60 ? "#fbbf24" : "#ef4444";

  return (
    <motion.div 
      initial={false}
      animate={{ backgroundColor: expanded ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.0)" }}
      whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
      transition={{ duration: 0.2 }}
      className="glass-card" 
      style={{ marginBottom: 16, overflow: "hidden", cursor: "pointer" }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div

        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            color: scoreColor,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${scoreColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${scoreColor}30`,
          }}>
            {result.score}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              {CATEGORY_LABELS[category]}
            </h3>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              {result.findings.filter((f) => f.riskLevel !== "PASS" && f.riskLevel !== "INFO").length} issues found
            </div>
          </div>
        </div>
        <motion.div 
          animate={{ rotate: expanded ? 90 : 0 }} 
          transition={{ duration: 0.2 }}
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronRight size={20} />
        </motion.div>
      </div>

      {/* Findings Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ borderTop: "1px solid var(--border-subtle)", padding: "0 24px" }}
          >
          {result.findings.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              No findings recorded for this category.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {result.findings.map((finding, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "20px 0",
                    borderBottom: idx < result.findings.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    display: "grid",
                    gridTemplateColumns: "100px 1fr",
                    gap: 24,
                  }}
                >
                  <div style={{ paddingTop: 2 }}>{getRiskBadge(finding.riskLevel)}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>
                      {finding.title}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                      {finding.description}
                    </p>
                    {finding.remediation && (
                      <div style={{
                        background: "rgba(14,165,233,0.05)",
                        border: "1px solid rgba(14,165,233,0.15)",
                        borderRadius: "var(--radius-md)",
                        padding: "12px 16px",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Remediation
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                          {finding.remediation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
