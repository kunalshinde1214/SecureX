import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scanStore } from "@/lib/scan-store";
import { prisma } from "@/lib/db";
import { extractDomain, scoreToGrade } from "@/lib/utils";

const ScanRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  depth: z.enum(["QUICK", "STANDARD", "DEEP"]).default("STANDARD"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ScanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { url, depth } = parsed.data;
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Initialize scan in store
    scanStore.set(scanId, { status: "PENDING", events: [] });

    // Start scan asynchronously (fire and forget)
    startScanAsync(scanId, url, depth);

    // Save initial PENDING state to DB
    try {
      await prisma.scan.create({
        data: {
          id: scanId,
          url,
          domain: extractDomain(url),
          score: 0,
          grade: "F",
          status: "PENDING",
        },
      });
    } catch (dbErr) {
      console.error("Failed to create scan record in DB", dbErr);
    }

    return NextResponse.json({
      scanId,
      status: "PENDING",
      estimatedTime: depth === "QUICK" ? 30 : depth === "STANDARD" ? 60 : 120,
      checksCount: 15,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start scan: " + String(error) },
      { status: 500 }
    );
  }
}

async function startScanAsync(scanId: string, url: string, depth: string) {
  try {
    const store = scanStore.get(scanId);
    if (!store) return;

    store.status = "RUNNING";

    // Dynamically import to avoid edge runtime issues
    const { runAudit } = await import("@/lib/audit-engine");

    const report = await runAudit(
      url,
      { depth: depth as "QUICK" | "STANDARD" | "DEEP" },
      (event) => {
        const storeEntry = scanStore.get(scanId);
        if (storeEntry) {
          storeEntry.events.push({
            ...event,
            timestamp: Date.now(),
          });
        }
      }
    );

    const storeEntry = scanStore.get(scanId);
    if (storeEntry) {
      storeEntry.status = "COMPLETE";
      storeEntry.report = report;
    }

    try {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "COMPLETE",
          score: report.score?.numeric || 0,
          grade: report.score?.grade || "F",
          report: JSON.stringify(report),
        },
      });
    } catch (dbErr) {
      console.error("Failed to update scan record in DB", dbErr);
    }
  } catch (error) {
    const storeEntry = scanStore.get(scanId);
    if (storeEntry) {
      storeEntry.status = "FAILED";
      storeEntry.events.push({
        type: "scan_failed",
        error: String(error),
        timestamp: Date.now(),
      });
    }

    try {
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "FAILED" },
      });
    } catch (dbErr) {
      // Ignore
    }
  }
}
