import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

export function buildRecord(eventName, payload, repository, now = new Date()) {
  const repoUrl = `https://github.com/${repository}`;
  let itemType;
  let title;
  let status = "Open";
  let githubUrl = repoUrl;
  let branch = "";
  let sha = "";
  let ciStatus = "Unknown";
  let workflowUrl = "";
  let syncKey;

  if (eventName === "pull_request") {
    const pr = payload.pull_request;
    if (!pr?.number || !pr.html_url) throw new Error("pull_request payload is missing pull_request.number or html_url");
    itemType = "Pull Request";
    title = `PR #${pr.number}: ${pr.title || "Untitled"}`;
    status = pr.merged ? "Merged" : pr.state === "closed" ? "Closed" : pr.draft ? "Review" : "Open";
    githubUrl = pr.html_url;
    branch = pr.head?.ref || "";
    sha = pr.head?.sha || "";
    syncKey = `${repository}:pull_request:${pr.number}`;
  } else if (eventName === "issues") {
    const issue = payload.issue;
    if (!issue?.number || !issue.html_url) throw new Error("issues payload is missing issue.number or html_url");
    itemType = "Issue";
    title = `Issue #${issue.number}: ${issue.title || "Untitled"}`;
    status = issue.state === "closed" ? "Closed" : "Open";
    githubUrl = issue.html_url;
    syncKey = `${repository}:issue:${issue.number}`;
  } else if (eventName === "workflow_run") {
    const run = payload.workflow_run;
    if (!run?.id || !run.html_url) throw new Error("workflow_run payload is missing workflow_run.id or html_url");
    itemType = "Workflow Run";
    title = `CI: ${run.name || "GitHub Actions"} #${run.run_number ?? run.id}`;
    const conclusion = run.conclusion;
    ciStatus = run.status === "queued" ? "Queued"
      : run.status === "in_progress" ? "In Progress"
      : conclusion === "success" ? "Success"
      : conclusion === "failure" || conclusion === "timed_out" || conclusion === "action_required" ? "Failure"
      : conclusion === "cancelled" ? "Cancelled"
      : conclusion === "skipped" ? "Skipped" : "Unknown";
    status = ciStatus === "Success" ? "Passed" : ciStatus === "Failure" ? "Failed" : ciStatus === "In Progress" ? "In Progress" : ciStatus === "Queued" ? "Open" : "Closed";
    githubUrl = run.html_url;
    branch = run.head_branch || "";
    sha = run.head_sha || "";
    workflowUrl = run.html_url;
    syncKey = `${repository}:workflow_run:${run.id}`;
  } else {
    throw new Error(`Unsupported event: ${eventName}`);
  }

  return {
    title,
    repositoryUrl: repoUrl,
    itemType,
    status,
    githubUrl,
    branch,
    sha,
    ciStatus,
    workflowUrl,
    syncedAt: now.toISOString(),
    syncKey
  };
}

function text(value) {
  return { rich_text: value ? [{ text: { content: String(value).slice(0, 2000) } }] : [] };
}

export function notionProperties(record) {
  const properties = {
    Name: { title: [{ text: { content: record.title.slice(0, 2000) } }] },
    Repository: { url: record.repositoryUrl },
    "Item Type": { select: { name: record.itemType } },
    Status: { select: { name: record.status } },
    "GitHub URL": { url: record.githubUrl },
    Branch: text(record.branch),
    "Commit SHA": text(record.sha),
    "CI Status": { select: { name: record.ciStatus } },
    "Last Synced": { date: { start: record.syncedAt } },
    "Sync Key": text(record.syncKey)
  };
  if (record.workflowUrl) properties["Workflow URL"] = { url: record.workflowUrl };
  return properties;
}

async function notionRequest(path, { token, method = "GET", body, fetchImpl = fetch }) {
  const response = await fetchImpl(`${NOTION_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); } catch { throw new Error(`Notion returned non-JSON response (HTTP ${response.status})`); }
  }
  if (!response.ok) {
    // Do not include request headers or token in error messages.
    throw new Error(`Notion API request failed: HTTP ${response.status} ${data.code || "unknown_error"}`);
  }
  return data;
}

export async function upsertRecord(record, { token, dataSourceId, fetchImpl = fetch }) {
  if (!token || !dataSourceId) throw new Error("NOTION_API_KEY and NOTION_DATABASE_ID must be configured");
  const query = await notionRequest(`/data_sources/${encodeURIComponent(dataSourceId)}/query`, {
    token, method: "POST", fetchImpl,
    body: { page_size: 2, filter: { property: "Sync Key", rich_text: { equals: record.syncKey } } }
  });
  const properties = notionProperties(record);
  if (query.results?.length > 1) throw new Error("Duplicate Sync Key detected in Notion; refusing to update ambiguous records");
  if (query.results?.length === 1) {
    const pageId = query.results[0].id;
    await notionRequest(`/pages/${encodeURIComponent(pageId)}`, { token, method: "PATCH", fetchImpl, body: { properties } });
    return { action: "updated", pageId };
  }
  const created = await notionRequest("/pages", {
    token, method: "POST", fetchImpl,
    body: { parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }
  });
  return { action: "created", pageId: created.id };
}

export async function run({ eventName, payload, repository, token, dataSourceId, fetchImpl = fetch, now = new Date() }) {
  const record = buildRecord(eventName, payload, repository, now);
  return { record, result: await upsertRecord(record, { token, dataSourceId, fetchImpl }) };
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  const dataSourceId = process.env.NOTION_DATABASE_ID;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !dataSourceId) throw new Error("Missing required GitHub Actions secrets/variables: NOTION_API_KEY and NOTION_DATABASE_ID");
  if (!eventPath || !eventName || !repository) throw new Error("Missing GitHub Actions event context");
  const payload = JSON.parse(await readFile(eventPath, "utf8"));
  const { record, result } = await run({ eventName, payload, repository, token, dataSourceId });
  console.log(JSON.stringify({ eventName, repository, syncKey: record.syncKey, action: result.action, pageId: result.pageId }));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
