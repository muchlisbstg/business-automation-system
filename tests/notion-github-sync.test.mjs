import test from "node:test";
import assert from "node:assert/strict";
import { buildRecord, notionProperties, upsertRecord, run } from "../scripts/notion-github-sync.mjs";

const now = new Date("2026-10-14T12:00:00.000Z");
const repo = "muchlisbstg/business-automation-system";

test("maps open pull request and creates stable idempotency key", () => {
  const record = buildRecord("pull_request", { pull_request: {
    number: 42, title: "Add Notion sync", html_url: "https://github.com/x/y/pull/42",
    state: "open", draft: true, merged: false,
    head: { ref: "feat/sync", sha: "abc123" }
  } }, repo, now);
  assert.equal(record.itemType, "Pull Request");
  assert.equal(record.status, "Review");
  assert.equal(record.syncKey, `${repo}:pull_request:42`);
  assert.equal(record.sha, "abc123");
});

test("maps merged PR and closed issue statuses", () => {
  const pr = buildRecord("pull_request", { pull_request: {
    number: 1, title: "Merged", html_url: "https://github.com/x/y/pull/1",
    state: "closed", merged: true, draft: false, head: {}
  } }, repo, now);
  const issue = buildRecord("issues", { issue: {
    number: 9, title: "Done", html_url: "https://github.com/x/y/issues/9", state: "closed"
  } }, repo, now);
  assert.equal(pr.status, "Merged");
  assert.equal(issue.status, "Closed");
});

test("maps workflow conclusions and preserves SHA and run URL", () => {
  const record = buildRecord("workflow_run", { workflow_run: {
    id: 123, run_number: 7, name: "CI", status: "completed", conclusion: "success",
    html_url: "https://github.com/x/y/actions/runs/123", head_branch: "feat/sync", head_sha: "deadbeef"
  } }, repo, now);
  assert.equal(record.itemType, "Workflow Run");
  assert.equal(record.ciStatus, "Success");
  assert.equal(record.status, "Passed");
  assert.equal(record.sha, "deadbeef");
  assert.equal(record.workflowUrl, record.githubUrl);
});

test("rejects unsupported event and malformed payload", () => {
  assert.throws(() => buildRecord("push", {}, repo, now), /Unsupported event/);
  assert.throws(() => buildRecord("pull_request", {}, repo, now), /missing pull_request/);
});

test("builds valid Notion database property shapes and truncates text", () => {
  const record = buildRecord("issues", { issue: {
    number: 2, title: "A".repeat(2500), html_url: "https://github.com/x/y/issues/2", state: "open"
  } }, repo, now);
  const properties = notionProperties(record);
  assert.equal(properties.Name.title[0].text.content.length, 2000);
  assert.equal(properties.Name.title[0].text.link.url, record.githubUrl);
  assert.equal(properties["Sync Key"].rich_text[0].text.content, record.syncKey);
  assert.equal(properties["Last Synced"].date.start, now.toISOString());
  assert.equal(Object.hasOwn(properties, "GitHub URL"), false);
  assert.deepEqual(Object.keys(properties).sort(), [
    "CI Status", "Branch", "Commit SHA", "Item Type", "Last Synced",
    "Name", "Repository", "Status", "Sync Key"
  ].sort());
});

test("upsert creates page when no matching sync key exists", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/query")) return new Response(JSON.stringify({ results: [] }), { status: 200 });
    return new Response(JSON.stringify({ id: "page-created" }), { status: 200 });
  };
  const record = buildRecord("issues", { issue: {
    number: 3, title: "Task", html_url: "https://github.com/x/y/issues/3", state: "open"
  } }, repo, now);
  const result = await upsertRecord(record, { token: "test-token", dataSourceId: "test-ds", fetchImpl });
  assert.equal(result.action, "created");
  assert.equal(result.pageId, "page-created");
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].options.body).parent.data_source_id, "test-ds");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
});

test("upsert updates an existing page rather than creating duplicates", async () => {
  let created = false;
  const fetchImpl = async (url, options) => {
    if (url.endsWith("/query")) return new Response(JSON.stringify({ results: [{ id: "existing-page" }] }), { status: 200 });
    if (url.endsWith("/pages/existing-page")) return new Response(JSON.stringify({ id: "existing-page" }), { status: 200 });
    created = true;
    return new Response(JSON.stringify({ id: "unexpected" }), { status: 200 });
  };
  const record = buildRecord("issues", { issue: {
    number: 4, title: "Task", html_url: "https://github.com/x/y/issues/4", state: "open"
  } }, repo, now);
  const result = await upsertRecord(record, { token: "test-token", dataSourceId: "test-ds", fetchImpl });
  assert.equal(result.action, "updated");
  assert.equal(result.pageId, "existing-page");
  assert.equal(created, false);
});

test("refuses ambiguous duplicate rows and missing credentials", async () => {
  const record = buildRecord("issues", { issue: {
    number: 5, title: "Task", html_url: "https://github.com/x/y/issues/5", state: "open"
  } }, repo, now);
  const fetchImpl = async () => new Response(JSON.stringify({ results: [{ id: "a" }, { id: "b" }] }), { status: 200 });
  await assert.rejects(upsertRecord(record, { token: "test-token", dataSourceId: "test-ds", fetchImpl }), /Duplicate Sync Key/);
  await assert.rejects(upsertRecord(record, { token: "", dataSourceId: "test-ds", fetchImpl }), /must be configured/);
});

test("does not expose secrets in HTTP error messages", async () => {
  const record = buildRecord("issues", { issue: {
    number: 6, title: "Task", html_url: "https://github.com/x/y/issues/6", state: "open"
  } }, repo, now);
  const fetchImpl = async () => new Response(JSON.stringify({ code: "unauthorized", message: "bad token" }), { status: 401 });
  await assert.rejects(upsertRecord(record, { token: "never-print-this", dataSourceId: "test-ds", fetchImpl }), error => {
    assert.match(error.message, /HTTP 401 unauthorized/);
    assert.doesNotMatch(error.message, /never-print-this|bad token/);
    return true;
  });
});

test("run composes event mapping with Notion upsert", async () => {
  const fetchImpl = async (url) => url.endsWith("/query")
    ? new Response(JSON.stringify({ results: [] }), { status: 200 })
    : new Response(JSON.stringify({ id: "page-run" }), { status: 200 });
  const result = await run({
    eventName: "issues",
    payload: { issue: { number: 7, title: "Task", html_url: "https://github.com/x/y/issues/7", state: "open" } },
    repository: repo, token: "test-token", dataSourceId: "test-ds", fetchImpl, now
  });
  assert.equal(result.result.action, "created");
  assert.equal(result.record.syncKey, `${repo}:issue:7`);
});

test("maps GitHub event URL into the linked title without requiring an extra URL column", () => {
  const record = buildRecord("issues", { issue: {
    number: 8, title: "Linked issue", html_url: "https://github.com/x/y/issues/8", state: "open"
  } }, repo, now);
  const properties = notionProperties(record);
  assert.equal(properties.Name.title[0].text.link.url, "https://github.com/x/y/issues/8");
  assert.equal(properties.Repository.url, `https://github.com/${repo}`);
});
