# 0091 — A Profile shows what everyone reads, and what was shared with the reader

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

The account card at the foot of the sidebar used to open Settings → Account. The product owner wants
it to open a **Profile** page instead. The same page opens from each row of the Teammates menu, so it
has to work for any Member of the Workspace, not only for the person it is about.

A Profile shows what was written to someone. That raised three questions: which Feedback may it hold,
does that depend on who is reading, and what happens with someone who has left?

## Decision

**A Profile is read in two routes, and anyone in the Workspace may read anyone's.**

- `GET /v1/workspaces/{workspaceId}/profiles/{slug}` belongs to Workspace. It returns who the person
  is (names, email, photo) and where they stand in the Workspace (Role, when they joined, Active or
  Deactivated). Identity resolves the slug through `AccountBySlugPort`.
- `GET /v1/workspaces/{workspaceId}/members/{accountId}/profile-items?show=FEEDBACK|SHARED_WITH_ME|KUDOS`
  belongs to Feedback. It is paged by cursor, the same way as Given. The reader comes from the
  session, never from the query.

**A Profile holds the Feedback given to the person that the reader may read as somebody outside
it, in two lists.** Both cover Requested and Offered Feedback that names the person as a Receiver.

- **`FEEDBACK`** is the Feedback whose Visibility is Everyone in the Workspace. It is the same for every
  reader, the person reading their own Profile included. It is read through
  `FeedbackRequestQuery.everyoneFeedbackTo`.
- **`SHARED_WITH_ME`** is the Feedback whose Visibility is Selected people, with the reader among those
  selected. It is Home's Shared with me, narrowed to Feedback written to this person, and it is read
  through `FeedbackRequestQuery.sharedFeedbackTo`. A Mention is covered, because nobody can be
  mentioned without being selected too. Feedback the reader gave, or received beside the person, is
  not in it. Those are the reader's own, in their Given and their Received, and Home leaves them out
  the same way.

Each read applies its rule, so a page never holds anything else (ADR 0044). Neither a Giver nor a
Receiver can be selected, so `SHARED_WITH_ME` is always empty for the person reading their own
Profile. The web does not offer that list there.

**The Kudos on a Profile are only the Kudos that name the person.** It reuses `KudosQuery.onHome`
with the recipient. A Kudos for the whole Workspace names nobody, so it is not on anyone's Profile.

**A Deactivated person's Profile still opens**, with all three lists, and shows them as Deactivated.
A slug that no Profile holds, or that belongs to someone who was never a Member of this Workspace,
answers `404 PROFILE_NOT_FOUND`. These two cases get the same answer, so nobody can learn by guessing
slugs who is in another Workspace.

## Consequences

- A Profile holds nothing that its reader cannot already read on Home or on the Kudos board. It only
  gathers that by person. That is why it needs no authorization rule beyond Workspace membership and
  the reader coming from the session.
- One Profile reads differently to different people, but only in the list that names the reader.
  What everyone reads stays in a list of its own, so Feedback shared with the reader is never mixed
  into a list that looks the same for everybody.
- Received is still the only place a person reads Feedback kept to Only them, and Selected Feedback
  written to them.
- `MembershipQuery.standingIn` is the first membership read that answers for a Deactivated person
  without being asked for Deactivated people only.
- Both routes only add to the contract, so this is not a breaking change under `GEN_08` R7.

## Alternatives rejected

- **Only what everyone reads, the same for every reader.** This was the first version of this
  decision. Once the product owner had used it, they wanted a teammate's Profile to hold what had
  been shared with them about that teammate too.
- **Feedback shared with the reader mixed into the Everyone list.** It is simpler, but private
  Feedback would sit among public Feedback on a page that reads as public. It would show on a shared
  screen, and it could only be told apart card by card.
- **Everything the reader may read, their own included.** This adds Feedback the reader gave, or
  received beside the person, which is already in their Given and Received. Home's Shared with me
  leaves those out as well.
- **Count Feedback and Kudos in a header.** Counting private Feedback would reveal that it exists.
  Counting only what is shown adds a read and says nothing the lists do not. The product owner
  dropped the counts.
- **One route returning the header and the lists together.** The header belongs to Workspace and
  the lists belong to Feedback, and a route that answers both would cross a module boundary.

## Links

- ADR 0044, ADR 0047, ADR 0059, ADR 0077, ADR 0080, ADR 0081, ADR 0090
