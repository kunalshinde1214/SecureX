import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runPerformanceCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 100;

  try {
    const encodedUrl = encodeURIComponent(target.url);
    // Google PageSpeed Insights API (Free tier, no key required for basic usage)
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&strategy=desktop`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`PageSpeed API returned ${res.status}`);
    }

    const data = await res.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse || !lighthouse.categories || !lighthouse.categories.performance) {
      throw new Error("Invalid PageSpeed response structure");
    }

    const perfScore = lighthouse.categories.performance.score * 100;
    score = Math.round(perfScore);

    const audits = lighthouse.audits;

    // First Contentful Paint
    const fcp = audits["first-contentful-paint"]?.displayValue;
    if (fcp) {
      const fcpVal = parseFloat(fcp);
      if (fcpVal > 2.5) {
        findings.push({
          id: "perf-fcp-slow",
          category: "PERFORMANCE_TESTING",
          title: "Slow First Contentful Paint (FCP)",
          description: `FCP is ${fcp}, which is slower than the recommended 1.8s. This delays the user's perception of load speed.`,
          impact: "FCP directly impacts how quickly users see the first visual element.",
          riskLevel: "MEDIUM",
          remediation: "Optimize render-blocking resources, TTFB, and minimize server response times.",
          evidence: `FCP: ${fcp}`,
          effort: "MEDIUM"
        });
      } else {
        findings.push({
          id: "perf-fcp-fast",
          category: "PERFORMANCE_TESTING",
          title: "Fast First Contentful Paint (FCP)",
          description: `FCP is ${fcp}, indicating excellent initial load performance.`,
          impact: "Fast FCP keeps users engaged.",
          riskLevel: "PASS",
          remediation: "N/A",
          evidence: `FCP: ${fcp}`,
          effort: "LOW"
        });
      }
    }

    // Largest Contentful Paint
    const lcp = audits["largest-contentful-paint"]?.displayValue;
    if (lcp) {
      const lcpVal = parseFloat(lcp);
      if (lcpVal > 2.5) {
        findings.push({
          id: "perf-lcp-slow",
          category: "PERFORMANCE_TESTING",
          title: "Slow Largest Contentful Paint (LCP)",
          description: `LCP is ${lcp}, exceeding the 2.5s threshold for good user experience.`,
          impact: "High LCP causes users to abandon the site due to slow perceived loading.",
          riskLevel: "MEDIUM",
          remediation: "Optimize critical rendering path, compress images, and use a CDN.",
          evidence: `LCP: ${lcp}`,
          effort: "MEDIUM"
        });
      }
    }

    // Cumulative Layout Shift
    const cls = audits["cumulative-layout-shift"]?.displayValue;
    if (cls) {
      const clsVal = parseFloat(cls);
      if (clsVal > 0.1) {
        findings.push({
          id: "perf-cls-high",
          category: "PERFORMANCE_TESTING",
          title: "High Cumulative Layout Shift (CLS)",
          description: `CLS is ${cls}, indicating unexpected layout shifts that frustrate users.`,
          impact: "Layout shifts can cause accidental clicks and poor UX.",
          riskLevel: "LOW",
          remediation: "Include width and height attributes on images and video elements.",
          evidence: `CLS: ${cls}`,
          effort: "LOW"
        });
      }
    }

    // Total Blocking Time
    const tbt = audits["total-blocking-time"]?.displayValue;
    if (tbt) {
      const tbtVal = parseFloat(tbt);
      if (tbtVal > 300) {
        findings.push({
          id: "perf-tbt-high",
          category: "PERFORMANCE_TESTING",
          title: "High Total Blocking Time (TBT)",
          description: `TBT is ${tbt}, meaning the main thread is blocked for too long, delaying interactivity.`,
          impact: "Long blocking times make the page unresponsive to user inputs.",
          riskLevel: "MEDIUM",
          remediation: "Reduce JavaScript execution time and minimize main-thread work.",
          evidence: `TBT: ${tbt}`,
          effort: "HIGH"
        });
      }
    }

  } catch (error) {
    console.error("Performance Check Error:", error);
    findings.push({
      id: "perf-timeout",
      category: "PERFORMANCE_TESTING",
      title: "Performance API Timeout",
      description: "Could not complete the Google PageSpeed Insights check within the time limit.",
      impact: "Unable to verify page performance.",
      riskLevel: "INFO",
      remediation: "Ensure the target URL is publicly accessible and responsive.",
      evidence: "API timeout/failure",
      effort: "LOW"
    });
    score = 80; // Default fallback score if the API times out
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
