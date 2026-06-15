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
        <div className="flex flex-col sm:flex-row gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-2 sm:pl-6 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-[20px]"
          onFocus={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--accent-primary)";
            el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.05), 0 0 0 3px rgba(14, 165, 233, 0.15)";
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-default)";
              el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.05)";
            }
          }}
        >
          <div className="flex items-center text-[var(--accent-primary)] shrink-0 hidden sm:flex">
            <Globe size={20} />
          </div>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to audit (e.g. example.com)"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-base font-inherit min-w-0 p-2 sm:p-0 pl-4 sm:pl-0"
            disabled={loading}
          />
          <button
            id="start-audit-btn"
            type="submit"
            className="btn-primary shrink-0 whitespace-nowrap p-3 px-6 rounded-[var(--radius-lg)] w-full sm:w-auto flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
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
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {depthOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDepth(opt.value as typeof depth)}
              className="flex-1 p-3 rounded-[var(--radius-md)] cursor-pointer transition-all text-center relative overflow-hidden"
              style={{
                background: depth === opt.value ? "rgba(14, 165, 233, 0.1)" : "var(--bg-surface)",
                border: `1px solid ${depth === opt.value ? "rgba(14, 165, 233, 0.4)" : "var(--border-subtle)"}`,
                boxShadow: depth === opt.value ? "0 4px 12px rgba(14, 165, 233, 0.1)" : "0 2px 5px rgba(0,0,0,0.02)",
              }}
            >
              {depth === opt.value && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 to-sky-300" />
              )}
              <div className="text-[13px] font-bold flex items-center justify-center gap-1.5 tracking-wide" style={{ color: depth === opt.value ? "#38bdf8" : "var(--text-secondary)" }}>
                {opt.label}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: depth === opt.value ? "#0ea5e9" : "var(--text-muted)", background: depth === opt.value ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)" }}>
                  {opt.time}
                </span>
              </div>
              <div className="text-[11px] font-medium mt-1 text-[var(--text-muted)]">
                {opt.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Example URLs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
          <span className="text-xs font-medium text-[var(--text-muted)]">Try:</span>
          {EXAMPLE_URLS.map((exUrl) => (
            <button
              key={exUrl}
              type="button"
              onClick={() => setUrl(exUrl)}
              className="text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-1 rounded-full cursor-pointer transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30"
            >
              {exUrl}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
