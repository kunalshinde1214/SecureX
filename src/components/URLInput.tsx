"use client";

import { useState } from "react";
import { Shield, Globe, AlertTriangle } from "lucide-react";

interface URLInputProps {
  onSubmit: (url: string, depth: "QUICK" | "STANDARD" | "DEEP") => void;
  loading?: boolean;
}

const EXAMPLE_URLS = ["example.com", "github.com", "hackerone.com"];

export function URLInput({ onSubmit, loading }: URLInputProps) {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<"QUICK" | "STANDARD" | "DEEP">("STANDARD");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let targetUrl = url.trim();
    if (!targetUrl) {
      setError("Please enter a URL to scan");
      return;
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      new URL(targetUrl);
    } catch {
      setError("Please enter a valid URL (e.g. example.com)");
      return;
    }

    onSubmit(targetUrl, depth);
  };

  const depthOptions = [
    { value: "QUICK", label: "Quick", time: "~15s", desc: "Core checks" },
    { value: "STANDARD", label: "Standard", time: "~60s", desc: "15 domains" },
    { value: "DEEP", label: "Deep", time: "~2min", desc: "CVE + Intel" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <form onSubmit={handleSubmit}>
        {/* URL Input Row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl)",
            padding: "8px 8px 8px 24px",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
            backdropFilter: "blur(20px)",
          }}
          onFocus={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--accent-primary)";
            el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.05), 0 0 0 3px rgba(14, 165, 233, 0.15)";
            el.style.background = "var(--bg-surface)";
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-default)";
              el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.05)";
              el.style.background = "var(--bg-surface)";
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", color: "var(--accent-primary)", flexShrink: 0 }}>
            <Globe size={20} />
          </div>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to audit (e.g. example.com)"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 16,
              fontFamily: "inherit",
              minWidth: 0,
            }}
            disabled={loading}
          />
          <button
            id="start-audit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ flexShrink: 0, whiteSpace: "nowrap", padding: "12px 24px", borderRadius: "var(--radius-lg)" }}
          >
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                Analyzing...
              </>
            ) : (
              <>
                <Shield size={18} />
                Run Audit
              </>
            )}
          </button>
        </div>

        {/* Depth Selector */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {depthOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDepth(opt.value as typeof depth)}
              style={{
                flex: 1,
                padding: "12px 14px",
                background: depth === opt.value ? "rgba(14, 165, 233, 0.1)" : "var(--bg-surface)",
                border: `1px solid ${depth === opt.value ? "rgba(14, 165, 233, 0.4)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: depth === opt.value ? "0 4px 12px rgba(14, 165, 233, 0.1)" : "0 2px 5px rgba(0,0,0,0.02)",
              }}
            >
              {depth === opt.value && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #0ea5e9, #38bdf8)" }} />
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: depth === opt.value ? "#38bdf8" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: 0.5 }}>
                {opt.label}
                <span style={{ fontSize: 10, fontWeight: 600, color: depth === opt.value ? "#0ea5e9" : "var(--text-muted)", background: depth === opt.value ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                  {opt.time}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Example URLs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Try:</span>
          {EXAMPLE_URLS.map((exUrl) => (
            <button
              key={exUrl}
              type="button"
              onClick={() => setUrl(exUrl)}
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                padding: "4px 12px",
                borderRadius: 20,
                transition: "all 0.2s",
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}
              className="hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30"
            >
              {exUrl}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
