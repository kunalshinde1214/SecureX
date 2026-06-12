import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runAuthCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const html = await res.text();

    // Check for common login paths
    const loginPaths = ["/login", "/admin", "/wp-admin", "/signin"];
    for (const path of loginPaths) {
      try {
        const loginRes = await fetch(`${target.protocol}//${target.domain}${path}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000),
        });
        if (loginRes.status === 200) {
          findings.push({
            id: `auth-exposed-${path.replace(/[^a-z]/g, "")}`,
            category: "AUTH_ACCESS",
            title: `Exposed Login Portal: ${path}`,
            description: `A login portal was found at ${path}.`,
            riskLevel: "INFO",
            evidence: `HTTP 200 OK from ${path}`,
            impact: "Exposed admin/login portals are prime targets for brute-force attacks.",
            remediation: "Implement rate limiting, MFA, and strong password policies on all authentication endpoints.",
            effort: "MEDIUM",
          });
        }
      } catch {
        // Ignored
      }
    }

    // Look for password fields
    if (/<input[^>]*type=["']password["']/i.test(html)) {
      findings.push({
        id: "auth-password-field",
        category: "AUTH_ACCESS",
        title: "Authentication Mechanism Detected",
        description: "The page contains password input fields.",
        riskLevel: "PASS",
        evidence: "<input type='password'> detected",
        impact: "Requires protection against brute-force and credential stuffing.",
        remediation: "Ensure HTTPS is strictly enforced. Implement account lockout and MFA.",
        effort: "LOW",
      });
      
      // If we have password fields but no HTTPS, that's a huge issue
      if (target.protocol !== "https:") {
        score -= 50;
        findings.push({
          id: "auth-cleartext-pass",
          category: "AUTH_ACCESS",
          title: "Cleartext Password Transmission",
          description: "Password fields are present on a page served over unencrypted HTTP.",
          riskLevel: "CRITICAL",
          cwe: "CWE-319",
          evidence: `HTTP used with password fields on ${target.url}`,
          impact: "Attackers can intercept passwords in transit.",
          remediation: "Enforce HTTPS for all authentication pages.",
          effort: "LOW",
        });
      }
    }

  } catch {
    score = 70;
  }

  return {
    category: "AUTH_ACCESS",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
