import { AuditCategory, CheckResult, ScanOptions, ScanReport, ScanTarget } from "@/types/audit";
import { runSSLCheck } from "./checks/ssl-check";
import { runHeadersCheck } from "./checks/headers-check";
import { runOWASPCheck } from "./checks/owasp-check";
import { runAuthCheck } from "./checks/dns-check"; // previously runDNSCheck
import { runInputValidationCheck } from "./checks/content-check"; // previously runContentCheck
import { runServerSecurityCheck } from "./checks/tech-check"; // previously runTechCheck
import { runDatabaseSecurityCheck } from "./checks/reputation-check"; // previously runReputationCheck
import { runAPICheck } from "./checks/api-port-check";
import { runPerformanceCheck } from "./checks/performance-check";
import {
  runComplianceCheck,
  runFileUploadCheck,
  runLoggingCheck,
  runBackupCheck,
  runThirdPartyCheck,
  runCloudCheck,
} from "./checks/remaining-checks";
import { calculateScore, buildExecutiveSummary } from "./scoring";
import { generateScanId } from "@/lib/utils";

export type ProgressCallback = (event: {
  type: "check_start" | "check_complete" | "check_error" | "scan_complete";
  category?: AuditCategory;
  result?: CheckResult;
  error?: string;
  progress?: number;
}) => void;

export async function runAudit(
  inputUrl: string,
  options: ScanOptions = { depth: "STANDARD" },
  onProgress?: ProgressCallback
): Promise<ScanReport> {
  // Normalize URL
  const normalizedUrl = inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`;
  const parsedUrl = new URL(normalizedUrl);

  const target: ScanTarget = {
    url: normalizedUrl,
    domain: parsedUrl.hostname,
    protocol: parsedUrl.protocol,
  };

  const scanId = generateScanId();
  const startedAt = new Date();

  // Resolve IP
  try {
    const dnsRes = await fetch(
      `https://dns.google/resolve?name=${target.domain}&type=A`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (dnsRes.ok) {
      const dnsData = await dnsRes.json();
      target.ip = dnsData.Answer?.[0]?.data;
    }
  } catch { /* skip */ }

  const checkResults: CheckResult[] = [];

  // Define all checks with their categories
  const allChecks: Array<{
    category: AuditCategory;
    runner: (target: ScanTarget) => Promise<CheckResult>;
  }> = [
    { category: "AUTH_ACCESS", runner: runAuthCheck },
    { category: "SSL_TLS", runner: runSSLCheck },
    { category: "OWASP_TOP10", runner: runOWASPCheck },
    { category: "SERVER_SECURITY", runner: runServerSecurityCheck },
    { category: "DATABASE_SECURITY", runner: runDatabaseSecurityCheck },
    { category: "API_SECURITY", runner: runAPICheck },
    { category: "INPUT_VALIDATION", runner: runInputValidationCheck },
    { category: "SECURITY_HEADERS", runner: runHeadersCheck },
    { category: "FILE_UPLOAD", runner: runFileUploadCheck },
    { category: "LOGGING_MONITORING", runner: runLoggingCheck },
    { category: "BACKUP_RECOVERY", runner: runBackupCheck },
    { category: "THIRD_PARTY", runner: runThirdPartyCheck },
    { category: "CLOUD_HOSTING", runner: runCloudCheck },
    { category: "PERFORMANCE_TESTING", runner: runPerformanceCheck },
    { category: "COMPLIANCE", runner: runComplianceCheck },
  ];

  // Filter checks based on options
  const checksToRun = options.checks
    ? allChecks.filter((c) => options.checks!.includes(c.category))
    : allChecks;

  let completed = 0;

  // Run checks concurrently with progress updates
  await Promise.allSettled(
    checksToRun.map(async ({ category, runner }) => {
      onProgress?.({ type: "check_start", category, progress: (completed / checksToRun.length) * 100 });

      try {
        const result = await runner(target);
        checkResults.push(result);
        completed++;
        onProgress?.({
          type: "check_complete",
          category,
          result,
          progress: (completed / checksToRun.length) * 100,
        });
      } catch (error) {
        completed++;
        const failedResult: CheckResult = {
          category,
          status: "FAILED",
          score: 50,
          riskLevel: "MEDIUM",
          findings: [],
          errorMsg: String(error),
        };
        checkResults.push(failedResult);
        onProgress?.({
          type: "check_error",
          category,
          error: String(error),
          progress: (completed / checksToRun.length) * 100,
        });
      }
    })
  );

  // Calculate final score
  const score = calculateScore(checkResults);
  const completedAt = new Date();
  const duration = completedAt.getTime() - startedAt.getTime();

  const report: ScanReport = {
    scanId,
    target,
    options,
    status: "COMPLETE",
    startedAt,
    completedAt,
    duration,
    score,
    checkResults,
    metadata: {
      technologies: [],
    },
  };

  onProgress?.({ type: "scan_complete" });

  return report;
}
