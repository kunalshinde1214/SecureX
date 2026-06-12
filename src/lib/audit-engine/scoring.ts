import { AuditCategory, CheckResult, RiskLevel, ScanScore } from "@/types/audit";
import { CATEGORY_WEIGHTS } from "@/types/audit";
import { scoreToGrade } from "@/lib/utils";

export function calculateScore(results: CheckResult[]): ScanScore {
  const breakdown = results.map((r) => {
    const weight = CATEGORY_WEIGHTS[r.category] || 0;
    const contribution = Math.round(r.score * weight);
    return {
      category: r.category,
      score: r.score,
      contribution,
      weight,
    };
  });

  const weightedSum = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  const numeric = Math.round(Math.min(100, Math.max(0, weightedSum)));

  const hasCritical = results.some((r) =>
    r.findings.some((f) => f.riskLevel === "CRITICAL")
  );

  const grade = scoreToGrade(numeric);
  let riskLevel: RiskLevel = scoreToRiskLevel(numeric);

  if (hasCritical) riskLevel = "CRITICAL";

  return {
    numeric,
    grade,
    riskLevel,
    breakdown,
  };
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "HIGH";
  return "CRITICAL";
}

export function buildExecutiveSummary(
  score: ScanScore,
  results: CheckResult[],
  targetUrl: string
): string {
  const criticalFindings = results.flatMap((r) =>
    r.findings.filter((f) => f.riskLevel === "CRITICAL")
  );
  const highFindings = results.flatMap((r) =>
    r.findings.filter((f) => f.riskLevel === "HIGH")
  );

  const grade = score.grade;
  const numeric = score.numeric;

  if (criticalFindings.length > 0) {
    return `Security audit for ${targetUrl} reveals CRITICAL risk with a score of ${numeric}/100 (Grade: ${grade}). ` +
      `${criticalFindings.length} critical and ${highFindings.length} high severity issues were identified that require immediate attention. ` +
      `Critical issues include: ${criticalFindings.slice(0, 3).map((f) => f.title).join(", ")}. ` +
      `Immediate remediation is strongly recommended before this site is exposed to production traffic.`;
  }

  if (highFindings.length > 5) {
    return `Security audit for ${targetUrl} reveals HIGH risk with a score of ${numeric}/100 (Grade: ${grade}). ` +
      `${highFindings.length} high severity issues were identified requiring prompt attention. ` +
      `Key issues: ${highFindings.slice(0, 3).map((f) => f.title).join(", ")}. ` +
      `Remediation of all high-severity findings is recommended within the next 30 days.`;
  }

  if (numeric >= 80) {
    return `Security audit for ${targetUrl} shows a healthy security posture with a score of ${numeric}/100 (Grade: ${grade}). ` +
      `The site demonstrates good security practices across most audit domains. ` +
      `${highFindings.length > 0 ? `${highFindings.length} high-severity issue(s) were identified for improvement.` : "No critical or high severity issues were found."} ` +
      `Continue monitoring and applying security patches to maintain this standard.`;
  }

  return `Security audit for ${targetUrl} reveals a MEDIUM risk posture with a score of ${numeric}/100 (Grade: ${grade}). ` +
    `Several security improvements are recommended across ${results.filter(r => r.score < 80).length} audit categories. ` +
    `Focus on addressing high-severity findings first, particularly around ` +
    `${results.sort((a, b) => a.score - b.score).slice(0, 2).map(r => r.category.replace(/_/g, " ")).join(" and ")}. ` +
    `A structured remediation plan will significantly improve the security posture.`;
}
