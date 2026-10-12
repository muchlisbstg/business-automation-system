import { Octokit } from '@octokit/rest';

export function getGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new Octokit({ auth: token, userAgent: 'nexus-ai-engineering-control-plane' });
}

export function getAllowedRepositories() {
  const owner = process.env.GITHUB_OWNER;
  const repositories = (process.env.GITHUB_REPOSITORIES ?? '')
    .split(',').map((name) => name.trim()).filter(Boolean);
  return { owner, repositories };
}
