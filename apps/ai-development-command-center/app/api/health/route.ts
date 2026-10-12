import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // This endpoint reports application configuration only; it does not claim
  // external services are healthy until they are independently checked.
  return NextResponse.json({
    status: 'ok',
    service: 'ai-development-command-center',
    integrations: {
      github: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER),
      postgres: Boolean(process.env.DATABASE_URL),
    },
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
