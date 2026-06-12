import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runAPICheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    // Check HTTP methods via OPTIONS
    const optionsRes = await fetch(target.url, {
      method: "OPTIONS",
      signal: AbortSignal.timeout(8000),
    });

    const allowHeader = optionsRes.headers.get("allow") || optionsRes.headers.get("Access-Control-Allow-Methods") || "";

    // Check for dangerous methods
    if (allowHeader.includes("TRACE")) {
      score -= 15;
      findings.push({
        id: "api-trace",
        category: "API_SECURITY",
        title: "HTTP TRACE Method Enabled",
        description: "The server accepts TRACE requests, enabling Cross-Site Tracing (XST) attacks.",
        riskLevel: "MEDIUM",
        cvss: 5.8,
        cwe: "CWE-16",
        evidence: `Allow: ${allowHeader}`,
        impact: "TRACE method can be used with XSS to steal session cookies even with HttpOnly flag set.",
        remediation: "Disable TRACE method in web server config. For Apache: TraceEnable Off",
        effort: "LOW",
      });
    }

    if (allowHeader.includes("PUT") || allowHeader.includes("DELETE")) {
      score -= 10;
      findings.push({
        id: "api-write-methods",
        category: "API_SECURITY",
        title: "Dangerous HTTP Methods Allowed",
        description: `Server allows ${allowHeader.includes("PUT") ? "PUT" : ""}${allowHeader.includes("PUT") && allowHeader.includes("DELETE") ? " and " : ""}${allowHeader.includes("DELETE") ? "DELETE" : ""} methods.`,
        riskLevel: "MEDIUM",
        cwe: "CWE-749",
        evidence: `Allow: ${allowHeader}`,
        impact: "PUT and DELETE methods can allow attackers to modify or delete server content if not properly protected.",
        remediation: "Ensure PUT and DELETE are only accessible to authenticated and authorized users. Disable if not needed.",
        effort: "MEDIUM",
      });
    }

    // Check for rate limiting headers
    const headersRes = await fetch(target.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(6000),
    });
    const responseHeaders = Object.fromEntries(headersRes.headers.entries());

    const rateLimitHeaders = ["x-ratelimit-limit", "x-rate-limit-limit", "ratelimit-limit", "retry-after"];
    const hasRateLimit = rateLimitHeaders.some((h) => responseHeaders[h]);

    if (!hasRateLimit) {
      score -= 10;
      findings.push({
        id: "api-ratelimit",
        category: "API_SECURITY",
        title: "No Rate Limiting Detected",
        description: "No rate limiting headers found in server responses.",
        riskLevel: "MEDIUM",
        cwe: "CWE-770",
        evidence: "X-RateLimit headers not found",
        impact: "Without rate limiting, attackers can brute-force login forms, enumerate users, or DoS the application.",
        remediation: "Implement rate limiting on all API endpoints and login forms. Use middleware like express-rate-limit or Nginx limit_req.",
        effort: "MEDIUM",
      });
    } else {
      findings.push({
        id: "api-ratelimit-pass",
        category: "API_SECURITY",
        title: "Rate Limiting Detected",
        description: "Rate limiting headers are present in server responses.",
        riskLevel: "PASS",
        evidence: `Rate limit header found: ${rateLimitHeaders.find(h => responseHeaders[h])}`,
        impact: "No impact.",
        remediation: "No action required.",
        effort: "LOW",
      });
    }

    // Check CORS configuration
    const corsOrigin = responseHeaders["access-control-allow-origin"];
    const corsCredentials = responseHeaders["access-control-allow-credentials"];

    if (corsOrigin === "*" && corsCredentials === "true") {
      score -= 20;
      findings.push({
        id: "api-cors-critical",
        category: "API_SECURITY",
        title: "Critical CORS Misconfiguration",
        description: "Access-Control-Allow-Origin: * combined with Access-Control-Allow-Credentials: true is a critical misconfiguration.",
        riskLevel: "CRITICAL",
        cvss: 9.1,
        cwe: "CWE-942",
        evidence: `ACAO: ${corsOrigin}, ACAC: ${corsCredentials}`,
        impact: "Any malicious website can make authenticated API requests to your application on behalf of your users.",
        remediation: "Never use wildcard CORS with Allow-Credentials. Explicitly whitelist trusted origins.",
        effort: "LOW",
      });
    }

    // Detect API endpoints from page HTML
    try {
      const pageRes = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const apiPaths = html.match(/["'](\/api\/[^"'?\s]+)["']/g) || [];
        const uniqueApiPaths = [...new Set(apiPaths.map(p => p.replace(/["']/g, "")))];

        if (uniqueApiPaths.length > 0) {
          findings.push({
            id: "api-endpoints",
            category: "API_SECURITY",
            title: `${uniqueApiPaths.length} API Endpoints Detected in Source`,
            description: "API endpoint paths are visible in the JavaScript source code.",
            riskLevel: "INFO",
            evidence: `API paths found: ${uniqueApiPaths.slice(0, 5).join(", ")}`,
            impact: "Exposed API paths give attackers a map of your API surface to target.",
            remediation: "This is often unavoidable for frontend apps. Ensure all API endpoints are properly authenticated and authorized.",
            effort: "MEDIUM",
          });
        }
      }
    } catch { /* page fetch failed */ }

    score = Math.max(0, Math.min(100, score));

    return {
      category: "API_SECURITY",
      status: "COMPLETE",
      score,
      riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
      findings,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      category: "API_SECURITY",
      status: "FAILED",
      score: 50,
      riskLevel: "MEDIUM",
      findings,
      errorMsg: String(error),
      duration: Date.now() - startTime,
    };
  }
}

export async function runPerformanceCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    const fetchStart = Date.now();
    const res = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const responseTime = Date.now() - fetchStart;

    if (responseTime > 3000) {
      score -= 20;
      findings.push({
        id: "perf-slow",
        category: "PERFORMANCE_TESTING",
        title: "Slow Response Time",
        description: `The main page took ${responseTime}ms to respond.`,
        riskLevel: "MEDIUM",
        evidence: `Response time: ${responseTime}ms`,
        impact: "Slow response times degrade UX and can be indicative of unoptimized queries vulnerable to DoS attacks.",
        remediation: "Optimize database queries, use caching, and consider a CDN.",
        effort: "HIGH",
      });
    } else {
      findings.push({
        id: "perf-fast",
        category: "PERFORMANCE_TESTING",
        title: "Good Response Time",
        description: `The main page responded in ${responseTime}ms.`,
        riskLevel: "PASS",
        evidence: `Response time: ${responseTime}ms`,
        impact: "Fast performance improves availability and resilience against load.",
        remediation: "Continue monitoring performance metrics.",
        effort: "LOW",
      });
    }

  } catch {
    score = 60;
    findings.push({
      id: "perf-timeout",
      category: "PERFORMANCE_TESTING",
      title: "Request Timeout",
      description: "The server did not respond within the allocated timeframe.",
      riskLevel: "HIGH",
      evidence: "Connection timed out",
      impact: "Service may be down or under heavy load.",
      remediation: "Investigate server health and consider load balancing.",
      effort: "HIGH",
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    category: "PERFORMANCE_TESTING",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
