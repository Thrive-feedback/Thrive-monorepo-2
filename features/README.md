# `features/`

Gherkin scenarios, at the repository root because they belong to everyone — `GEN_10` R9.
Step definitions live with the stack that runs them: `@api` steps in `apps/api/test/steps`.

| Feature                     | Covers                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| `sessions.feature`          | being recognised while signed in; signing out                     |
| `workspace.feature`         | founding a Workspace; the two refusals a founder can meet         |
| `invitations.feature`       | inviting, joining from the email, revoking, who may do which      |
| `feedback-requests.feature` | asking a teammate for Feedback; nobody outside the Workspace sees it |

Every scenario is `@api`. No `@browser` steps exist yet (`FE_15`; Playwright is planned).

## Running them

```
docker compose up -d                          # Postgres
bun run --cwd apps/api db:migrate:deploy
bun run --cwd apps/api test:bdd
```

The run boots the real API on a free port, wired as it ships, with only the email provider
replaced by a fake that records what was sent (`BE_13` R9). Google cannot be driven from a test,
so a signed-in person is a session written the way Better Auth writes one; the Sessions feature
is what proves that cookie is a real session. Every other given goes through the API. Each
scenario creates its own people and removes everything it made, and the order is random.

Nothing runs this suite automatically yet: like `test:integration`, it needs a migrated
Postgres, which CI does not have.
