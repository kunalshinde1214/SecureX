import { CheckResult, Finding, ScanTarget } from "@/types/audit";

// Lightweight stubs for remaining categories to complete the 15-check suite

export async function runComplianceCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 80;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const headers = Object.fromEntries(res.headers.entries());

    // GDPR checks
    const hasPrivacyPolicy = /privacy.policy|privacy-policy/i.test(html);
    const hasCookieConsent = /cookie.consent|gdpr|cookieconsent/i.test(html);
    const hasHTTPS = target.protocol === "https:";

    if (!hasPrivacyPolicy) {
      score -= 15;
      findings.push({
        id: "comp-gdpr-privacy",
        category: "COMPLIANCE",
        title: "GDPR: Privacy Policy Missing",
        description: "No privacy policy link detected. Required for GDPR compliance.",
        riskLevel: "HIGH",
        evidence: "No privacy policy link in HTML",
        impact: "Non-compliance with GDPR Article 13/14 (information obligations). Potential fines up to €20M or 4% of turnover.",
        remediation: "Create a comprehensive privacy policy and link it from every page.",
        effort: "HIGH",
      });
    }

    if (!hasCookieConsent) {
      score -= 10;
      findings.push({
        id: "comp-gdpr-consent",
        category: "COMPLIANCE",
        title: "GDPR: Cookie Consent Mechanism Missing",
        description: "No cookie consent banner detected.",
        riskLevel: "MEDIUM",
        evidence: "No cookie consent mechanism found",
        impact: "Non-compliance with GDPR and ePrivacy Directive requirements.",
        remediation: "Implement a GDPR-compliant cookie consent system before setting any non-essential cookies.",
        effort: "MEDIUM",
      });
    }

    // PCI-DSS checks
    if (!hasHTTPS) {
      score -= 20;
      findings.push({
        id: "comp-pci-https",
        category: "COMPLIANCE",
        title: "PCI-DSS: No HTTPS (Requirement 4.2)",
        description: "PCI-DSS Requirement 4.2 mandates encryption of cardholder data in transit.",
        riskLevel: "CRITICAL",
        evidence: "Site uses HTTP instead of HTTPS",
        impact: "PCI-DSS violation. Any payment processing on this site is non-compliant.",
        remediation: "Enable HTTPS immediately before accepting any payment information.",
        effort: "MEDIUM",
      });
    }

    const hsts = headers["strict-transport-security"];
    if (!hsts) {
      score -= 5;
      findings.push({
        id: "comp-pci-hsts",
        category: "COMPLIANCE",
        title: "PCI-DSS: HSTS Not Configured",
        description: "HSTS helps satisfy PCI-DSS requirement for encrypted connections.",
        riskLevel: "MEDIUM",
        evidence: "Strict-Transport-Security header missing",
        impact: "Partial PCI-DSS non-compliance.",
        remediation: "Enable HSTS with appropriate max-age.",
        effort: "LOW",
      });
    }

    // SOC 2 checks
    const hasWAF = headers["cf-ray"] || headers["x-sucuri-id"] || headers["x-akamai-transformed"];
    if (!hasWAF) {
      findings.push({
        id: "comp-soc2-waf",
        category: "COMPLIANCE",
        title: "SOC 2: No WAF Detected",
        description: "No Web Application Firewall detected. SOC 2 security controls recommend WAF protection.",
        riskLevel: "INFO",
        evidence: "No WAF-specific response headers found",
        impact: "Without WAF, application-layer attacks are harder to detect and block.",
        remediation: "Consider implementing a WAF such as Cloudflare (free tier) or AWS WAF for SOC 2 compliance.",
        effort: "MEDIUM",
      });
    }

    score = Math.max(0, Math.min(100, score));
  } catch {
    score = 50;
  }

  return {
    category: "COMPLIANCE",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}

export async function runFileUploadCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();

    // Find file upload forms
    const uploadForms = html.match(/<input[^>]+type=["']file["'][^>]*>/gi) || [];
    if (uploadForms.length > 0) {
      const acceptAttributes = uploadForms.filter((f) => f.includes("accept="));
      const noAcceptForms = uploadForms.length - acceptAttributes.length;

      if (noAcceptForms > 0) {
        score -= 15;
        findings.push({
          id: "upload-accept",
          category: "FILE_UPLOAD",
          title: "File Upload Without Type Restriction",
          description: `${noAcceptForms} file upload input(s) have no 'accept' attribute to restrict file types.`,
          riskLevel: "HIGH",
          cwe: "CWE-434",
          evidence: `${noAcceptForms}/${uploadForms.length} upload inputs lack 'accept' attribute`,
          impact: "Without type restrictions, attackers may upload malicious files (webshells, malware).",
          remediation: "Add 'accept' attribute to limit allowed file types. Also validate file types server-side.",
          effort: "LOW",
        });
      }

      findings.push({
        id: "upload-detected",
        category: "FILE_UPLOAD",
        title: `${uploadForms.length} File Upload Input(s) Detected`,
        description: "File upload functionality is present on the page.",
        riskLevel: "INFO",
        evidence: `${uploadForms.length} file input(s) found`,
        impact: "File uploads require careful security validation to prevent malicious file uploads.",
        remediation: "Ensure server-side validation: check file type, size, scan for malware, store outside web root.",
        effort: "HIGH",
      });
    } else {
      findings.push({
        id: "upload-none",
        category: "FILE_UPLOAD",
        title: "No File Upload Forms Detected",
        description: "No file upload inputs found on the main page.",
        riskLevel: "PASS",
        evidence: "No <input type='file'> elements found",
        impact: "No file upload risk on main page.",
        remediation: "No action required.",
        effort: "LOW",
      });
    }

  } catch {
    score = 70;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "FILE_UPLOAD",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}

export async function runLoggingCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 80;

  // Check for exposed log files
  const logPaths = ["/error.log", "/access.log", "/logs/", "/log/", "/.log", "/debug.log"];
  await Promise.allSettled(
    logPaths.map(async (path) => {
      try {
        const res = await fetch(`${target.protocol}//${target.domain}${path}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.status === 200) {
          const body = await res.text();
          if (body.length > 100) {
            score -= 20;
            findings.push({
              id: `log-${path.replace(/[^a-z]/gi, "")}`,
              category: "LOGGING_MONITORING",
              title: `Log File Exposed: ${path}`,
              description: `A log file is publicly accessible at ${path}.`,
              riskLevel: "HIGH",
              cwe: "CWE-532",
              evidence: `HTTP 200 from ${target.domain}${path} (${body.length} bytes)`,
              impact: "Log files may contain sensitive data: user emails, IP addresses, error stack traces, and database queries.",
              remediation: `Deny access to ${path} via web server config. Never store logs in the web root.`,
              effort: "LOW",
            });
          }
        }
      } catch { /* not accessible */ }
    })
  );

  // Check for security.txt
  try {
    const securityRes = await fetch(`${target.protocol}//${target.domain}/.well-known/security.txt`, {
      signal: AbortSignal.timeout(5000),
    });
    if (securityRes.ok) {
      findings.push({
        id: "log-security-txt",
        category: "LOGGING_MONITORING",
        title: "security.txt File Present",
        description: "A security.txt file helps security researchers report vulnerabilities responsibly.",
        riskLevel: "PASS",
        evidence: "/.well-known/security.txt is accessible",
        impact: "No impact - security.txt improves responsible disclosure.",
        remediation: "No action required.",
        effort: "LOW",
      });
    } else {
      score -= 5;
      findings.push({
        id: "log-no-security-txt",
        category: "LOGGING_MONITORING",
        title: "security.txt Not Found",
        description: "No security.txt file found. Makes it harder for security researchers to report vulnerabilities.",
        riskLevel: "INFO",
        evidence: "/.well-known/security.txt returns non-200 status",
        impact: "Security researchers may have no clear way to report vulnerabilities responsibly.",
        remediation: "Create /.well-known/security.txt per RFC 9116. Use https://securitytxt.org to generate.",
        effort: "LOW",
      });
    }
  } catch { /* not accessible */ }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "LOGGING_MONITORING",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}

export async function runBackupCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  const backupPaths = [
    "/backup.sql", "/backup.zip", "/backup.tar.gz", "/db.sql",
    "/database.sql", "/dump.sql", "/site.zip", "/www.zip",
    "/backup/", "/.bak", "/old/", "/archive/"
  ];

  await Promise.allSettled(
    backupPaths.map(async (path) => {
      try {
        const res = await fetch(`${target.protocol}//${target.domain}${path}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        if (res.status === 200) {
          score -= 25;
          findings.push({
            id: `backup-${path.replace(/[^a-z]/gi, "")}`,
            category: "BACKUP_RECOVERY",
            title: `Backup File Exposed: ${path}`,
            description: `A backup file appears to be publicly accessible at ${path}.`,
            riskLevel: "CRITICAL",
            cvss: 9.8,
            cwe: "CWE-552",
            evidence: `HTTP 200 HEAD response from ${target.domain}${path}`,
            impact: "Database dumps and backup files contain all your data and can be downloaded by anyone.",
            remediation: `Remove backup files from the web root immediately. Store backups outside the web-accessible directory.`,
            effort: "LOW",
          });
        }
      } catch { /* not accessible */ }
    })
  );

  if (findings.length === 0) {
    findings.push({
      id: "backup-pass",
      category: "BACKUP_RECOVERY",
      title: "No Exposed Backup Files Found",
      description: "Common backup file paths are not publicly accessible.",
      riskLevel: "PASS",
      evidence: "Checked common backup file paths - all returned non-200 responses",
      impact: "No impact.",
      remediation: "Continue to ensure backups are stored outside the web root.",
      effort: "LOW",
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "BACKUP_RECOVERY",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}

export async function runThirdPartyCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 85;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();

    // Check for OSV.dev package vulnerabilities
    const scripts = html.match(/<script[^>]+src=["'][^"']+["'][^>]*>/gi) || [];
    const cdnPackages: Array<{ name: string; version?: string; url: string }> = [];

    scripts.forEach(script => {
      const urlMatch = script.match(/src=["']([^"']+)["']/);
      if (urlMatch) {
        const url = urlMatch[1];
        const pkgMatch = url.match(/(?:unpkg|jsdelivr|cdnjs)\.com\/.*?([\w-]+)[@/]([\d.]+)/);
        if (pkgMatch) {
          cdnPackages.push({ name: pkgMatch[1], version: pkgMatch[2], url });
        }
      }
    });

    if (cdnPackages.length > 0) {
      findings.push({
        id: "third-cdn",
        category: "THIRD_PARTY",
        title: `${cdnPackages.length} CDN-Hosted Package(s) Detected`,
        description: "Third-party packages loaded from CDN. Check for known vulnerabilities.",
        riskLevel: "INFO",
        evidence: `CDN packages: ${cdnPackages.map(p => `${p.name}@${p.version}`).join(", ")}`,
        impact: "Outdated or vulnerable CDN packages can introduce security vulnerabilities.",
        remediation: "Keep CDN packages up to date. Use Subresource Integrity (SRI) attributes.",
        effort: "MEDIUM",
      });

      // Check OSV.dev for vulnerabilities
      for (const pkg of cdnPackages.slice(0, 3)) {
        try {
          const osvRes = await fetch("https://api.osv.dev/v1/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              package: { name: pkg.name, ecosystem: "npm" },
              version: pkg.version,
            }),
            signal: AbortSignal.timeout(6000),
          });

          if (osvRes.ok) {
            const osvData = await osvRes.json();
            if (osvData.vulns && osvData.vulns.length > 0) {
              score -= 15;
              findings.push({
                id: `third-osv-${pkg.name}`,
                category: "THIRD_PARTY",
                title: `${osvData.vulns.length} Vulnerability(ies) in ${pkg.name}`,
                description: `OSV database found vulnerabilities in ${pkg.name}@${pkg.version}.`,
                riskLevel: "HIGH",
                cve: osvData.vulns[0]?.id,
                evidence: `OSV.dev: ${osvData.vulns.length} vuln(s) for ${pkg.name}@${pkg.version}`,
                impact: "Known vulnerabilities in third-party packages can be exploited by attackers.",
                remediation: `Update ${pkg.name} to the latest version. Run npm audit for full dependency check.`,
                effort: "LOW",
                references: [`https://osv.dev/vulnerability/${osvData.vulns[0]?.id}`],
              });
            }
          }
        } catch { /* OSV check failed */ }
      }
    }

    score = Math.max(0, Math.min(100, score));
  } catch {
    score = 70;
  }

  return {
    category: "THIRD_PARTY",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}

export async function runCloudCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 80;

  try {
    const res = await fetch(target.url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    const headers = Object.fromEntries(res.headers.entries());

    // WAF detection
    const wafIndicators = {
      "Cloudflare": ["cf-ray", "cf-cache-status"],
      "AWS WAF": ["x-amzn-requestid", "x-amz-cf-id"],
      "Fastly": ["x-fastly-request-id"],
      "Akamai": ["x-akamai-transformed", "x-akamai-request-id"],
      "Sucuri": ["x-sucuri-id"],
      "Imperva": ["x-iinfo"],
    };

    let detectedWAF: string | null = null;
    for (const [waf, indicators] of Object.entries(wafIndicators)) {
      if (indicators.some(indicator => headers[indicator])) {
        detectedWAF = waf;
        break;
      }
    }

    if (detectedWAF) {
      findings.push({
        id: "cloud-waf",
        category: "CLOUD_HOSTING",
        title: `WAF Detected: ${detectedWAF}`,
        description: `Site is protected by ${detectedWAF} Web Application Firewall.`,
        riskLevel: "PASS",
        evidence: `${detectedWAF} WAF headers detected in response`,
        impact: "No impact - WAF provides additional security layer.",
        remediation: "Ensure WAF rules are properly configured and updated.",
        effort: "LOW",
      });
    } else {
      score -= 15;
      findings.push({
        id: "cloud-no-waf",
        category: "CLOUD_HOSTING",
        title: "No WAF Detected",
        description: "No Web Application Firewall detected protecting this site.",
        riskLevel: "MEDIUM",
        evidence: "No WAF-specific headers in response",
        impact: "Without WAF, common web attacks (SQLi, XSS, DDoS) may succeed more easily.",
        remediation: "Consider Cloudflare (free tier), AWS WAF, or similar for WAF protection.",
        effort: "MEDIUM",
      });
    }

    // CDN detection
    const cdnIndicators = {
      "Cloudflare": ["cf-ray"],
      "AWS CloudFront": ["x-amz-cf-id"],
      "Fastly": ["x-fastly-request-id"],
      "Vercel": ["x-vercel-id"],
      "Netlify": ["x-nf-request-id"],
    };

    let detectedCDN: string | null = null;
    for (const [cdn, indicators] of Object.entries(cdnIndicators)) {
      if (indicators.some(indicator => headers[indicator])) {
        detectedCDN = cdn;
        break;
      }
    }

    if (detectedCDN) {
      findings.push({
        id: "cloud-cdn",
        category: "CLOUD_HOSTING",
        title: `CDN Detected: ${detectedCDN}`,
        description: `Site is served through ${detectedCDN} CDN for improved performance and availability.`,
        riskLevel: "PASS",
        evidence: `${detectedCDN} CDN headers detected`,
        impact: "No impact - CDN improves performance.",
        remediation: "No action required.",
        effort: "LOW",
      });
    }

    // HackerTarget Subdomain & DNS check (Free tier: 100/day)
    try {
      const htRes = await fetch(`https://api.hackertarget.com/hostsearch/?q=${target.domain}`, { signal: AbortSignal.timeout(5000) });
      if (htRes.ok) {
        const htData = await htRes.text();
        const lines = htData.split('\n').filter(l => l.trim().length > 0);
        // Ensure it's not an API error message like "API count exceeded"
        if (lines.length > 0 && lines[0].includes(',')) {
          findings.push({
            id: "cloud-hackertarget",
            category: "CLOUD_HOSTING",
            title: `Host Reconnaissance: ${lines.length} Associated Records`,
            description: "HackerTarget identified active subdomains and DNS records.",
            riskLevel: "INFO",
            evidence: `Found ${lines.length} records. Sample: ${lines.slice(0, 3).join(" | ")}`,
            impact: "Exposed subdomains may host forgotten dev/staging environments vulnerable to takeover.",
            remediation: "Regularly audit subdomains and ensure all development environments are authenticated and not publicly accessible.",
            effort: "MEDIUM",
          });
        }
      }
    } catch { /* ignore */ }

    // RDAP (IANA) WHOIS Check
    try {
      const rdapRes = await fetch(`https://rdap.org/domain/${target.domain}`, { signal: AbortSignal.timeout(5000) });
      if (rdapRes.ok) {
        const rdapData = await rdapRes.json();
        const isPrivacyProtected = JSON.stringify(rdapData).toLowerCase().includes("privacy") || JSON.stringify(rdapData).toLowerCase().includes("redacted");
        
        findings.push({
          id: "cloud-rdap",
          category: "CLOUD_HOSTING",
          title: isPrivacyProtected ? "Domain Privacy Enabled" : "Domain Registration Exposed",
          description: isPrivacyProtected ? "WHOIS/RDAP information appears to be privacy protected." : "Domain registration details are publicly exposed via RDAP.",
          riskLevel: isPrivacyProtected ? "PASS" : "INFO",
          evidence: `RDAP lookup for ${target.domain} successful`,
          impact: "Exposed WHOIS data can be used for targeted social engineering or spear-phishing against the domain owners.",
          remediation: isPrivacyProtected ? "No action required." : "Enable WHOIS privacy protection through your domain registrar.",
          effort: "LOW",
        });
      }
    } catch { /* ignore */ }

    // IP Resolution
    let ip: string | null = null;
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${target.domain}&type=A`, { signal: AbortSignal.timeout(5000) });
      if (dnsRes.ok) {
        const dnsData = await dnsRes.json();
        ip = dnsData.Answer?.[0]?.data || null;
      }
    } catch { /* ignore */ }

    if (ip) {
      // IPInfo Check
      if (process.env.IPINFO_API_KEY) {
        try {
          const ipinfoRes = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY}`, { signal: AbortSignal.timeout(5000) });
          if (ipinfoRes.ok) {
            const ipinfoData = await ipinfoRes.json();
            findings.push({
              id: "cloud-ipinfo",
              category: "CLOUD_HOSTING",
              title: `Hosting Provider: ${ipinfoData.org || "Unknown ASN"}`,
              description: `IP Geolocation indicates server is hosted in ${ipinfoData.city || "Unknown"}, ${ipinfoData.country || "Unknown"}.`,
              riskLevel: "INFO",
              evidence: `IP: ${ipinfoData.ip}\nASN/Org: ${ipinfoData.org}\nLocation: ${ipinfoData.city}, ${ipinfoData.country}`,
              impact: "Understanding where data is hosted is critical for GDPR/CCPA data sovereignty compliance.",
              remediation: "Ensure the hosting region complies with your organization's legal data requirements.",
              effort: "LOW",
            });
          }
        } catch { /* ignore */ }
      }

      // AbuseIPDB Check
      if (process.env.ABUSEIPDB_API_KEY) {
        try {
          const abuseRes = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
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
              score -= Math.min(20, Math.floor(scoreAbuse / 5));
              findings.push({
                id: "cloud-abuseipdb",
                category: "CLOUD_HOSTING",
                title: `Server IP Flagged for Abuse (Score: ${scoreAbuse})`,
                description: "The underlying IP address has a history of abusive behavior (e.g. spam, hacking attempts).",
                riskLevel: scoreAbuse > 50 ? "HIGH" : "MEDIUM",
                cvss: scoreAbuse > 50 ? 7.1 : 4.0,
                evidence: `AbuseIPDB Confidence Score: ${scoreAbuse}/100`,
                impact: "Emails originating from this IP may be marked as spam, and some strict firewalls might block it. Common if using shared hosting.",
                remediation: "If using shared hosting, consider moving to a dedicated IP. If dedicated, investigate the server for malware.",
                effort: "MEDIUM",
              });
            }
          }
        } catch { /* ignore */ }
      }
    }

    // Check for HTTPS redirect
    if (target.protocol === "https:") {
      try {
        const httpRes = await fetch(`http://${target.domain}`, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(6000),
        });
        if (httpRes.status === 301 || httpRes.status === 302) {
          const location = httpRes.headers.get("location") || "";
          if (location.startsWith("https://")) {
            findings.push({
              id: "cloud-redirect",
              category: "CLOUD_HOSTING",
              title: "HTTP to HTTPS Redirect Configured",
              description: "HTTP traffic is properly redirected to HTTPS.",
              riskLevel: "PASS",
              evidence: `HTTP returns ${httpRes.status} redirect to ${location}`,
              impact: "No impact.",
              remediation: "No action required.",
              effort: "LOW",
            });
          }
        } else if (httpRes.status === 200) {
          score -= 10;
          findings.push({
            id: "cloud-no-redirect",
            category: "CLOUD_HOSTING",
            title: "HTTP Not Redirected to HTTPS",
            description: "HTTP version of the site does not redirect to HTTPS.",
            riskLevel: "HIGH",
            evidence: `HTTP ${target.domain} returns status ${httpRes.status}`,
            impact: "Users accessing via HTTP have unencrypted connections.",
            remediation: "Configure 301 redirect from all HTTP URLs to HTTPS equivalents.",
            effort: "LOW",
          });
        }
      } catch { /* redirect check failed */ }
    }

  } catch {
    score = 60;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "CLOUD_HOSTING",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
