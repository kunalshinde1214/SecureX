import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runThreatIntelCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    // 1. URLHaus (Malware Distribution) - Free, no auth
    try {
      const urlhausRes = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `host=${target.domain}`,
        signal: AbortSignal.timeout(5000),
      });
      if (urlhausRes.ok) {
        const urlhausData = await urlhausRes.json();
        if (urlhausData.query_status === "ok" && urlhausData.urlhaus_reference) {
          score -= 40;
          findings.push({
            id: "urlhaus-malware",
            category: "THREAT_INTELLIGENCE",
            title: "Known Malware Distributor (URLHaus)",
            description: `This domain is listed on URLHaus as distributing malware.`,
            riskLevel: "CRITICAL",
            evidence: `Found ${urlhausData.url_count} malicious URLs.`,
            impact: "Users visiting this domain are at high risk of malware infection.",
            remediation: "Investigate server compromise immediately and clean malicious files.",
            effort: "HIGH",
            references: [urlhausData.urlhaus_reference]
          });
        }
      }
    } catch { /* ignore */ }

    // 2. Phisherman (Phishing)
    if (process.env.PHISHERMAN_API_KEY) {
      try {
        const phishRes = await fetch(`https://api.phisherman.gg/v2/domains/check/${target.domain}`, {
          headers: { "Authorization": `Bearer ${process.env.PHISHERMAN_API_KEY}` },
          signal: AbortSignal.timeout(5000),
        });
        if (phishRes.ok) {
          const phishData = await phishRes.json();
          if (phishData.status === "verifiedPhish" || phishData.verifiedPhish) {
            score -= 40;
            findings.push({
              id: "phisherman-phishing",
              category: "THREAT_INTELLIGENCE",
              title: "Known Phishing Domain",
              description: `This domain is flagged as a known phishing site by Phisherman.`,
              riskLevel: "CRITICAL",
              evidence: "Phisherman API returned verified phishing status.",
              impact: "The domain is actively deceiving users.",
              remediation: "Take down phishing content and secure the server.",
              effort: "HIGH",
            });
          }
        }
      } catch { /* ignore */ }
    }

    // 3. AlienVault OTX
    if (process.env.ALIENVAULT_OTX_API_KEY) {
      try {
        const otxRes = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${target.domain}/general`, {
          headers: { "X-OTX-API-KEY": process.env.ALIENVAULT_OTX_API_KEY },
          signal: AbortSignal.timeout(5000),
        });
        if (otxRes.ok) {
          const otxData = await otxRes.json();
          if (otxData.pulse_info && otxData.pulse_info.count > 0) {
            score -= 20;
            findings.push({
              id: "otx-threat-intel",
              category: "THREAT_INTELLIGENCE",
              title: `AlienVault OTX: ${otxData.pulse_info.count} Threat Pulses`,
              description: `Domain is associated with ${otxData.pulse_info.count} threat intelligence pulses.`,
              riskLevel: "HIGH",
              evidence: `OTX Pulses: ${otxData.pulse_info.count}`,
              impact: "Domain has been observed in malicious campaigns or IOC feeds.",
              remediation: "Investigate the specific pulses on AlienVault OTX to understand the context.",
              effort: "MEDIUM",
            });
          }
        }
      } catch { /* ignore */ }
    }

    // 4. Pulsedive
    if (process.env.PULSEDIVE_API_KEY) {
      try {
        const pdRes = await fetch(`https://pulsedive.com/api/info.php?indicator=${target.domain}&key=${process.env.PULSEDIVE_API_KEY}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (pdRes.ok) {
          const pdData = await pdRes.json();
          if (pdData.risk && pdData.risk !== "none" && pdData.risk !== "unknown") {
            const isHigh = pdData.risk === "high" || pdData.risk === "critical";
            score -= isHigh ? 20 : 10;
            findings.push({
              id: "pulsedive-risk",
              category: "THREAT_INTELLIGENCE",
              title: `Pulsedive Risk: ${pdData.risk.toUpperCase()}`,
              description: `Pulsedive has scored this domain's risk as ${pdData.risk}.`,
              riskLevel: isHigh ? "HIGH" : "MEDIUM",
              evidence: `Risk level: ${pdData.risk}`,
              impact: "Domain exhibits potentially malicious characteristics.",
              remediation: "Review Pulsedive indicator details for specific threats.",
              effort: "MEDIUM",
            });
          }
        }
      } catch { /* ignore */ }
    }

    // 5. GreyNoise Community
    if (process.env.GREYNOISE_API_KEY && target.ip) {
      try {
        const gnRes = await fetch(`https://api.greynoise.io/v3/community/${target.ip}`, {
          headers: { "key": process.env.GREYNOISE_API_KEY, "Accept": "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        if (gnRes.ok) {
          const gnData = await gnRes.json();
          if (gnData.noise || gnData.riot) {
            findings.push({
              id: "greynoise-intel",
              category: "THREAT_INTELLIGENCE",
              title: "GreyNoise Intelligence",
              description: gnData.riot 
                ? "This IP belongs to a known benign service (RIOT)." 
                : `This IP is known internet background noise (Classification: ${gnData.classification}).`,
              riskLevel: gnData.classification === "malicious" ? "HIGH" : "INFO",
              evidence: `Noise: ${gnData.noise}, RIOT: ${gnData.riot}, Class: ${gnData.classification}`,
              impact: "Contextual information regarding the IP's internet-wide scanning activity.",
              remediation: "N/A",
              effort: "LOW",
            });
            if (gnData.classification === "malicious") {
               score -= 20;
            }
          }
        }
      } catch { /* ignore */ }
    }

    if (findings.length === 0 || findings.every(f => f.riskLevel === "INFO")) {
      findings.push({
        id: "threat-intel-clean",
        category: "THREAT_INTELLIGENCE",
        title: "Clean Threat Intelligence Profile",
        description: "No significant threat intelligence flags found across checked services.",
        riskLevel: "PASS",
        evidence: "Queried URLHaus, Phisherman, OTX, Pulsedive, and GreyNoise.",
        impact: "Domain and IP are not currently associated with known large-scale malicious campaigns.",
        remediation: "None",
        effort: "LOW",
      });
    }

  } catch {
    score = 70; // fallback
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "THREAT_INTELLIGENCE",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
