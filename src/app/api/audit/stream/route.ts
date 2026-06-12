import { NextRequest } from "next/server";
import { scanStore } from "@/lib/scan-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");

  if (!scanId) {
    return new Response("Missing scanId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastEventIndex = 0;
      let attempts = 0;
      const maxAttempts = 180; // 3 minutes timeout

      const sendEvent = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      const poll = async () => {
        while (attempts < maxAttempts) {
          const scan = scanStore.get(scanId);

          if (!scan) {
            sendEvent({ event: "error", message: "Scan not found" });
            controller.close();
            return;
          }

          // Send any new events
          const newEvents = scan.events.slice(lastEventIndex);
          for (const event of newEvents) {
            sendEvent(event);
          }
          lastEventIndex = scan.events.length;

          if (scan.status === "COMPLETE") {
            sendEvent({
              event: "scan_complete",
              scanId,
              report: scan.report,
              timestamp: Date.now(),
            });
            controller.close();
            return;
          }

          if (scan.status === "FAILED") {
            sendEvent({ event: "scan_failed", timestamp: Date.now() });
            controller.close();
            return;
          }

          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        sendEvent({ event: "timeout", message: "Scan timed out" });
        controller.close();
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
