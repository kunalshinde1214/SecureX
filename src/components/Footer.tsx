"use client";

import Link from "next/link";
import { Shield, Globe, ArrowUpRight } from "lucide-react";
import Image from "next/image";

const FOOTER_LINKS = {
  Platform: [
    { href: "/", label: "Security Scanner" },
    { href: "/scans", label: "Recent Scans" },
    { href: "/docs", label: "API Documentation" },
    { href: "/about", label: "About SecureX" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/contact", label: "Contact" },
  ],
  Security: [
    { href: "https://owasp.org", label: "OWASP", external: true },
    { href: "https://nvd.nist.gov", label: "NVD/NIST", external: true },
    { href: "https://www.virustotal.com", label: "VirusTotal", external: true },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Main Footer */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "56px 28px 40px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 48,
        }}
      >
        {/* Brand Column */}
        <div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
            <Image src="/logo.png" alt="SecureX Logo" width={140} height={35} style={{ objectFit: "contain" }} />
          </Link>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 300, marginBottom: 20 }}>
            Professional web security auditing platform. Exposing vulnerabilities across 15 security domains using real threat intelligence APIs.
          </p>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.18)",
              borderRadius: 20,
              fontSize: 11, fontWeight: 600, color: "#34d399",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px rgba(16,185,129,0.8)", display: "inline-block" }} />
            securex.kunalshinde.me
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section}>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 18 }}>
              {section}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={"external" in link && link.external ? "_blank" : undefined}
                  rel={"external" in link && link.external ? "noopener noreferrer" : undefined}
                  style={{
                    fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
                    display: "flex", alignItems: "center", gap: 4,
                    transition: "color 0.2s ease",
                  }}
                  className="footer-link"
                >
                  {link.label}
                  {"external" in link && link.external && <ArrowUpRight size={11} style={{ opacity: 0.5 }} />}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "18px 28px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <Shield size={13} style={{ color: "#0ea5e9" }} />
          © {year} SecureX · Built by{" "}
          <a href="https://kunalshinde.me" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
            Kunal Shinde
          </a>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)" }}>
          <span>Open Source · Zero Cost · Privacy First</span>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--text-primary) !important; }
        @media (max-width: 900px) {
          footer > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          footer > div:first-child {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  );
}
