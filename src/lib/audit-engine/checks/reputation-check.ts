import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runDatabaseSecurityCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    // 1. IPInfo API (Geolocation & ASN)
    if (process.env.IPINFO_API_KEY && target.ip) {
      try {
        const ipRes = await fetch(`https://ipinfo.io/${target.ip}?token=${process.env.IPINFO_API_KEY}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.org || ipData.country) {
            findings.push({
              id: "ip-reputation-info",
              category: "DATABASE_SECURITY", // Keeping original category name for compatibility
              title: `Hosting Provider Info: ${ipData.org || "Unknown ASN"}`,
              description: `Server is hosted in ${ipData.city || "Unknown"}, ${ipData.country || "Unknown"}.`,
              riskLevel: "INFO",
              evidence: `ASN: ${ipData.org}, Location: ${ipData.loc}`,
              impact: "Provides context on where the server is located and who owns the IP.",
              remediation: "N/A",
              effort: "LOW",
            });
          }
        }
      } catch { /* ignore API errors */ }
    }

    // 2. AbuseIPDB API (IP Reputation)
    if (process.env.ABUSEIPDB_API_KEY && target.ip) {
      try {
        const abuseRes = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${target.ip}`, {
          method: "GET",
          headers: {
            "Key": process.env.ABUSEIPDB_API_KEY,
            "Accept": "application/json"
          },
          signal: AbortSignal.timeout(5000)
        });
        if (abuseRes.ok) {
          const abuseData = await abuseRes.json();
          const scoreAbuse = abuseData.data.abuseConfidenceScore;
          if (scoreAbuse > 0) {
            score -= (scoreAbuse > 50 ? 30 : 15);
            findings.push({
              id: "ip-abuse",
              category: "DATABASE_SECURITY",
              title: `IP Abuse Confidence: ${scoreAbuse}%`,
              description: `This IP has been reported ${abuseData.data.totalReports} times recently for malicious behavior.`,
              riskLevel: scoreAbuse > 50 ? "CRITICAL" : "MEDIUM",
              evidence: `AbuseIPDB Score: ${scoreAbuse}%`,
              impact: "Traffic from this IP may be blocked or throttled by external firewalls. It may be part of a botnet or compromised host.",
              remediation: "Investigate server logs for unauthorized outbound traffic and request delisting on AbuseIPDB if resolved.",
              effort: "HIGH",
            });
          }
        }
      } catch { /* ignore API errors */ }
    }

    // 3. Database Exposed Panels
    const dbPaths = [
      "/phpmyadmin",
      "/pma",
      "/adminer.php",
      "/dbadmin",
      "/mysql",
      "/pgadmin"
    ];

    for (const path of dbPaths) {
      try {
        const res = await fetch(`${target.protocol}//${target.domain}${path}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000),
        });

        if (res.status === 200 || res.status === 401 || res.status === 403) {
          score -= 30;
          findings.push({
            id: `db-exposed-${path.replace(/[^a-z]/g, "")}`,
            category: "DATABASE_SECURITY",
            title: `Exposed Database Admin Panel: ${path}`,
            description: `A database management tool appears to be accessible at ${path}.`,
            riskLevel: "CRITICAL",
            evidence: `HTTP ${res.status} from ${path}`,
            impact: "Exposing database management interfaces to the public internet is extremely dangerous and allows brute force or zero-day exploitation.",
            remediation: "Restrict access to database admin tools using IP allowlists, VPNs, or completely remove them from production.",
            effort: "LOW",
          });
        }
      } catch {
        // Ignored
      }
    }

    if (findings.length === 0 || findings.every(f => f.riskLevel === "INFO")) {
      findings.push({
        id: "db-clean",
        category: "DATABASE_SECURITY",
        title: "Clean IP Reputation & No Exposed DB",
        description: "IP reputation is clean and common database paths are inaccessible.",
        riskLevel: "PASS",
        evidence: "No positive responses from AbuseIPDB or common DB paths.",
        impact: "Reduces risk of direct database attacks and blocklisting.",
        remediation: "Continue monitoring reputation.",
        effort: "LOW",
      });
    }

  } catch {
    score = 70;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "DATABASE_SECURITY",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
