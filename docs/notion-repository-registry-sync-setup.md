# Notion Repository Registry Sync Setup

This workflow maintains a Notion registry of repositories owned by `muchlisbstg`. It reads repository metadata from GitHub and creates or updates Notion pages keyed by `repo:owner/name`.

## Required GitHub Actions configuration

In the repository settings, open **Secrets and variables → Actions** and configure:

- Repository secret `GH_REPO_READ_TOKEN`: a fine-grained GitHub token with read-only access to repository metadata/code and Actions run metadata for the repositories that should appear in the registry. Do not grant write access for this workflow.
- Repository secret `NOTION_API_KEY`: the Notion integration's internal integration secret. Never commit it, paste it into an issue, or print it in logs.
- Repository variable `NOTION_DATABASE_ID`: the ID of the Notion data source/database used as the registry target. The workflow currently reads this from `vars.NOTION_DATABASE_ID`, not from a secret.

Do not put token values in YAML, `.env` files committed to Git, test fixtures used in production, or workflow output.

## Notion access and schema

1. Open the target Notion database and confirm it has the properties used by `scripts/notion-repository-registry-sync.mjs`: `Name` (title), `Repository` (URL), `Item Type` (select), `Status` (select), `Branch` (rich text), `Commit SHA` (rich text), `CI Status` (select), `Last Synced` (date), `Sync Key` (rich text), and `Workflow URL` (URL).
2. Share the target data source/database with the Notion integration used by `NOTION_API_KEY`, with only the access required to query and create/update registry pages.
3. Confirm the integration can query the configured data source using the API version pinned by the script (`2025-09-03`).
4. Check existing records for duplicate `Sync Key` values before the first live run. The script intentionally refuses to update when it finds more than one matching key.

## Safe verification sequence

1. Run the existing unit tests locally or through CI: `node --test tests/notion-repository-registry-sync.test.mjs`.
2. Configure the three required values in GitHub Actions settings. The workflow validates only presence and does not print secret values.
3. Use **Actions → Notion Repository Registry Sync → Run workflow** for a controlled first run. The workflow also runs on its existing schedule (`17,47 * * * *`).
4. Inspect the sanitized run summary (`discovered`, `created`, `updated`, `failed`) and confirm representative pages and metadata in Notion.
5. If any repository fails, review only the sanitized repository/error summary and correct permissions or schema before retrying. Do not paste credentials into logs or chat.

## Current known blocker

The last reviewed run stopped during configuration validation because `GH_REPO_READ_TOKEN`, `NOTION_API_KEY`, and `NOTION_DATABASE_ID` were unavailable to the workflow. The sync step was skipped, so that run did not create or update Notion records. Re-run after the owner configures the required Actions secrets/variable and integration access.

## Scope and safety

The script filters out archived repositories owned by `muchlisbstg`, reads the default branch's latest commit and latest workflow run, and upserts one Notion page per repository. It does not modify GitHub repository code or settings. Validate the target Notion data source and integration permissions before enabling the scheduled sync for ongoing use.
