# `features/`

Gherkin scenarios, at the repository root because they belong to everyone — `GEN_10` R9.
Step definitions live with the stack that runs them: `@api` steps in `apps/api/test/steps`.

| Feature                     | Covers                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sessions.feature`          | being recognised while signed in; signing out; starting Google sign-in; being turned away while signed out; renewing a session |
| `profiles.feature`          | introducing yourself, once                                                                                      |
| `workspace.feature`         | founding a Workspace; the two refusals a founder can meet; who is in a Workspace, and only for its Members       |
| `invitations.feature`       | inviting one or several people, each as an Admin or a Member, and each outcome; the Role each Invitation was sent with; the link read while signed out; joining from the email or from the Invitations waiting on sign-in; revoking, resending, accepting an expired one or a second one; who may do which |
| `member-roles.feature`      | an Admin making anyone an Admin or a Member, other Admins and the founder included; the new Role holding from the next action; the last Admin kept; who may change Roles, and only inside their Workspace |
| `feedback-requests.feature` | asking for Feedback, and only a Member of the Workspace; what was sent, what is waiting and what was answered; only its parties may read it, and an Ask only its Giver |
| `workspace-feed.feature`    | the Feedback people shared with everyone, newest first, read by every Member of the Workspace and by nobody outside it; whatever was kept narrower never appears |
| `feed-items.feature`        | Home: what was shown to everyone and what selects or mentions you, in one list paged by one cursor, under each filter; an answer with its question; your own history left out; nobody outside the Workspace |
| `shared-feedback.feature`   | reading the Feedback somebody chose to show you — an answer a Requester shared, Feedback a Giver shared — and nothing else: not what nobody was selected for, not another Member's, not your own, not another Workspace's |
| `offered-feedback.feature`  | giving Feedback without being asked, and only to a Member of the Workspace; the Receiver reads it as given without a request; it asks nobody anything; only the people the Giver chose read it, and only inside the Workspace |
| `workspace-goals.feature`   | an Admin adding a Workspace Goal and every Member reading it; the name refused for a space, a length past 30, or a name already taken in any letter case, hidden ones included; hiding and showing again, which Members see and Admins see marked; only Admins manage them, and only in their own Workspace |
| `workspace-goals-in-feedback.feature` | A Feedback message, given or answering, and a Request message bound on sending to every active Workspace Goal they name, in any letter case, once each, read back in the Admin's spelling; a Workspace Goal hidden before sending binds nothing, one hidden after stays bound; an answer carries only what its Giver wrote |
| `mentions.feature`          | A Feedback message and a Request message naming a teammate by slug, read back by the name they go by; a Member of another Workspace never mentioned; a Mention shares nothing with the person named |

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
