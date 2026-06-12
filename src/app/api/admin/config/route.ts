import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all config keys
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(configMap);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST updates config keys
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Save all keys in transaction
    const operations = Object.entries(body).map(([key, value]) => 
      prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
