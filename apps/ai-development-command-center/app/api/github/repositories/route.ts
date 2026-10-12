import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { getAllowedRepositories, getGitHubClient } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const subject = session?.user?.id;
  if (!subject) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const client = getGitHubClient();
  const { owner, repositories } = getAllowedRepositories();
  if (!client || !owner || repositories.length === 0) {
    return NextResponse.json({ status: "not_configured", repositories: [], message: "GitHub read integration is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    // A token allowlist is only an upper bound; database membership is the user-level access boundary.
    const access = await pool.query<{ full_name: string }>(
      `SELECT DISTINCT r.full_name
       FROM repositories r
       JOIN projects p ON p.id = r.project_id
       LEFT JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_subject = $1
       LEFT JOIN repository_members rm ON rm.repository_id = r.id AND rm.user_subject = $1
       WHERE r.full_name = ANY($2::text[])
         AND p.status <> 'archived'
         AND (tm.user_subject IS NOT NULL OR rm.user_subject IS NOT NULL)`,
      [subject, repositories.map((name) => `${owner}/${name}`)],
    );
    const permitted = new Set(access.rows.map((row) => row.full_name));
    const visible = repositories.filter((name) => permitted.has(`${owner}/${name}`));
    const results = await Promise.all(visible.map(async (repo) => {
      const response = await client.repos.get({ owner, repo });
      return { name: response.data.name, fullName: response.data.full_name, private: response.data.private, defaultBranch: response.data.default_branch, htmlUrl: response.data.html_url, updatedAt: response.data.updated_at };
    }));
    return NextResponse.json({ status: "connected", repositories: results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error", repositories: [], message: "Repository lookup failed. Verify access and server configuration." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
