# Notion repository registry sync

This scheduled workflow reconciles the GitHub repository inventory owned by `muchlisbstg` with the Notion **GitHub Sync Register**. It is an idempotent upsert keyed by `repo:owner/name`; repeated runs update the same Notion row rather than creating duplicates.

## Required GitHub Actions configuration

Configure these at the **repository** scope in `muchlisbstg/business-automation-system`:

- `GH_REPO_READ_TOKEN` — a fine-grained PAT or GitHub App token that can read metadata for all repositories in scope, read repository contents/commits, and read Actions workflow runs. Do not paste the token into issues, logs, or chat.
- `NOTION_API_KEY` — Notion integration token with read/update/insert access to the GitHub Sync Register data source.
- `NOTION_DATABASE_ID` — the Notion **data source ID** used by the integration. The existing register data source is `511b29e1-bc35-4ade-ab3d-2891a20a3c9e`.

The default `GITHUB_TOKEN` is not sufficient to read private repositories other than the workflow's own repository. The workflow deliberately requires a separately configured read token. Never give this token write access to GitHub repositories.

## Schedule and manual execution

- Runs every 30 minutes at minutes 17 and 47.
- Supports `workflow_dispatch` for a manual run.
- The workflow validates that configuration exists without printing any secret values.
- Tests use mocked HTTP responses; they do not contact GitHub or Notion.
- Live synchronization is considered successful only when the workflow run completes with zero repository failures.

## Registry mapping

| Notion property | Source |
| --- | --- |
| `Name` | `Repository: repo-name`, linked to the GitHub repository |
| `Repository` | GitHub repository URL |
| `Item Type` | `Documentation` |
| `Status` | `Open` (registry row, not deployment status) |
| `Branch` | Default branch |
| `Commit SHA` | Latest commit SHA on the default branch |
| `CI Status` | Latest GitHub Actions run conclusion; `Unknown` if no run is available |
| `Workflow URL` | Latest Actions run URL, if one exists |
| `Last Synced` | Timestamp for the successful registry upsert attempt |
| `Sync Key` | `repo:owner/name`, normalized to lowercase |

Repositories without Actions runs are still registered and show CI `Unknown`. Archived repositories are excluded. The script fails the workflow if any repository cannot be read or upserted; the log contains repository names and sanitized error messages, never credentials.

## Safety boundaries

This workflow only reads GitHub metadata/commits/Actions and creates or updates Notion registry rows. It does not commit code, merge pull requests, change repository settings, or deploy applications. A successful inventory run does not imply the products themselves are production-ready or compliant.
