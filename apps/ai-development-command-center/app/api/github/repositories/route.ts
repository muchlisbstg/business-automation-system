import { NextResponse } from 'next/server';
import { getAllowedRepositories, getGitHubClient } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = getGitHubClient();
  const { owner, repositories } = getAllowedRepositories();
  if (!client || !owner) {
    return NextResponse.json({ status: 'not_configured', repositories: [], message: 'Configure GITHUB_TOKEN and GITHUB_OWNER on the server.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (repositories.length === 0) {
    return NextResponse.json({ status: 'not_configured', repositories: [], message: 'Set an explicit GITHUB_REPOSITORIES allowlist before enabling repository reads.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const results = await Promise.all(repositories.map(async (repo) => {
      const response = await client.repos.get({ owner, repo });
      return { name: response.data.name, fullName: response.data.full_name, private: response.data.private, defaultBranch: response.data.default_branch, htmlUrl: response.data.html_url, updatedAt: response.data.updated_at };
    }));
    return NextResponse.json({ status: 'connected', repositories: results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Do not leak upstream response details or credentials to clients.
    return NextResponse.json({ status: 'error', repositories: [], message: 'GitHub repository lookup failed. Verify token scopes, allowlist, and repository access.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
