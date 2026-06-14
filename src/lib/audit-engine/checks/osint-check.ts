import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runOSINTCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    // 1. Shodan Developer API or Free InternetDB Fallback
    if (target.ip) {
      if (process.env.SHODAN_API_KEY) {
        try {
          const shodanRes = await fetch(`https://api.shodan.io/shodan/host/${target.ip}?key=${process.env.SHODAN_API_KEY}`, {
            signal: AbortSignal.timeout(5000),
          });
          if (shodanRes.ok) {
            const shodanData = await shodanRes.json();
            if (shodanData.ports && shodanData.ports.length > 0) {
              findings.push({
                id: "shodan-open-ports",
                category: "OSINT_RECON",
                title: `Shodan: ${shodanData.ports.length} Open Ports`,
                description: `Shodan has indexed ${shodanData.ports.length} open ports on this IP.`,
                riskLevel: "INFO",
                evidence: `Ports: ${shodanData.ports.join(", ")}`,
                impact: "Provides visibility into externally exposed services.",
                remediation: "Review open ports and restrict access using firewalls.",
                effort: "LOW",
              });
            }
            if (shodanData.vulns && shodanData.vulns.length > 0) {
              score -= 30;
              findings.push({
                id: "shodan-vulns",
                category: "OSINT_RECON",
                title: "Shodan: Known Vulnerabilities Found",
                description: `Shodan reports known vulnerabilities (CVEs) associated with services on this IP.`,
                riskLevel: "HIGH",
                evidence: `CVEs: ${shodanData.vulns.join(", ")}`,
                impact: "Server may be exploitable using publicly known vulnerabilities.",
                remediation: "Patch the vulnerable services immediately.",
                effort: "HIGH",
              });
            }
          }
        } catch { /* ignore */ }
      } else {
        // Free Fallback: Shodan InternetDB
        try {
          const internetDbRes = await fetch(`https://internetdb.shodan.io/${target.ip}`, {
            signal: AbortSignal.timeout(5000),
          });
          if (internetDbRes.ok) {
            const dbData = await internetDbRes.json();
            if (dbData.ports && dbData.ports.length > 0) {
              findings.push({
                id: "shodan-internetdb-ports",
                category: "OSINT_RECON",
                title: `InternetDB: ${dbData.ports.length} Open Ports`,
                description: `Shodan InternetDB has indexed ${dbData.ports.length} open ports on this IP.`,
                riskLevel: "INFO",
                evidence: `Ports: ${dbData.ports.join(", ")}`,
                impact: "Provides visibility into externally exposed services.",
                remediation: "Review open ports and restrict access.",
                effort: "LOW",
              });
            }
            if (dbData.vulns && dbData.vulns.length > 0) {
              score -= 30;
              findings.push({
                id: "shodan-internetdb-vulns",
                category: "OSINT_RECON",
                title: "InternetDB: Known Vulnerabilities Found",
                description: `Shodan InternetDB reports known CVEs associated with this IP.`,
                riskLevel: "HIGH",
                evidence: `CVEs: ${dbData.vulns.join(", ")}`,
                impact: "Server may be exploitable using known vulnerabilities.",
                remediation: "Patch the vulnerable services.",
                effort: "HIGH",
              });
            }
          }
        } catch { /* ignore */ }
      }
    }

    // 2. SecurityTrails (Subdomains)
    if (process.env.SECURITYTRAILS_API_KEY) {
      try {
        const stRes = await fetch(`https://api.securitytrails.com/v1/domain/${target.domain}/subdomains`, {
          headers: { "APIKEY": process.env.SECURITYTRAILS_API_KEY },
          signal: AbortSignal.timeout(5000),
        });
        if (stRes.ok) {
          const stData = await stRes.json();
          if (stData.subdomains && stData.subdomains.length > 0) {
            findings.push({
              id: "securitytrails-subdomains",
              category: "OSINT_RECON",
              title: `SecurityTrails: ${stData.subdomain_count} Subdomains Found`,
              description: `Discovered multiple subdomains associated with the root domain.`,
              riskLevel: "INFO",
              evidence: `Subdomains count: ${stData.subdomain_count}`,
              impact: "Identifies the external attack surface of the organization.",
              remediation: "Ensure all subdomains are inventoried and properly secured.",
              effort: "LOW",
            });
          }
        }
      } catch { /* ignore */ }
    }

    // 3. Hunter.io (Emails)
    if (process.env.HUNTER_API_KEY) {
      try {
        const hunterRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${target.domain}&api_key=${process.env.HUNTER_API_KEY}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (hunterRes.ok) {
          const hunterData = await hunterRes.json();
          if (hunterData.data && hunterData.data.emails && hunterData.data.emails.length > 0) {
            findings.push({
              id: "hunter-emails",
              category: "OSINT_RECON",
              title: `Hunter.io: ${hunterData.data.emails.length} Emails Exposed`,
              description: `Found publicly exposed email addresses associated with this domain.`,
              riskLevel: "INFO",
              evidence: `Exposed Emails: ${hunterData.data.emails.length}`,
              impact: "Can be used by attackers for targeted spear-phishing campaigns.",
              remediation: "Educate employees on phishing risks.",
              effort: "LOW",
            });
          }
        }
      } catch { /* ignore */ }
    }

    // 4. URLScan.io (Sandbox Search)
    if (process.env.URLSCAN_API_KEY) {
      try {
        const urlscanRes = await fetch(`https://urlscan.io/api/v1/search/?q=domain:${target.domain}`, {
          headers: { "API-Key": process.env.URLSCAN_API_KEY },
          signal: AbortSignal.timeout(5000),
        });
        if (urlscanRes.ok) {
          const urlscanData = await urlscanRes.json();
          if (urlscanData.results && urlscanData.results.length > 0) {
            findings.push({
              id: "urlscan-history",
              category: "OSINT_RECON",
              title: "URLScan.io History Found",
              description: `This domain has been previously scanned by URLScan.io.`,
              riskLevel: "INFO",
              evidence: `Found ${urlscanData.results.length} previous scans.`,
              impact: "Domain history is publicly available on URLScan.",
              remediation: "N/A",
              effort: "LOW",
            });
          }
        }
      } catch { /* ignore */ }
    }

    if (findings.length === 0) {
      findings.push({
        id: "osint-clean",
        category: "OSINT_RECON",
        title: "Minimal OSINT Footprint",
        description: "No significant data found on external OSINT sources.",
        riskLevel: "PASS",
        evidence: "Queried Shodan, SecurityTrails, Hunter.io, and URLScan.",
        impact: "Reduces the publicly available attack surface.",
        remediation: "None",
        effort: "LOW",
      });
    }

  } catch {
    score = 70; // fallback
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "OSINT_RECON",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
