import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Liveness only: do not reveal secret/configuration presence as a public probe.
  return NextResponse.json({
    status: "ok",
    service: "ai-development-command-center",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
