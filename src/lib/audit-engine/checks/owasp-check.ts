import { CheckResult, Finding, ScanTarget } from "@/types/audit";

const SENSITIVE_PATHS = [
  { path: "/.git/HEAD", title: "Git Repository Exposed", risk: "CRITICAL", cvss: 9.1 },
  { path: "/.env", title: ".env File Exposed", risk: "CRITICAL", cvss: 9.8 },
  { path: "/.env.local", title: ".env.local File Exposed", risk: "CRITICAL", cvss: 9.8 },
  { path: "/config.php", title: "PHP Config File Exposed", risk: "HIGH", cvss: 7.5 },
  { path: "/wp-login.php", title: "WordPress Login Found", risk: "MEDIUM", cvss: 5.0 },
  { path: "/xmlrpc.php", title: "WordPress XMLRPC Enabled", risk: "HIGH", cvss: 7.5 },
  { path: "/phpinfo.php", title: "PHP Info Page Exposed", risk: "HIGH", cvss: 7.5 },
  { path: "/admin", title: "Admin Panel Accessible", risk: "MEDIUM", cvss: 5.3 },
  { path: "/administrator", title: "Admin Panel Accessible", risk: "MEDIUM", cvss: 5.3 },
  { path: "/backup.sql", title: "Database Backup Exposed", risk: "CRITICAL", cvss: 9.8 },
  { path: "/robots.txt", title: "robots.txt Found", risk: "INFO", cvss: 0 },
  { path: "/.htaccess", title: ".htaccess File Accessible", risk: "MEDIUM", cvss: 5.0 },
  { path: "/server-status", title: "Apache Server Status Exposed", risk: "MEDIUM", cvss: 5.3 },
  { path: "/error.log", title: "Error Log File Exposed", risk: "HIGH", cvss: 6.5 },
];

export async function runOWASPCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  // A05 — Security Misconfiguration: Check sensitive file exposure
  const checks = SENSITIVE_PATHS.map(async (item) => {
    try {
      const res = await fetch(`${target.protocol}//${target.domain}${item.path}`, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });

      if (res.status === 200) {
        const body = await res.text();
        const isActualContent = body.length > 10 && !body.toLowerCase().includes("404") && !body.toLowerCase().includes("not found");

        if (isActualContent) {
          let riskLevel: Finding["riskLevel"] = "INFO";
          let penalty = 0;

          switch (item.risk) {
            case "CRITICAL":
              riskLevel = "CRITICAL";
              penalty = 25;
              break;
            case "HIGH":
              riskLevel = "HIGH";
              penalty = 15;
              break;
            case "MEDIUM":
              riskLevel = "MEDIUM";
              penalty = 8;
              break;
            case "LOW":
              riskLevel = "LOW";
              penalty = 3;
              break;
            default:
              riskLevel = "INFO";
              penalty = 0;
          }

          score -= penalty;
          findings.push({
            id: `owasp-${item.path.replace(/[^a-z]/gi, "")}`,
            category: "OWASP_TOP10",
            title: item.title,
            description: `Sensitive file or endpoint accessible at ${item.path}`,
            riskLevel,
            cvss: item.cvss,
            cwe: item.risk === "CRITICAL" ? "CWE-552" : "CWE-200",
            evidence: `HTTP 200 response from ${target.protocol}//${target.domain}${item.path} (${body.length} bytes)`,
            impact: riskLevel === "CRITICAL"
              ? "Attackers can access sensitive configuration, credentials, or data."
              : "Attackers gain information useful for further attacks.",
            remediation: `Block access to ${item.path} via web server configuration. Add to .htaccess or nginx rules.`,
            effort: "LOW",
            affectedComponent: item.path,
          });
        }
      }
    } catch {
      // Path not accessible or timed out - good
    }
  });

  await Promise.allSettled(checks);

  // Check robots.txt for sensitive paths
  try {
    const robotsRes = await fetch(`${target.protocol}//${target.domain}/robots.txt`, {
      signal: AbortSignal.timeout(6000),
    });
    if (robotsRes.ok) {
      const robotsBody = await robotsRes.text();
      const disallowedPaths = robotsBody
        .split("\n")
        .filter((line) => line.toLowerCase().startsWith("disallow:"))
        .map((line) => line.replace(/disallow:\s*/i, "").trim());

      const sensitivePaths = disallowedPaths.filter((p) =>
        /admin|backup|config|private|secret|api|internal/i.test(p)
      );

      if (sensitivePaths.length > 0) {
        findings.push({
          id: "owasp-robots",
          category: "OWASP_TOP10",
          title: "Sensitive Paths Revealed in robots.txt",
          description: "robots.txt reveals paths that suggest sensitive areas of the application.",
          riskLevel: "MEDIUM",
          cwe: "CWE-200",
          evidence: `Disallowed paths include: ${sensitivePaths.join(", ")}`,
          impact: "Attackers use robots.txt as a roadmap to find interesting targets.",
          remediation: "Avoid listing sensitive paths in robots.txt. Use generic disallow rules.",
          effort: "LOW",
          affectedComponent: "/robots.txt",
        });
        score -= 5;
      }
    }
  } catch {
    // robots.txt not accessible
  }

  // A08 — Software and Data Integrity: Check SRI for CDN scripts
  try {
    const pageRes = await fetch(target.url, {
      signal: AbortSignal.timeout(10000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();

      // Check for CDN scripts without SRI
      const cdnScripts = html.match(/<script[^>]+src=["'][^"']*(?:cdn|ajax\.googleapis|cdnjs|unpkg|jsdelivr)[^"']*["'][^>]*>/gi) || [];
      const scriptsWithoutSRI = cdnScripts.filter((s) => !s.includes("integrity="));

      if (scriptsWithoutSRI.length > 0) {
        score -= 5;
        findings.push({
          id: "owasp-sri",
          category: "OWASP_TOP10",
          title: "CDN Scripts Missing Subresource Integrity (SRI)",
          description: `${scriptsWithoutSRI.length} CDN-hosted script(s) lack Subresource Integrity attributes.`,
          riskLevel: "MEDIUM",
          cwe: "CWE-829",
          evidence: `Scripts without SRI: ${scriptsWithoutSRI.slice(0, 2).join(", ")}`,
          impact: "If the CDN is compromised, malicious code can be injected into your site.",
          remediation: "Add integrity and crossorigin attributes to all CDN scripts. Use https://www.srihash.org/ to generate hashes.",
          effort: "MEDIUM",
        });
      }

      // Check for mixed content (HTTP resources on HTTPS page)
      if (target.protocol === "https:") {
        const httpResources = html.match(/(?:src|href|action)=["']http:\/\/[^"']+["']/gi) || [];
        if (httpResources.length > 0) {
          score -= 8;
          findings.push({
            id: "owasp-mixed",
            category: "OWASP_TOP10",
            title: "Mixed Content Detected",
            description: `${httpResources.length} HTTP resource(s) loaded on HTTPS page.`,
            riskLevel: "MEDIUM",
            cwe: "CWE-319",
            evidence: `HTTP resources: ${httpResources.slice(0, 2).join(", ")}`,
            impact: "HTTP resources can be intercepted and modified by attackers, compromising page integrity.",
            remediation: "Update all resource URLs to use HTTPS. Check for HTTP in script src, link href, and img src.",
            effort: "MEDIUM",
          });
        }
      }

      // A03 — Check for error messages (SQL errors)
      const sqlErrorPatterns = [
        /SQL syntax|mysql_fetch|ORA-\d{5}|pg_query|sqlite3/i,
        /Warning.*on line \d|Fatal error.*on line \d/i,
        /Microsoft OLE DB|ODBC.*Error/i,
      ];

      for (const pattern of sqlErrorPatterns) {
        if (pattern.test(html)) {
          score -= 20;
          findings.push({
            id: "owasp-sql-error",
            category: "OWASP_TOP10",
            title: "Database Error Messages Exposed",
            description: "SQL or database error messages are visible in the page response.",
            riskLevel: "HIGH",
            cvss: 6.5,
            cwe: "CWE-209",
            evidence: "Database error pattern detected in HTML response",
            impact: "Error messages reveal database type, structure, and query details useful for SQL injection attacks.",
            remediation: "Configure custom error pages. Disable verbose error output in production. Set display_errors = Off in PHP.",
            effort: "LOW",
          });
          break;
        }
      }

      // Check for version disclosure in meta tags
      const metaGenerator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
      if (metaGenerator) {
        score -= 3;
        findings.push({
          id: "owasp-generator",
          category: "OWASP_TOP10",
          title: "CMS/Framework Version Disclosed",
          description: `Meta generator tag reveals: '${metaGenerator[1]}'`,
          riskLevel: "LOW",
          cwe: "CWE-200",
          evidence: `<meta name="generator" content="${metaGenerator[1]}">`,
          impact: "Attackers can target known vulnerabilities for the specific CMS version.",
          remediation: "Remove the generator meta tag from HTML output.",
          effort: "LOW",
        });
      }
    }
  } catch {
    // Page fetch failed
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "OWASP_TOP10",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
