export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | "PASS";
export type ScanDepth = "QUICK" | "STANDARD" | "DEEP";
export type ScanStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED" | "CANCELLED";
export type CheckStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED" | "SKIPPED";

export type AuditCategory =
  | "AUTH_ACCESS"
  | "SSL_TLS"
  | "OWASP_TOP10"
  | "SERVER_SECURITY"
  | "DATABASE_SECURITY"
  | "API_SECURITY"
  | "INPUT_VALIDATION"
  | "SECURITY_HEADERS"
  | "FILE_UPLOAD"
  | "LOGGING_MONITORING"
  | "BACKUP_RECOVERY"
  | "THIRD_PARTY"
  | "CLOUD_HOSTING"
  | "PERFORMANCE_TESTING"
  | "COMPLIANCE"
  | "THREAT_INTELLIGENCE"
  | "OSINT_RECON";

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  AUTH_ACCESS: "Authentication & Access Control",
  SSL_TLS: "SSL/TLS Security",
  OWASP_TOP10: "OWASP Top 10 Vulnerabilities",
  SERVER_SECURITY: "Server Security",
  DATABASE_SECURITY: "Database Security",
  API_SECURITY: "API Security",
  INPUT_VALIDATION: "Input Validation",
  SECURITY_HEADERS: "Security Headers",
  FILE_UPLOAD: "File Upload Security",
  LOGGING_MONITORING: "Logging & Monitoring",
  BACKUP_RECOVERY: "Backup & Recovery",
  THIRD_PARTY: "Third-Party Components",
  CLOUD_HOSTING: "Cloud & Hosting Security",
  PERFORMANCE_TESTING: "Performance & Security Testing",
  COMPLIANCE: "Compliance Checks",
  THREAT_INTELLIGENCE: "Threat Intelligence & Reputation",
  OSINT_RECON: "OSINT & Reconnaissance",
};

export const CATEGORY_WEIGHTS: Record<AuditCategory, number> = {
  AUTH_ACCESS: 0.08,
  SSL_TLS: 0.08,
  OWASP_TOP10: 0.10,
  SERVER_SECURITY: 0.07,
  DATABASE_SECURITY: 0.08,
  API_SECURITY: 0.08,
  INPUT_VALIDATION: 0.08,
  SECURITY_HEADERS: 0.08,
  FILE_UPLOAD: 0.05,
  LOGGING_MONITORING: 0.04,
  BACKUP_RECOVERY: 0.04,
  THIRD_PARTY: 0.04,
  CLOUD_HOSTING: 0.04,
  PERFORMANCE_TESTING: 0.02,
  COMPLIANCE: 0.02,
  THREAT_INTELLIGENCE: 0.05,
  OSINT_RECON: 0.05,
};

export interface Finding {
  id: string;
  category: AuditCategory;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  cvss?: number;
  cve?: string;
  cwe?: string;
  evidence: string;
  impact: string;
  remediation: string;
  effort: "LOW" | "MEDIUM" | "HIGH";
  references?: string[];
  affectedComponent?: string;
}

export interface CheckResult {
  category: AuditCategory;
  status: CheckStatus;
  score: number; // 0-100
  riskLevel: RiskLevel;
  findings: Finding[];
  rawData?: Record<string, unknown>;
  completedAt?: Date;
  errorMsg?: string;
  duration?: number;
}

export interface ScanTarget {
  url: string;
  domain: string;
  ip?: string;
  protocol: string;
}

export interface ScanOptions {
  depth: ScanDepth;
  checks?: AuditCategory[];
  followRedirects?: boolean;
  timeout?: number;
}

export interface ScanScore {
  numeric: number;
  grade: string;
  riskLevel: RiskLevel;
  breakdown: {
    category: AuditCategory;
    score: number;
    contribution: number;
    weight: number;
  }[];
}

export interface ScanReport {
  scanId: string;
  target: ScanTarget;
  options: ScanOptions;
  status: ScanStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  score?: ScanScore;
  checkResults: CheckResult[];
  metadata?: {
    serverSoftware?: string;
    technologies?: string[];
    asn?: string;
    organization?: string;
    country?: string;
    hosting?: string;
  };
}

export interface SSEEvent {
  event: "check_start" | "check_complete" | "check_error" | "scan_complete" | "scan_failed" | "progress";
  check?: AuditCategory;
  score?: number;
  riskLevel?: RiskLevel;
  findingsCount?: number;
  timestamp: number;
  scanId?: string;
  overallScore?: number;
  duration?: number;
  error?: string;
  message?: string;
  progress?: number;
}
