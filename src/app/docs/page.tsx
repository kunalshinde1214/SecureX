import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | WebAudit Pro",
  description: "Learn how to use the WebAudit Pro API and understand our security scoring methodology.",
};

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, marginBottom: 16 }}>
          Documentation & <span className="gradient-text">API</span>
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Everything you need to integrate WebAudit Pro into your CI/CD pipelines or understand our audit methodology.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Section 1 */}
        <section className="glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            Audit Methodology
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
            WebAudit Pro performs 100% passive security scanning. This means we do not send malicious payloads, attempt to bypass authentication, or stress-test your infrastructure. We rely on public records, DNS queries, TLS handshakes, and HTTP response headers.
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8 }}>
            <li><strong>Headers:</strong> Checks for missing CSP, HSTS, X-Frame-Options, etc.</li>
            <li><strong>TLS/SSL:</strong> Validates certificate chains, expiry, and weak cipher suites.</li>
            <li><strong>DNS:</strong> Verifies SPF, DMARC, and DNSSEC records.</li>
            <li><strong>Reputation:</strong> Cross-references IPs against Shodan and VirusTotal datasets.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            REST API (Beta)
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            You can programmatically trigger audits using our REST endpoints. Rate limits apply to unauthenticated requests.
          </p>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>1. Start a Scan</h3>
            <div className="code-block" style={{ marginBottom: 12 }}>
              POST /api/audit/start<br/>
              Content-Type: application/json<br/>
              <br/>
              {`{ "url": "https://example.com", "depth": "STANDARD" }`}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Returns a <code>scanId</code> which you can use to stream or poll results.</p>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>2. Fetch Results</h3>
            <div className="code-block" style={{ marginBottom: 12 }}>
              GET /api/audit/[scanId]
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Returns the complete JSON report once the scan status is <code>COMPLETE</code>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
