import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideApproval, type Decision } from "@/lib/approval-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ approvalId: string }> }) {
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  // SameSite session cookies plus Origin validation defend this browser mutation route from CSRF.
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  let payload: { decision?: Decision; reason?: string };
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 }); }
  if (typeof payload.reason !== "undefined" && typeof payload.reason !== "string") {
    return NextResponse.json({ error: "reason must be a string." }, { status: 400 });
  }
  const { approvalId } = await context.params;
  const result = await decideApproval({
    approvalId, actorId, decision: payload.decision as Decision, reason: payload.reason, requestId: crypto.randomUUID(),
  });
  return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
