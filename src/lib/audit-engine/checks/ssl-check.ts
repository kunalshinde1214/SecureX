import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runSSLCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    const domain = target.domain;

    // Check 1: HTTPS Protocol
    if (target.protocol !== "https:") {
      findings.push({
        id: "ssl-001",
        category: "SSL_TLS",
        title: "HTTPS Not Enabled",
        description: "The site is not served over HTTPS, leaving all data in transit unencrypted.",
        riskLevel: "CRITICAL",
        cvss: 9.1,
        cwe: "CWE-319",
        evidence: `Protocol detected: ${target.protocol}`,
        impact: "All data transmitted between users and the server is visible to attackers (MITM attacks).",
        remediation: "Install an SSL/TLS certificate and redirect all HTTP traffic to HTTPS. Use Let's Encrypt for a free certificate.",
        effort: "MEDIUM",
        references: ["https://letsencrypt.org", "https://owasp.org/www-project-top-ten/"],
      });
      score -= 30;
    }

    // Check 2: SSL Labs API
    try {
      const sslResponse = await fetch(
        `https://api.ssllabs.com/api/v3/analyze?host=${domain}&all=done&ignoreMismatch=on`,
        { signal: AbortSignal.timeout(25000) }
      );
      if (sslResponse.ok) {
        const sslData = await sslResponse.json();

        if (sslData.status === "READY" && sslData.endpoints?.length > 0) {
          const endpoint = sslData.endpoints[0];
          const grade = endpoint.grade || "F";

          // Grade-based scoring
          if (grade === "A+" || grade === "A") {
            // Good
          } else if (grade === "B") {
            score -= 10;
            findings.push({
              id: "ssl-002",
              category: "SSL_TLS",
              title: `SSL Grade: ${grade}`,
              description: "SSL configuration has minor issues bringing the grade below A.",
              riskLevel: "LOW",
              evidence: `SSL Labs grade: ${grade}`,
              impact: "Some older clients may have compatibility issues.",
              remediation: "Review SSL Labs report for specific improvements to cipher suites and configuration.",
              effort: "LOW",
            });
          } else if (grade === "C") {
            score -= 20;
            findings.push({
              id: "ssl-002",
              category: "SSL_TLS",
              title: `SSL Grade: ${grade}`,
              description: "SSL configuration has significant issues.",
              riskLevel: "MEDIUM",
              evidence: `SSL Labs grade: ${grade}`,
              impact: "Vulnerable to certain SSL attacks. Users may see browser warnings.",
              remediation: "Disable weak cipher suites and upgrade TLS configuration.",
              effort: "MEDIUM",
            });
          } else if (grade === "D" || grade === "F") {
            score -= 40;
            findings.push({
              id: "ssl-002",
              category: "SSL_TLS",
              title: `Poor SSL Grade: ${grade}`,
              description: "SSL configuration has critical security issues.",
              riskLevel: "CRITICAL",
              cvss: 8.1,
              evidence: `SSL Labs grade: ${grade}`,
              impact: "Highly vulnerable to SSL/TLS attacks. Users' data may be compromised.",
              remediation: "Immediately upgrade TLS version to 1.2+ minimum, disable weak ciphers, fix certificate issues.",
              effort: "HIGH",
            });
          }

          // Check TLS versions
          const details = endpoint.details;
          if (details) {
            if (details.protocols?.some((p: { name: string; version: string }) => p.name === "TLS" && (p.version === "1.0" || p.version === "1.1"))) {
              score -= 15;
              findings.push({
                id: "ssl-003",
                category: "SSL_TLS",
                title: "Deprecated TLS Versions Supported",
                description: "Server supports TLS 1.0 and/or 1.1, which are deprecated and vulnerable.",
                riskLevel: "HIGH",
                cvss: 7.4,
                cwe: "CWE-326",
                cve: "CVE-2014-3566",
                evidence: "TLS 1.0/1.1 handshake successful",
                impact: "Vulnerable to POODLE, BEAST, and other protocol-level attacks.",
                remediation: "Disable TLS 1.0 and 1.1. For Nginx: `ssl_protocols TLSv1.2 TLSv1.3;`",
                effort: "LOW",
                references: ["https://nvd.nist.gov/vuln/detail/CVE-2014-3566"],
              });
            }

            // HSTS check
            if (!details.hstsPolicy?.status || details.hstsPolicy.status !== "present") {
              score -= 10;
              findings.push({
                id: "ssl-004",
                category: "SSL_TLS",
                title: "HSTS Not Configured",
                description: "HTTP Strict Transport Security (HSTS) header is missing.",
                riskLevel: "MEDIUM",
                cwe: "CWE-319",
                evidence: "Strict-Transport-Security header not found in response",
                impact: "Users can be downgraded to HTTP connections via MITM attacks.",
                remediation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
                effort: "LOW",
              });
            }
          }
        }
      }
    } catch {
      // SSL Labs unavailable - do basic check
      try {
        const httpsCheck = await fetch(`https://${domain}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
        });
        if (!httpsCheck.ok && httpsCheck.status !== 301 && httpsCheck.status !== 302) {
          findings.push({
            id: "ssl-005",
            category: "SSL_TLS",
            title: "HTTPS Connection Issues",
            description: "Unable to establish a clean HTTPS connection to the server.",
            riskLevel: "MEDIUM",
            evidence: `HTTP status: ${httpsCheck.status}`,
            impact: "Users may encounter SSL errors when visiting the site.",
            remediation: "Verify SSL certificate is properly installed and not expired.",
            effort: "MEDIUM",
          });
          score -= 15;
        }

        // Check for cert expiry via headers
        const certHeader = httpsCheck.headers.get("x-certificate-expiry");
        if (certHeader) {
          const expiry = new Date(certHeader);
          const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          if (daysLeft < 30) {
            findings.push({
              id: "ssl-006",
              category: "SSL_TLS",
              title: "SSL Certificate Expiring Soon",
              description: `SSL certificate expires in ${Math.floor(daysLeft)} days.`,
              riskLevel: daysLeft < 7 ? "CRITICAL" : "HIGH",
              evidence: `Certificate expires: ${certHeader}`,
              impact: "Users will see certificate warnings and may be unable to access the site.",
              remediation: "Renew the SSL certificate immediately. Consider using auto-renewal with Let's Encrypt.",
              effort: "LOW",
            });
            score -= daysLeft < 7 ? 30 : 15;
          }
        }
      } catch {
        // Network error
      }
    }

    // Check Certificate Transparency via crt.sh
    try {
      const crtResponse = await fetch(
        `https://crt.sh/?q=${domain}&output=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (crtResponse.ok) {
        const certs = await crtResponse.json();
        if (Array.isArray(certs) && certs.length > 0) {
          // Check for recently issued certs (good sign)
          findings.push({
            id: "ssl-007",
            category: "SSL_TLS",
            title: "Certificate Transparency Logs Found",
            description: `${certs.length} certificate(s) found in CT logs for this domain.`,
            riskLevel: "INFO",
            evidence: `${certs.length} certificates in CT logs`,
            impact: "Certificate transparency provides auditability of issued certificates.",
            remediation: "No action required. Monitor CT logs for unauthorized certificate issuances.",
            effort: "LOW",
          });
        }
      }
    } catch {
      // CT check failed - non-critical
    }

    score = Math.max(0, Math.min(100, score));

    return {
      category: "SSL_TLS",
      status: "COMPLETE",
      score,
      riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
      findings,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      category: "SSL_TLS",
      status: "FAILED",
      score: 0,
      riskLevel: "HIGH",
      findings,
      errorMsg: String(error),
      duration: Date.now() - startTime,
    };
  }
}
