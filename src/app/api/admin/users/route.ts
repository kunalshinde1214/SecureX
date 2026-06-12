import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const format = searchParams.get("format") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.email = { contains: search };
    }

    let users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    // Populate mock users if empty for the dashboard experience
    if (users.length === 0 && !search) {
      await prisma.user.createMany({
        data: [
          { email: "admin@webauditpro.com", role: "ADMIN" },
          { email: "john.doe@company.io", role: "USER" },
          { email: "jane.smith@freelance.org", role: "USER" },
          { email: "abusive.scanner@spam.net", role: "USER" },
        ]
      });
      users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    }

    // CSV export
    if (format === "csv") {
      const rows = [
        ["ID", "Email", "Role", "Created"].join(","),
        ...users.map((u) =>
          [u.id, `"${u.email}"`, u.role, new Date(u.createdAt).toLocaleDateString()].join(",")
        ),
      ].join("\n");

      return new NextResponse(rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="users-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        role: role || "USER",
      }
    });

    await prisma.adminActionLog.create({
      data: { action: "INVITE_USER", detail: `Invited user ${email} as ${role || "FREE"}` }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
      }
    });

    await prisma.adminActionLog.create({
      data: { action: "UPDATE_USER", detail: `Updated user ${id}: role=${role}` }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const user = await prisma.user.delete({ where: { id } });

    await prisma.adminActionLog.create({
      data: { action: "DELETE_USER", detail: `Deleted user ${user.email}` }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
