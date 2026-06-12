import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runServerSecurityCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const headers = Object.fromEntries(res.headers.entries());

    // Check for exposed Server headers
    const serverHeader = headers["server"];
    if (serverHeader) {
      score -= 10;
      findings.push({
        id: "server-header",
        category: "SERVER_SECURITY",
        title: "Server Software Disclosed",
        description: `The server exposes its software version: ${serverHeader}`,
        riskLevel: "LOW",
        evidence: `Server: ${serverHeader}`,
        impact: "Exposing specific server versions aids attackers in finding targeted exploits.",
        remediation: "Configure the web server to omit the Server header or use a generic name.",
        effort: "LOW",
      });
    }

    // Check for X-Powered-By
    const poweredBy = headers["x-powered-by"];
    if (poweredBy) {
      score -= 15;
      findings.push({
        id: "server-x-powered",
        category: "SERVER_SECURITY",
        title: "Framework Disclosed (X-Powered-By)",
        description: `The application exposes its framework: ${poweredBy}`,
        riskLevel: "MEDIUM",
        evidence: `X-Powered-By: ${poweredBy}`,
        impact: "Revealing the backend framework makes it easier to launch targeted exploits.",
        remediation: "Disable the X-Powered-By header in your application framework configuration.",
        effort: "LOW",
      });
    }

    if (!serverHeader && !poweredBy) {
      findings.push({
        id: "server-clean",
        category: "SERVER_SECURITY",
        title: "Server Identity Hidden",
        description: "The server does not expose sensitive identity headers.",
        riskLevel: "PASS",
        evidence: "No Server or X-Powered-By headers found.",
        impact: "Reduces attack surface.",
        remediation: "Continue to mask backend technologies.",
        effort: "LOW",
      });
    }

    // Google Safe Browsing Check
    if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
      try {
        const gsbUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`;
        const gsbBody = {
          client: { clientId: "webauditpro", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: target.url }]
          }
        };

        const gsbRes = await fetch(gsbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gsbBody),
          signal: AbortSignal.timeout(5000),
        });

        if (gsbRes.ok) {
          const gsbData = await gsbRes.json();
          if (gsbData.matches && gsbData.matches.length > 0) {
            score -= 40;
            findings.push({
              id: "server-gsb",
              category: "SERVER_SECURITY",
              title: "Google Safe Browsing Flagged",
              description: `Domain flagged for: ${gsbData.matches[0].threatType}`,
              riskLevel: "CRITICAL",
              cvss: 9.0,
              evidence: `ThreatType: ${gsbData.matches[0].threatType}`,
              impact: "Browsers will block users from accessing this site, showing a red warning screen.",
              remediation: "Investigate server for malware/phishing. Request a review via Google Search Console.",
              effort: "HIGH",
            });
          }
        }
      } catch { /* ignore API errors */ }
    }

    // VirusTotal API Check
    if (process.env.VIRUSTOTAL_API_KEY) {
      try {
        // We use the Domain report API (v3)
        const vtRes = await fetch(`https://www.virustotal.com/api/v3/domains/${target.domain}`, {
          method: "GET",
          headers: {
            "x-apikey": process.env.VIRUSTOTAL_API_KEY,
            "accept": "application/json"
          },
          signal: AbortSignal.timeout(5000),
        });

        if (vtRes.ok) {
          const vtData = await vtRes.json();
          const stats = vtData.data?.attributes?.last_analysis_stats;
          
          if (stats && (stats.malicious > 0 || stats.suspicious > 0)) {
            score -= 30;
            findings.push({
              id: "server-virustotal",
              category: "SERVER_SECURITY",
              title: `VirusTotal Flagged (${stats.malicious} malicious, ${stats.suspicious} suspicious)`,
              description: "Security vendors have flagged this domain as malicious or suspicious.",
              riskLevel: "CRITICAL",
              cvss: 8.5,
              evidence: `Malicious: ${stats.malicious}, Suspicious: ${stats.suspicious}`,
              impact: "User traffic may be blocked by enterprise firewalls and endpoint protection software.",
              remediation: "Review VirusTotal report to identify the flagging vendors and request delisting.",
              effort: "MEDIUM",
            });
          }
        }
      } catch { /* ignore API errors */ }
    }

    // NVD API Check (If server software version is leaked)
    if (process.env.NVD_API_KEY && serverHeader && /[\d.]+/.test(serverHeader)) {
      try {
        // Create a simple keyword search like "nginx 1.24.0"
        const keyword = encodeURIComponent(serverHeader.replace(/\//g, " "));
        const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}&resultsPerPage=1`;
        
        const nvdRes = await fetch(nvdUrl, {
          method: "GET",
          headers: {
            "apiKey": process.env.NVD_API_KEY
          },
          signal: AbortSignal.timeout(6000),
        });

        if (nvdRes.ok) {
          const nvdData = await nvdRes.json();
          if (nvdData.totalResults > 0 && nvdData.vulnerabilities?.length > 0) {
            const vuln = nvdData.vulnerabilities[0].cve;
            score -= 20;
            findings.push({
              id: "server-nvd-cve",
              category: "SERVER_SECURITY",
              title: `Known Vulnerabilities for ${serverHeader}`,
              description: `The NVD database returned known CVEs for the exposed server version.`,
              riskLevel: "HIGH",
              cve: vuln.id,
              evidence: `CVE Found: ${vuln.id} - ${vuln.descriptions?.[0]?.value?.substring(0, 100)}...`,
              impact: "Attackers can use publicly available exploit code against this specific server version.",
              remediation: "Upgrade the server software to the latest patched version and hide version headers.",
              effort: "MEDIUM",
              references: [`https://nvd.nist.gov/vuln/detail/${vuln.id}`]
            });
          }
        }
      } catch { /* ignore API errors */ }
    }

  } catch {
    score = 70;
  }

  return {
    category: "SERVER_SECURITY",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
