import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AuditReport } from "@/components/AuditReport";
import { ScanReport } from "@/types/audit";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit Report | WebAudit Pro",
  description: "View the results of your security audit.",
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  
  // Fetch from database
  const dbScan = await prisma.scan.findUnique({ where: { id: scanId } });

  if (!dbScan || dbScan.status !== "COMPLETE" || !dbScan.report) {
    return (
      <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center", padding: "40px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", margin: "0 auto 24px" }}>
          <AlertTriangle size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: "var(--text-primary)" }}>
          Report Not Found
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
          The scan report you are looking for does not exist, has expired, or is still running.
        </p>
        <Link href="/" className="btn-primary" style={{ textDecoration: "none" }}>
          <Home size={16} />
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 24px" }}>
      <AuditReport report={JSON.parse(dbScan.report)} />
    </div>
  );
}
