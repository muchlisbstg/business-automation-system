# Notion Repository Registry Sync — operator runbook

## Current failure mode

The workflow `.github/workflows/notion-repository-registry-sync.yml` validates its required configuration before it calls the Notion API. A failed validation means no repository registry sync is attempted. The workflow must remain failed when required configuration is missing; do not silently skip the sync and report success.

## Required GitHub Actions configuration

Configure these names in the repository or the approved environment used by the workflow:

| Name | GitHub setting | Purpose |
|---|---|---|
| `GH_REPO_READ_TOKEN` | Actions secret | Read repository metadata for the `muchlisbstg` owner scope. Use a fine-grained token or GitHub App credential with minimum required read permissions. |
| `NOTION_API_KEY` | Actions secret | Authenticate the Notion integration. |
| `NOTION_DATABASE_ID` | Actions variable | Identify the destination repository-registry database. This is an identifier, not a secret. |

Never commit token values, paste them into workflow logs, include them in issue comments, or store them in workflow files.

## Notion-side setup

1. Open the intended Notion repository registry database.
2. Share that database with the Notion integration associated with `NOTION_API_KEY`, granting only the access needed to create and update registry rows.
3. Copy the database ID from the intended database and set `NOTION_DATABASE_ID`.
4. Confirm the database schema matches the mapper and API tests in `scripts/notion-repository-registry-sync.mjs` and `tests/notion-repository-registry-sync.test.mjs`.
5. Do not create a second database as a workaround for a permission or schema error.

## Safe verification sequence

1. Review the workflow and mapper changes on a branch before merge.
2. Confirm all three required configuration names are present in GitHub Actions settings without printing their values.
3. Run the repository-registry mapper/API tests.
4. Use **Actions → Notion Repository Registry Sync → Run workflow** after configuration is ready.
5. Inspect the run summary and the target Notion database. Verify all expected accessible, non-archived repositories are present, including private repositories the token is authorized to read.
6. Verify pagination and rerun behavior; repeated runs should update matching rows rather than create duplicates.
7. If the run fails, preserve the failed status and troubleshoot the named missing setting, Notion integration access, database schema, or API response.

## Security and operational boundaries

- The workflow uses `contents: read`; retain least-privilege permissions.
- The workflow checks out the trusted default branch and disables persisted checkout credentials.
- Never add an automatic merge or production deployment to this workflow.
- A successful workflow proves the sync run completed; it does not prove that the Notion database schema or every row is semantically correct. Verify row counts and representative records.
- The connector cannot set repository Actions secrets or share a Notion database on the user's behalf. Those settings must be applied by an authorized owner in the relevant UI.
