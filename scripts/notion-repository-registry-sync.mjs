import { pathToFileURL } from "node:url";

const GH_API = "https://api.github.com";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

function requireValue(value, name) {
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

async function requestJson(url, { headers = {}, method = "GET", body, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    method,
    headers: { Accept: "application/vnd.github+json", ...headers, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); } catch { throw new Error(`Non-JSON response from API (HTTP ${response.status})`); }
  }
  if (!response.ok) {
    const code = data.code || data.message || "unknown_error";
    throw new Error(`API request failed: HTTP ${response.status} ${String(code).slice(0, 160)}`);
  }
  return data;
}

async function notionRequest(path, { token, method = "GET", body, fetchImpl }) {
  return requestJson(`${NOTION_API}${path}`, {
    method, body, fetchImpl,
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION }
  });
}

// Accept either a Notion database ID (the usual value copied from a database page)
// or a Data Source ID. With API version 2025-09-03, database objects expose
// their data source IDs through the `data_sources` array.
async function resolveDataSourceId(configuredId, { token, fetchImpl = fetch }) {
  try {
    const database = await notionRequest(`/databases/${encodeURIComponent(configuredId)}`, { token, fetchImpl });
    const sources = Array.isArray(database.data_sources) ? database.data_sources : [];
    if (sources.length === 1 && sources[0]?.id) return sources[0].id;
    if (sources.length > 1) {
      throw new Error(`Notion database has ${sources.length} data sources; configure a specific Data Source ID in NOTION_DATABASE_ID`);
    }
    throw new Error("Notion database was found, but it did not return a usable data source ID");
  } catch (error) {
    // A directly supplied Data Source ID is also supported. Only try this
    // fallback for a 404 from the database endpoint.
    if (!/HTTP 404/.test(String(error.message))) throw error;
  }

  try {
    const source = await notionRequest(`/data_sources/${encodeURIComponent(configuredId)}`, { token, fetchImpl });
    if (source.id) return source.id;
  } catch (error) {
    throw new Error(
      `Could not resolve NOTION_DATABASE_ID as a database or data source ( ${String(error.message || error).slice(0, 120)} ). Check the ID and ensure the Notion connection has access to GitHub Sync Register.`
    );
  }
  throw new Error("Could not resolve NOTION_DATABASE_ID to a Notion Data Source ID");
}

async function listOwnedRepos({ owner, githubToken, fetchImpl = fetch }) {
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await requestJson(`${GH_API}/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=100&page=${page}&sort=updated`, {
      fetchImpl,
      headers: { Authorization: `Bearer ${githubToken}`, "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!Array.isArray(batch)) throw new Error("GitHub repository list response was not an array");
    repos.push(...batch);
    if (batch.length < 100) return repos;
  }
  throw new Error("Repository pagination exceeded the safety limit");
}

async function latestCommit(repo, { githubToken, fetchImpl = fetch }) {
  return requestJson(`${GH_API}/repos/${repo.full_name}/commits/${encodeURIComponent(repo.default_branch)}`, {
    fetchImpl,
    headers: { Authorization: `Bearer ${githubToken}`, "X-GitHub-Api-Version": "2022-11-28" }
  });
}

async function latestWorkflow(repo, { githubToken, fetchImpl = fetch }) {
  try {
    const result = await requestJson(`${GH_API}/repos/${repo.full_name}/actions/runs?per_page=1`, {
      fetchImpl,
      headers: { Authorization: `Bearer ${githubToken}`, "X-GitHub-Api-Version": "2022-11-28" }
    });
    return result.workflow_runs?.[0] || null;
  } catch (error) {
    // Repositories without Actions enabled may return 404; keep repository sync useful and mark CI Unknown.
    if (/HTTP 404/.test(String(error.message))) return null;
    throw error;
  }
}

function richText(value) {
  return { rich_text: value ? [{ text: { content: String(value).slice(0, 2000) } }] : [] };
}

function statusFromRun(run) {
  if (!run) return "Unknown";
  if (run.status === "queued" || run.status === "waiting") return "Queued";
  if (run.status === "in_progress") return "In Progress";
  if (run.conclusion === "success") return "Success";
  if (run.conclusion === "failure" || run.conclusion === "timed_out" || run.conclusion === "action_required") return "Failure";
  if (run.conclusion === "cancelled") return "Cancelled";
  if (run.conclusion === "skipped" || run.conclusion === "neutral") return "Skipped";
  return "Unknown";
}

function registryProperties(repo, commit, run, syncedAt) {
  const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;
  const title = `Repository: ${repo.name}`;
  return {
    Name: { title: [{ text: { content: title, link: { url: repoUrl } } }] },
    Repository: { url: repoUrl },
    "Item Type": { select: { name: "Documentation" } },
    Status: { select: { name: "Open" } },
    Branch: richText(repo.default_branch || ""),
    "Commit SHA": richText(commit?.sha || ""),
    "CI Status": { select: { name: statusFromRun(run) } },
    "Last Synced": { date: { start: syncedAt } },
    "Sync Key": richText(`repo:${repo.full_name.toLowerCase()}`),
    "Workflow URL": run?.html_url ? { url: run.html_url } : { url: null }
  };
}

async function upsertRepo(repo, commit, run, { token, dataSourceId, fetchImpl = fetch, now = new Date() }) {
  const syncKey = `repo:${repo.full_name.toLowerCase()}`;
  const query = await notionRequest(`/data_sources/${encodeURIComponent(dataSourceId)}/query`, {
    token, method: "POST", fetchImpl,
    body: { page_size: 2, filter: { property: "Sync Key", rich_text: { equals: syncKey } } }
  });
  if (query.results?.length > 1) throw new Error(`Duplicate Sync Key detected for ${repo.full_name}; refusing ambiguous update`);
  const properties = registryProperties(repo, commit, run, now.toISOString());
  if (query.results?.length === 1) {
    const pageId = query.results[0].id;
    await notionRequest(`/pages/${encodeURIComponent(pageId)}`, { token, method: "PATCH", fetchImpl, body: { properties } });
    return "updated";
  }
  await notionRequest("/pages", {
    token, method: "POST", fetchImpl,
    body: { parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }
  });
  return "created";
}

export async function syncRepositories({ owner, githubToken, notionToken, dataSourceId, fetchImpl = fetch, now = () => new Date() }) {
  requireValue(owner, "GITHUB_OWNER");
  requireValue(githubToken, "GH_REPO_READ_TOKEN");
  requireValue(notionToken, "NOTION_API_KEY");
  requireValue(dataSourceId, "NOTION_DATABASE_ID");

  const resolvedDataSourceId = await resolveDataSourceId(dataSourceId, { token: notionToken, fetchImpl });
  const repos = (await listOwnedRepos({ owner, githubToken, fetchImpl }))
    .filter(repo => repo.owner?.login?.toLowerCase() === owner.toLowerCase() && !repo.archived)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
  if (repos.length === 0) throw new Error("No repositories were returned; refusing to treat an empty inventory as a successful sync");

  const summary = { discovered: repos.length, created: 0, updated: 0, failed: 0, failures: [] };
  for (const repo of repos) {
    try {
      const commit = await latestCommit(repo, { githubToken, fetchImpl });
      const run = await latestWorkflow(repo, { githubToken, fetchImpl });
      const action = await upsertRepo(repo, commit, run, { token: notionToken, dataSourceId: resolvedDataSourceId, fetchImpl, now: now() });
      summary[action]++;
    } catch (error) {
      summary.failed++;
      summary.failures.push({ repository: repo.full_name, error: String(error.message || error).slice(0, 200) });
    }
  }
  console.log(JSON.stringify(summary));
  if (summary.failed > 0) throw new Error(`Repository registry sync completed with ${summary.failed} failure(s); see sanitized summary above`);
  return summary;
}

async function main() {
  await syncRepositories({
    owner: process.env.GITHUB_OWNER || "muchlisbstg",
    githubToken: process.env.GH_REPO_READ_TOKEN,
    notionToken: process.env.NOTION_API_KEY,
    dataSourceId: process.env.NOTION_DATABASE_ID
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
