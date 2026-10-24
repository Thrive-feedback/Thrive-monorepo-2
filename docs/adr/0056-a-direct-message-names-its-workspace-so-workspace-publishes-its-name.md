# 0056 — A direct message names its Workspace, so Workspace publishes its name

Status:   accepted
Date:     2026-10-24
Deciders: naroebordin

## Context

`#213` sends somebody a direct message when a teammate asks them for Feedback. Design `0021`
**D11** requires every such message to name its Workspace, because brain `ADR-0034` lets one
Account be a Member of any number of them and all of them reach the **same** chat conversation.
"Ann asked you for feedback" is ambiguous the moment somebody joins a second Workspace, and the
link in the message only resolves that after it has been clicked.

`0021` D11 said this would cost nothing: *"The caller already holds the name — every one of
these fires inside a use case running under `/v1/workspaces/:workspaceId`, where the guard has
resolved a `MembershipView` carrying `workspace.name`. So this costs an argument, not a read."*

**That is true of Integrations and false of Feedback.** Integrations' guard resolves a whole
membership and hands it to the controller. Feedback's guard
(`apps/api/src/modules/feedback/presentation/workspace-member.guard.ts`) only asks
`WorkspaceMembershipPort.isMemberOf` and keeps nothing. Feedback never has the Workspace's name,
and neither do its three use cases. Found while building #213.

The same applies to the **actor's** name: `0021` assumed the caller had it, and Feedback does not
— `PeopleService` resolves names per *page of a read*, not inside a write.

`WorkspaceMembershipPort`'s own contract rules out the obvious fix. It says, in the file: *"It
answers facts and nothing else: names, the Members themselves and what each Role may do stay
inside Workspace."* Adding `nameOf` there would contradict the boundary it exists to state.

## Decision

**Workspace publishes a second, narrow port, `WorkspaceNamePort`, answering one question:
`nameOf(workspaceId)`.** Notifications reads it, together with Identity's existing
`ProfileNamePort`, and composes the message itself. `PersonNotifierPort` therefore carries
**ids only** — no `workspaceName`, no `actorName`.

Three consequences follow:

1. **Feedback's three call sites pass only what they already hold.** They cannot be made wrong by
   a change to what a message says, and they do not have to be reopened when one changes.
2. **Two reads per event**, both after the caller's transaction has committed and off the path of
   anything a person is waiting for. They are not inside the unit of work and cannot slow or fail
   a write.
3. **A missing name never stops a message.** A Workspace whose name cannot be read is called
   "your workspace" and an Account with no Profile yet is called "Someone" — somebody who has not
   introduced themselves still asked for Feedback, and the person being told should hear about it.

## Why the others lost

- **Adding `nameOf` to `WorkspaceMembershipPort`** contradicts that port's written contract, which
  is the one place the Member/Role boundary is stated. A boundary that is edited the first time it
  is inconvenient is not a boundary. A separate port says plainly that a Workspace's *own name* is
  a different kind of fact from who is in it and what they may do — every Member already sees the
  name on every screen.
- **Passing both names as arguments**, as `0021` D11 planned, needs Feedback's guard to resolve a
  whole membership it does not need, for three writes, to carry data only another module uses. It
  also pushes the shape of a message into Feedback's signatures, so changing the words reopens the
  call sites.
- **Not naming the Workspace** was reconsidered and rejected. It is the one thing that makes a
  message unambiguous for the people `ADR-0034` created, and those are exactly the people most
  likely to be in two busy Workspaces.
- **Notifications reading Workspace's tables** is forbidden (`BE_03` R7) and would be a worse
  version of the same coupling.

## Consequences

- Workspace's published surface grows from one port to two. It is still the only module Feedback
  and Notifications reach it through.
- `0021` **D11 is superseded in its mechanism**, not its intent: messages still name their
  Workspace, and now say so from a read rather than an argument. `0021`'s claim about the caller
  already holding the name is wrong and is corrected in that document.
- Design `0022`'s in-app notifications inherit this for free: the bell is composed in the web app,
  so it needs neither name from the API, and the port stays the same for both channels.
- A third thing that wants a Workspace's name has somewhere to ask.

## What would reverse this

Feedback's guard coming to resolve a full membership for its own reasons — then the name is
genuinely in hand and passing it costs nothing again. Or a Workspace's name becoming something
not every Member may see, which would make this port a leak rather than a convenience.
