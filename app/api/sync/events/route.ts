export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
      };

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // The controller is already closed (client disconnected). Stop the
          // heartbeat so we don't keep enqueuing — an unguarded enqueue here
          // throws ERR_INVALID_STATE and crashes the whole server process.
          cleanup();
        }
      };

      send({ type: "connected", timestamp: Date.now() });

      heartbeat = setInterval(() => {
        send({ type: "heartbeat", timestamp: Date.now() });
      }, 15_000);

      // Fires when the client closes the tab / navigates away. Previously the
      // interval was never cleared on disconnect (start()'s return value is not
      // a teardown hook), so it leaked and eventually crashed.
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    // Called by the runtime when the stream is cancelled (consumer went away).
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
