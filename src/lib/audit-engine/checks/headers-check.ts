import { CheckResult, Finding, ScanTarget } from "@/types/audit";

const REQUIRED_HEADERS = [
  {
    name: "content-security-policy",
    displayName: "Content-Security-Policy",
    weight: 20,
    id: "hdr-001",
    description: "Controls resources the browser is allowed to load.",
    remediation: "Add a Content-Security-Policy header to restrict script sources. Example: Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com",
    cwe: "CWE-116",
  },
  {
    name: "strict-transport-security",
    displayName: "Strict-Transport-Security",
    weight: 15,
    id: "hdr-002",
    description: "Forces browsers to use HTTPS for the domain.",
    remediation: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    cwe: "CWE-319",
  },
  {
    name: "x-frame-options",
    displayName: "X-Frame-Options",
    weight: 10,
    id: "hdr-003",
    description: "Prevents clickjacking by controlling iframe embedding.",
    remediation: "Add: X-Frame-Options: DENY or X-Frame-Options: SAMEORIGIN",
    cwe: "CWE-693",
  },
  {
    name: "x-content-type-options",
    displayName: "X-Content-Type-Options",
    weight: 10,
    id: "hdr-004",
    description: "Prevents MIME-type sniffing attacks.",
    remediation: "Add: X-Content-Type-Options: nosniff",
    cwe: "CWE-116",
  },
  {
    name: "referrer-policy",
    displayName: "Referrer-Policy",
    weight: 10,
    id: "hdr-005",
    description: "Controls how much referrer information is sent with requests.",
    remediation: "Add: Referrer-Policy: strict-origin-when-cross-origin or no-referrer",
    cwe: "CWE-200",
  },
  {
    name: "permissions-policy",
    displayName: "Permissions-Policy",
    weight: 10,
    id: "hdr-006",
    description: "Controls which browser features can be used on the page.",
    remediation: "Add: Permissions-Policy: camera=(), microphone=(), geolocation=()",
    cwe: "CWE-693",
  },
];

export async function runHeadersCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    const response = await fetch(target.url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    const headers = Object.fromEntries(response.headers.entries());

    // Check required security headers
    for (const hdr of REQUIRED_HEADERS) {
      if (!headers[hdr.name]) {
        score -= hdr.weight;
        findings.push({
          id: hdr.id,
          category: "SECURITY_HEADERS",
          title: `Missing ${hdr.displayName} Header`,
          description: `The ${hdr.displayName} header is not set. ${hdr.description}`,
          riskLevel: hdr.weight >= 15 ? "HIGH" : hdr.weight >= 10 ? "MEDIUM" : "LOW",
          cwe: hdr.cwe,
          evidence: `Header '${hdr.name}' not found in HTTP response`,
          impact: `Without this header, the site is vulnerable to attacks that the header would prevent.`,
          remediation: hdr.remediation,
          effort: "LOW",
        });
      } else {
        findings.push({
          id: `${hdr.id}-pass`,
          category: "SECURITY_HEADERS",
          title: `${hdr.displayName} Header Present`,
          description: `The ${hdr.displayName} header is correctly configured.`,
          riskLevel: "PASS",
          evidence: `${hdr.displayName}: ${headers[hdr.name]}`,
          impact: "No impact - header is properly configured.",
          remediation: "No action required.",
          effort: "LOW",
        });
      }
    }

    // Check Server header info leakage
    const serverHeader = headers["server"];
    if (serverHeader) {
      const hasVersion = /[\d.]+/.test(serverHeader);
      if (hasVersion) {
        score -= 5;
        findings.push({
          id: "hdr-007",
          category: "SECURITY_HEADERS",
          title: "Server Version Disclosed in Header",
          description: `The Server header reveals software version information: '${serverHeader}'`,
          riskLevel: "LOW",
          cwe: "CWE-200",
          evidence: `Server: ${serverHeader}`,
          impact: "Attackers can target known vulnerabilities in the specific server version.",
          remediation: "Configure your web server to omit version information. For Nginx: server_tokens off; For Apache: ServerTokens Prod",
          effort: "LOW",
        });
      }
    }

    // Check X-Powered-By header (info leakage)
    const poweredBy = headers["x-powered-by"];
    if (poweredBy) {
      score -= 5;
      findings.push({
        id: "hdr-008",
        category: "SECURITY_HEADERS",
        title: "X-Powered-By Header Exposes Technology Stack",
        description: `The X-Powered-By header reveals the technology stack: '${poweredBy}'`,
        riskLevel: "LOW",
        cwe: "CWE-200",
        evidence: `X-Powered-By: ${poweredBy}`,
        impact: "Attackers know which framework/language to target with specific exploits.",
        remediation: "Remove the X-Powered-By header. In Express.js: app.disable('x-powered-by'). In PHP: expose_php = Off",
        effort: "LOW",
      });
    }

    // Check CSP quality if present
    const csp = headers["content-security-policy"];
    if (csp) {
      if (csp.includes("unsafe-inline") || csp.includes("unsafe-eval")) {
        score -= 5;
        findings.push({
          id: "hdr-009",
          category: "SECURITY_HEADERS",
          title: "Weak Content-Security-Policy",
          description: "The Content-Security-Policy contains 'unsafe-inline' or 'unsafe-eval' directives, weakening its protection.",
          riskLevel: "MEDIUM",
          cwe: "CWE-116",
          evidence: `Content-Security-Policy: ${csp}`,
          impact: "XSS attacks can bypass the CSP when unsafe-inline or unsafe-eval are allowed.",
          remediation: "Replace 'unsafe-inline' with nonces or hashes. Replace 'unsafe-eval' with safer alternatives.",
          effort: "HIGH",
        });
      }
    }

    // Check HSTS quality if present
    const hsts = headers["strict-transport-security"];
    if (hsts) {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1]);
        if (maxAge < 31536000) {
          score -= 5;
          findings.push({
            id: "hdr-010",
            category: "SECURITY_HEADERS",
            title: "HSTS max-age Too Short",
            description: `HSTS max-age is set to ${maxAge} seconds (${Math.floor(maxAge / 86400)} days). Recommended minimum is 1 year (31536000 seconds).`,
            riskLevel: "MEDIUM",
            cwe: "CWE-319",
            evidence: `Strict-Transport-Security: ${hsts}`,
            impact: "Short HSTS durations reduce the protection window against MITM attacks.",
            remediation: "Set max-age to at least 31536000 (1 year) and add includeSubDomains and preload directives.",
            effort: "LOW",
          });
        }
      }
    }

    // Try Mozilla Observatory for additional insights
    try {
      const observatoryRes = await fetch(
        `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${target.domain}`,
        { method: "POST", signal: AbortSignal.timeout(10000) }
      );
      if (observatoryRes.ok) {
        const obsData = await observatoryRes.json();
        if (obsData.score !== undefined) {
          // Incorporate Mozilla Observatory score as a data point
          const mozScore = obsData.score;
          if (mozScore < 50 && !findings.some(f => f.id === "hdr-moz")) {
            findings.push({
              id: "hdr-moz",
              category: "SECURITY_HEADERS",
              title: `Mozilla Observatory Score: ${mozScore}/100`,
              description: "The Mozilla HTTP Observatory reports a low security score for this site's header configuration.",
              riskLevel: mozScore < 30 ? "HIGH" : "MEDIUM",
              evidence: `Mozilla Observatory score: ${mozScore}/100, Grade: ${obsData.grade}`,
              impact: "Multiple header security issues detected by Mozilla's automated analysis.",
              remediation: `Review Mozilla Observatory report at https://observatory.mozilla.org/analyze/${target.domain}`,
              effort: "MEDIUM",
            });
          }
        }
      }
    } catch {
      // Observatory unavailable
    }

    score = Math.max(0, Math.min(100, score));

    return {
      category: "SECURITY_HEADERS",
      status: "COMPLETE",
      score,
      riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
      findings,
      rawData: { headers },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      category: "SECURITY_HEADERS",
      status: "FAILED",
      score: 0,
      riskLevel: "HIGH",
      findings,
      errorMsg: String(error),
      duration: Date.now() - startTime,
    };
  }
}
