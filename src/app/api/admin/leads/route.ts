import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const format = searchParams.get("format") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { website: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    // CSV export
    if (format === "csv") {
      const rows = [
        ["ID", "Email", "Website", "Score", "Status", "Priority", "Notes", "Created"].join(","),
        ...leads.map((l) =>
          [
            l.id,
            `"${l.email}"`,
            `"${l.website}"`,
            l.score ?? "",
            l.status,
            l.priority,
            `"${(l.notes || "").replace(/"/g, "'")}"`,
            new Date(l.createdAt).toLocaleDateString(),
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, website, score } = body;

    if (!email || !website) {
      return NextResponse.json({ error: "Missing email or website" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        email,
        website,
        score: score ? Number(score) : null,
        status: "NEW",
        priority: "NORMAL",
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(priority && { priority }),
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
