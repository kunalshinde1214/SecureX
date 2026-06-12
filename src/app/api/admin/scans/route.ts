import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET all scans with optional search/filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const grade = searchParams.get("grade") || "";
    const format = searchParams.get("format");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.domain = { contains: search };
    }
    if (grade) {
      where.grade = grade;
    }

    if (format === "csv") {
      const allScans = await prisma.scan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          domain: true,
          url: true,
          score: true,
          grade: true,
          status: true,
          createdAt: true,
        },
      });

      const csvRows = [
        ["ID", "Domain", "URL", "Score", "Grade", "Status", "Date"]
      ];
      
      allScans.forEach(scan => {
        csvRows.push([
          scan.id,
          scan.domain,
          scan.url,
          scan.score.toString(),
          scan.grade,
          scan.status,
          scan.createdAt.toISOString()
        ]);
      });

      const csvString = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="scans_export.csv"`,
        },
      });
    }

    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          domain: true,
          score: true,
          grade: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.scan.count({ where }),
    ]);

    return NextResponse.json({ scans, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE a scan by id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.scan.delete({ where: { id } });

    // Log action
    await (prisma as any).adminActionLog.create({
      data: { action: "DELETE_SCAN", detail: `Deleted scan ${id}` },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
