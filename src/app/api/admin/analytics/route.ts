import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [totalScans, leads, users, schedules] = await Promise.all([
      prisma.scan.count(),
      prisma.lead.count(),
      prisma.user.count(),
      prisma.scheduledAudit.count({ where: { active: true } }),
    ]);

    // Scans from last 7 days grouped by day
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentScans = await prisma.scan.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, score: true, grade: true, report: true },
      orderBy: { createdAt: "asc" },
    });

    // Avg score
    const avgScoreResult = await prisma.scan.aggregate({
      _avg: { score: true },
    });

    // Score distribution
    const gradeDistribution = await prisma.scan.groupBy({
      by: ["grade"],
      _count: { grade: true },
    });

    // Generate scanTrendData (7 days)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendMap: Record<string, { scans: number; threats: number }> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap[days[d.getDay()]] = { scans: 0, threats: 0 };
    }

    // Generate barData (Threat Vector Distribution)
    const categoryCounts: Record<string, number> = {
      "SSL/TLS": 0,
      "Headers": 0,
      "OWASP": 0,
      "Server/Tech": 0,
      "Database": 0,
      "API/Ports": 0,
    };

    let totalThreatsFound = 0;

    recentScans.forEach((scan) => {
      const dayName = days[scan.createdAt.getDay()];
      if (trendMap[dayName]) {
        trendMap[dayName].scans += 1;
      }
      
      if (scan.report) {
        try {
          const reportObj = JSON.parse(scan.report);
          let scanThreats = 0;
          if (reportObj.checkResults) {
            reportObj.checkResults.forEach((cr: any) => {
              if (cr.findings) {
                const threatFindings = cr.findings.filter((f: any) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH" || f.riskLevel === "MEDIUM");
                scanThreats += threatFindings.length;

                // Map categories for barData
                if (cr.category === "SSL_TLS") categoryCounts["SSL/TLS"] += threatFindings.length;
                else if (cr.category === "SECURITY_HEADERS") categoryCounts["Headers"] += threatFindings.length;
                else if (cr.category === "OWASP_TOP10") categoryCounts["OWASP"] += threatFindings.length;
                else if (cr.category === "SERVER_SECURITY") categoryCounts["Server/Tech"] += threatFindings.length;
                else if (cr.category === "DATABASE_SECURITY") categoryCounts["Database"] += threatFindings.length;
                else if (cr.category === "API_SECURITY") categoryCounts["API/Ports"] += threatFindings.length;
              }
            });
          }
          if (trendMap[dayName]) {
            trendMap[dayName].threats += scanThreats;
          }
          totalThreatsFound += scanThreats;
        } catch (e) {
          // ignore parse error
        }
      }
    });

    const scanTrendData = Object.keys(trendMap).map(k => ({
      name: k,
      scans: trendMap[k].scans,
      threats: trendMap[k].threats,
    }));

    const barData = Object.keys(categoryCounts).map(k => ({
      name: k,
      count: categoryCounts[k]
    })).filter(b => b.count > 0);

    // Provide default fallback if no threats found to avoid empty chart
    if (barData.length === 0) {
      barData.push({ name: "Safe", count: 1 });
    }

    return NextResponse.json({
      totalScans,
      totalLeads: leads,
      totalUsers: users,
      activeSchedules: schedules,
      avgScore: Math.round(avgScoreResult._avg.score || 0),
      recentScans,
      gradeDistribution,
      scanTrendData,
      barData,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
