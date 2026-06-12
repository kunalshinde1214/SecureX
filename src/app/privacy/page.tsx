import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Eye, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | WebAudit Pro",
  description: "Learn how we handle, process, and secure passive data and user credentials at WebAudit Pro.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-green)",
            margin: "0 auto 16px",
          }}
        >
          <Eye size={24} />
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 900, marginBottom: 12 }}>
          Privacy <span className="gradient-text">Policy</span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
          Last modified: May 29, 2026
        </p>
      </div>

      {/* Main Copy */}
      <div className="glass-card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={16} style={{ color: "var(--accent-green)" }} />
            1. Zero Persistent Tracking Policy
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            WebAudit Pro is designed around passive cybersecurity scanning principles. We prioritize privacy by ensuring that **we do not track, capture, or store any personal browsing metadata** of standard users submission flows. Your targeting records are cached in the secure database strictly for performance acceleration and report export retrievals.
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
            2. Collected Lead Data & Sales CRM
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            The only personal identification data explicitly captured on this platform is the **Contact Email** supplied by visitors requesting detailed PDF report downloads or submitting direct contact inquiries. This data is written directly to our secure database CRM and is accessible solely by authenticated platform administrators to assist with technical consulting and onboarding pipelines.
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
            3. Third-Party Security Lookups & APIs
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>
            To execute passive security assessments across 15 domains, the system performs external API lookups to trusted threat databases (including NIST NVD, Shodan InternetDB, AbuseIPDB, crt.sh, and VirusTotal).
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Only public domain indicators (e.g. `example.com` or its resolved IP `93.184.216.34`) are shared during these passive registry queries. No internal server configurations, authorization keys, or personal client parameters are ever forwarded to these external providers.
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
            4. Cookies & Persistent Tokens
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            We utilize persistent tokens or simple cookies solely to authenticate authorized platform administrators, manage dashboard sessions, and persist structural white-label branding changes. We do not integrate third-party ad-tracking pixels (such as Meta pixel or Google Ads remarketing cookies) into our core application.
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
            5. GDPR & CCPA Compliance Frameworks
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            If you are accessing the platform from within the European Union (EEA) or California (USA), you have the right to request full erasure, deletion, or correction of your email record from our captured leads database. Direct all removal requests to our administrative secure inbox.
          </p>
        </section>
      </div>

      {/* Footer link */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={14} /> Back to Audit Portal
        </Link>
      </div>
    </div>
  );
}
