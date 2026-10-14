import test from "node:test";
import assert from "node:assert/strict";
import { syncRepositories } from "../scripts/notion-repository-registry-sync.mjs";

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) };
}

test("registry sync upserts a repository using stable Sync Key and current GitHub metadata", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/users/muchlisbstg/repos?")) {
      return response([{
        full_name: "muchlisbstg/africa-coffee-export",
        name: "africa-coffee-export",
        html_url: "https://github.com/muchlisbstg/africa-coffee-export",
        default_branch: "main",
        archived: false,
        owner: { login: "muchlisbstg" }
      }]);
    }
    if (String(url).endsWith("/commits/main")) {
      return response({ sha: "abc123" });
    }
    if (String(url).includes("/actions/runs?")) {
      return response({ workflow_runs: [{ status: "completed", conclusion: "success", html_url: "https://github.com/muchlisbstg/africa-coffee-export/actions/runs/7" }] });
    }
    if (String(url).endsWith("/data_sources/ds-123/query")) {
      return response({ results: [] });
    }
    if (String(url).endsWith("/pages")) {
      return response({ id: "page-123" });
    }
    throw new Error(`Unexpected URL in test: ${url}`);
  };

  const result = await syncRepositories({
    owner: "muchlisbstg",
    githubToken: "test-gh-token",
    notionToken: "test-notion-token",
    dataSourceId: "ds-123",
    fetchImpl,
    now: () => new Date("2026-10-14T00:00:00.000Z")
  });

  assert.deepEqual(result, { discovered: 1, created: 1, updated: 0, failed: 0, failures: [] });
  const create = calls.find(call => call.url.endsWith("/pages"));
  const properties = create.options.body ? JSON.parse(create.options.body).properties : null;
  assert.equal(properties.Name.title[0].text.content, "Repository: africa-coffee-export");
  assert.equal(properties.Name.title[0].text.link.url, "https://github.com/muchlisbstg/africa-coffee-export");
  assert.equal(properties.Repository.url, "https://github.com/muchlisbstg/africa-coffee-export");
  assert.equal(properties["Commit SHA"].rich_text[0].text.content, "abc123");
  assert.equal(properties["CI Status"].select.name, "Success");
  assert.equal(properties["Sync Key"].rich_text[0].text.content, "repo:muchlisbstg/africa-coffee-export");
  assert.equal(properties["Last Synced"].date.start, "2026-10-14T00:00:00.000Z");
  assert.equal(properties["https://github.com/muchlisbstg/business-automation-system"], undefined);
});

test("registry sync refuses to run when a required token is absent", async () => {
  await assert.rejects(
    syncRepositories({ owner: "muchlisbstg", githubToken: "", notionToken: "n", dataSourceId: "ds" }),
    /GH_REPO_READ_TOKEN/
  );
});

test("registry sync records per-repository failures and fails the overall run", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("/users/muchlisbstg/repos?")) {
      return response([{
        full_name: "muchlisbstg/broken-repo",
        name: "broken-repo",
        html_url: "https://github.com/muchlisbstg/broken-repo",
        default_branch: "main",
        archived: false,
        owner: { login: "muchlisbstg" }
      }]);
    }
    if (String(url).endsWith("/commits/main")) return response({ message: "Not Found" }, 404);
    throw new Error(`Unexpected URL in test: ${url}`);
  };

  await assert.rejects(
    syncRepositories({
      owner: "muchlisbstg",
      githubToken: "gh",
      notionToken: "notion",
      dataSourceId: "ds",
      fetchImpl
    }),
    /completed with 1 failure/
  );
});
