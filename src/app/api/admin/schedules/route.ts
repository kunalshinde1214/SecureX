import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const schedules = await prisma.scheduledAudit.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, frequency } = body;

    if (!url || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const domain = new URL(url).hostname;
    const nextRun = new Date();
    if (frequency === "DAILY") nextRun.setDate(nextRun.getDate() + 1);
    else if (frequency === "WEEKLY") nextRun.setDate(nextRun.getDate() + 7);
    else nextRun.setMonth(nextRun.getMonth() + 1);

    const schedule = await prisma.scheduledAudit.create({
      data: { url, domain, frequency, nextRun, active: true }
    });

    await prisma.adminActionLog.create({
      data: { action: "CREATE_SCHEDULE", detail: `Scheduled ${domain} (${frequency})` }
    });

    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH: toggle active/pause or update frequency
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, active, frequency } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const updated = await prisma.scheduledAudit.update({
      where: { id },
      data: {
        ...(typeof active === "boolean" && { active }),
        ...(frequency && { frequency }),
      }
    });

    await prisma.adminActionLog.create({
      data: {
        action: typeof active === "boolean" ? (active ? "RESUME_SCHEDULE" : "PAUSE_SCHEDULE") : "UPDATE_SCHEDULE",
        detail: `Schedule ${id} updated`
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.scheduledAudit.delete({ where: { id } });

    await prisma.adminActionLog.create({
      data: { action: "DELETE_SCHEDULE", detail: `Deleted schedule ${id}` }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
