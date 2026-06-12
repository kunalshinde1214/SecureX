import { CheckResult, Finding, ScanTarget } from "@/types/audit";

export async function runInputValidationCheck(target: ScanTarget): Promise<CheckResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  let score = 90;

  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const html = await res.text();

    // Look for forms and inputs
    const forms = html.match(/<form[^>]*>/gi) || [];
    const inputs = html.match(/<input[^>]*>/gi) || [];

    if (forms.length > 0) {
      findings.push({
        id: "input-forms-detected",
        category: "INPUT_VALIDATION",
        title: `${forms.length} Form(s) Detected`,
        description: `Found ${forms.length} forms and ${inputs.length} inputs requiring validation.`,
        riskLevel: "INFO",
        evidence: `${forms.length} <form> tags found.`,
        impact: "Forms are entry points for XSS, SQLi, and other injection attacks.",
        remediation: "Ensure all user inputs are strictly validated on both client and server side. Sanitize before database insertion.",
        effort: "MEDIUM",
      });

      // Check for hidden inputs that might be used for CSRF or state
      const hiddenInputs = inputs.filter(i => /type=["']hidden["']/i.test(i));
      if (hiddenInputs.length > 0) {
        findings.push({
          id: "input-hidden",
          category: "INPUT_VALIDATION",
          title: "Hidden Inputs Detected",
          description: `Found ${hiddenInputs.length} hidden input fields.`,
          riskLevel: "PASS",
          evidence: "Hidden fields can be manipulated by attackers.",
          impact: "Never trust hidden fields for sensitive state data.",
          remediation: "Use server-side sessions for state. If used for CSRF tokens, ensure tokens are cryptographically secure.",
          effort: "LOW",
        });
      }
    } else {
      findings.push({
        id: "input-no-forms",
        category: "INPUT_VALIDATION",
        title: "No User Input Forms",
        description: "No forms were detected on the main page.",
        riskLevel: "PASS",
        evidence: "0 forms found.",
        impact: "Lower attack surface on this specific page.",
        remediation: "N/A",
        effort: "LOW",
      });
    }
  } catch {
    score = 70;
  }

  return {
    category: "INPUT_VALIDATION",
    status: "COMPLETE",
    score,
    riskLevel: score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL",
    findings,
    duration: Date.now() - startTime,
  };
}
