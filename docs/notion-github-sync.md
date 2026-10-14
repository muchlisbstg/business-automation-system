# Notion + GitHub sync

## Status
This workflow is proposed for review. Unit tests can run without Notion credentials. Live sync is skipped unless both GitHub Actions settings are configured:
- Secret: `NOTION_API_KEY`
- Repository variable: `NOTION_DATABASE_ID` (use the Notion **data source ID**, not the parent database page ID)

The Notion integration must be granted access to the target database. The configured database schema must contain these properties with matching types:
`Name` (title), `Repository` (URL), `Item Type` (select), `Status` (select), `GitHub URL` (URL), `Branch` (rich text), `Commit SHA` (rich text), `CI Status` (select), `Workflow URL` (URL), `Last Synced` (date), and `Sync Key` (rich text).

The Notion data source created for this project is named **GitHub Sync Register**. Verify its ID in Notion before configuring repository variables.

## Events
- Pull requests: opened, reopened, synchronized, draft transitions, and closed.
- Issues: opened, edited, reopened, and closed.
- Workflow runs: completed runs for the workflow named `CI`.
- Workflow dispatch runs tests only; it does not create or update Notion records.

## Idempotency and failure behavior
A stable Sync Key is derived from repository + item type + GitHub item/run ID. The job queries the data source and updates the matching page; otherwise it creates a page. If multiple rows match, the sync fails instead of choosing an arbitrary page. API failures return a sanitized HTTP status and error code; authorization headers and token values are never logged.

## Security
- Workflow permissions are read-only for repository contents.
- Checkout disables persisted Git credentials.
- No merge, release, or deployment action is present.
- Never use `pull_request_target` or execute untrusted PR code with Notion secrets.
- GitHub Actions secrets are available only to the sync job after unit tests pass.
- Review branch protection and secret availability separately; the workflow cannot verify organization policy or prove credentials are valid when the live job is skipped.

## Validation checklist
- [ ] Add `NOTION_API_KEY` as a GitHub Actions secret.
- [ ] Add `NOTION_DATABASE_ID` as a repository variable with the data source ID.
- [ ] Share the Notion database with the integration.
- [ ] Confirm all property names and select options match the data source schema; GitHub event links should be embedded in the Name title.
- [ ] Review the pull request and wait for CI checks.
- [ ] After merge approval, trigger a low-risk issue edit and confirm a single row is created/updated.
- [ ] Confirm the workflow run URL and SHA are correct.
- [ ] Confirm a repeated event updates the same row and does not create a duplicate.
- [ ] Verify that failed API requests do not expose secrets in logs.

Passing unit tests only validates local mapping and mocked API behavior. It does not establish that the Notion token, integration permissions, data source ID, or live API calls work.
