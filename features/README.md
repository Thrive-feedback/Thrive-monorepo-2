# `features/`

Gherkin scenarios, at the repository root because they belong to everyone — `GEN_10` R9.
Step definitions live with the stack that runs them: `@api` steps in `apps/api/test/steps`.

| Feature                     | Covers                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sessions.feature`          | being recognised while signed in; signing out; starting Google sign-in; being turned away while signed out; renewing a session |
| `profiles.feature`          | introducing yourself, once                                                                                      |
| `workspace.feature`         | founding a Workspace; the two refusals a founder can meet; who is in a Workspace, and only for its Members       |
| `invitations.feature`       | inviting one or several people and each outcome; the link read while signed out; joining from the email or from the Invitations waiting on sign-in; revoking, resending, accepting an expired one or a second one; who may do which |
| `feedback-requests.feature` | asking for Feedback, and only a Member of the Workspace; what was sent, what is waiting and what was answered; only its parties may read it, and an Ask only its Giver |
| `workspace-feed.feature`    | the Feedback people shared with everyone, newest first, read by every Member of the Workspace and by nobody outside it; whatever was kept narrower never appears |
| `shared-feedback.feature`   | reading the Feedback somebody chose to show you — an answer a Requester shared, Feedback a Giver shared — and nothing else: not what nobody was selected for, not another Member's, not your own, not another Workspace's |
| `offered-feedback.feature`  | giving Feedback without being asked, and only to a Member of the Workspace; the Receiver reads it as given without a request; it asks nobody anything; only the people the Giver chose read it, and only inside the Workspace |

Every scenario is `@api`. No `@browser` steps exist yet (`FE_15`; Playwright is planned).

## Running them

```
docker compose up -d                          # Postgres
bun run --cwd apps/api db:generate
bun run --cwd apps/api db:migrate:deploy
bun run --cwd apps/api test:bdd
```

The run boots the real API on a free port, wired as it ships, with only the email provider
replaced by a fake that records what was sent (`BE_13` R9). Google cannot be driven from a test,
so a signed-in person is a session written the way Better Auth writes one; the Sessions feature
is what proves that cookie is a real session. Every other given goes through the API. Each
scenario creates its own people and removes everything it made, and the order is random.

CI runs the same commands on every pull request, as the *Scenarios* job in
`.github/workflows/pr.yml`, against a Postgres service of the version compose runs.
