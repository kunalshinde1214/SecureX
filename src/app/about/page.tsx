import { Metadata } from "next";
import { Shield, Lock, Globe, Server, Code } from "lucide-react";

export const metadata: Metadata = {
  title: "About | WebAudit Pro",
  description: "Learn about WebAudit Pro, our zero-budget open-source web security auditing platform.",
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, marginBottom: 16 }}>
          Democratizing <span className="gradient-text">Web Security</span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
          WebAudit Pro is an open-source, zero-budget security auditing platform designed to make professional-grade vulnerability scanning accessible to everyone.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "40px", marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: "var(--text-primary)" }}>
          Our Mission
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
          Security shouldn't be a luxury reserved for enterprise budgets. We built WebAudit Pro to provide developers, small businesses, and independent researchers with a comprehensive suite of passive security checks that adhere to industry standards like the OWASP Top 10, without the exorbitant price tag.
        </p>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          By aggregating data from leading free APIs and utilizing advanced, passive enumeration techniques, we deliver actionable insights safely—without aggressive scanning that could disrupt your services or trigger WAFs.
        </p>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: "var(--text-primary)", textAlign: "center" }}>
        Core Technologies
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 60 }}>
        {[
          { icon: <Shield size={24} />, title: "Next.js App Router", desc: "Built on the latest React framework for edge-ready performance." },
          { icon: <Lock size={24} />, title: "Zero Budget Architecture", desc: "Relies entirely on free-tier APIs and open datasets." },
          { icon: <Globe size={24} />, title: "Passive Scanning", desc: "Non-intrusive checks that won't disrupt target availability." },
          { icon: <Code size={24} />, title: "Open Source", desc: "Transparent audit methodology and extensible codebase." },
        ].map((tech) => (
          <div key={tech.title} style={{ padding: 24, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", marginBottom: 16 }}>
              {tech.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{tech.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{tech.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "40px", background: "linear-gradient(135deg, rgba(15, 30, 53, 0.8), rgba(10, 22, 40, 0.9))", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Ready to secure your application?</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>Run a full 15-domain security audit in under 60 seconds.</p>
        <a href="/" className="btn-primary" style={{ textDecoration: "none" }}>Start Free Audit</a>
      </div>
    </div>
  );
}
