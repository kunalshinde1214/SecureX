import { Metadata } from "next";
import { Clock, ShieldAlert, CheckCircle, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Recent Scans | WebAudit Pro",
  description: "View recently completed security audits by the community.",
};

import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function ScansPage() {
  const recentScans = await prisma.scan.findMany({
    where: { status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      domain: true,
      score: true,
      grade: true,
      createdAt: true,
      report: true,
    }
  });

  const parsedScans = recentScans.map((scan) => {
    let issues = 0;
    if (scan.report) {
      try {
        const reportObj = JSON.parse(scan.report);
        issues = reportObj.checkResults?.reduce((acc: number, curr: any) => acc + (curr.findings?.length || 0), 0) || 0;
      } catch (e) {}
    }
    return {
      ...scan,
      issues,
      time: formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true }),
    };
  });
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
            Recent Scans
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Live feed of public security audits.
          </p>
        </div>
        
        {/* Search Mockup */}
        <div style={{ position: "relative", width: 240 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search domains..." 
            className="input-field"
            style={{ paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, fontSize: 13 }}
            disabled
          />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Target Domain</th>
              <th>Score</th>
              <th>Issues</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {parsedScans.map((scan) => (
              <tr key={scan.id}>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{scan.domain}</div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ 
                      fontWeight: 800, 
                      color: scan.score >= 90 ? "#34d399" : scan.score >= 70 ? "#fbbf24" : "#f87171" 
                    }}>
                      {scan.score}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                      ({scan.grade})
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                    {scan.issues === 0 ? (
                      <><CheckCircle size={14} style={{ color: "#34d399" }} /> Perfect</>
                    ) : (
                      <><ShieldAlert size={14} style={{ color: "#fb923c" }} /> {scan.issues} findings</>
                    )}
                  </div>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} /> {scan.time}
                  </div>
                </td>
                <td>
                  <Link href={`/report/${scan.id}`} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>
                    View Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {parsedScans.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 40, fontSize: 14, color: "var(--text-muted)" }}>
          No scans completed yet. Be the first to audit a domain!
        </div>
      )}
    </div>
  );
}
