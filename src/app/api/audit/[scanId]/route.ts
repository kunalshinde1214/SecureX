import { NextRequest, NextResponse } from "next/server";
import { scanStore } from "@/lib/scan-store";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const scan = scanStore.get(scanId);

  if (!scan) {
    // Check DB
    const dbScan = await prisma.scan.findUnique({ where: { id: scanId } });
    if (!dbScan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json({
      scanId,
      status: dbScan.status,
      report: dbScan.report ? JSON.parse(dbScan.report) : null,
    });
  }

  return NextResponse.json({
    scanId,
    status: scan.status,
    report: scan.report || null,
  });
}
