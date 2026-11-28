import 'server-only';
import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';

export const COULD_NOT = "That didn't go through. Please try again.";

/** What to say when the API refused a write to a 1:1 or its meetings, by its error code. */
export const REFUSALS: Readonly<Record<string, string>> = {
  ONE_ON_ONE_WITH_YOURSELF: 'You can’t have a 1:1 with yourself.',
  ONE_ON_ONE_PERSON_NOT_FOUND: "That person isn't in this Workspace any more.",
  ONE_ON_ONE_ALREADY_EXISTS:
    'You already have a 1:1 with this person, or one is waiting on an answer.',
  ONE_ON_ONE_SCHEDULE_INVALID:
    "That schedule can't be kept. Check the day, time and length.",
  ONE_ON_ONE_TEMPLATE_UNKNOWN: 'Choose one of the templates.',
  ONE_ON_ONE_INVITE_NOTE_TOO_LONG: 'Keep the note to 280 characters.',
  ONE_ON_ONE_ANSWER_NOTE_TOO_LONG: 'Keep the note to 280 characters.',
  ONE_ON_ONE_NOT_FOUND: 'That 1:1 is no longer here.',
  ONE_ON_ONE_NOT_AWAITING_ANSWER: 'It was already answered or withdrawn.',
  ONE_ON_ONE_ALREADY_OVER: 'It has already ended.',
  ONE_ON_ONE_NOT_YOURS_TO_ANSWER: 'Only the person invited can answer it.',
  ONE_ON_ONE_NOT_YOURS_TO_WITHDRAW:
    'Only the person who sent the invitation can withdraw it.',
  ONE_ON_ONE_NOT_YOURS_TO_CHANGE:
    'Only the person who sent the invitation can change it before it is answered.',
  ONE_ON_ONE_NOT_IN_IT: 'Only the two people in this 1:1 can do that.',
  ONE_ON_ONE_MEETING_IN_PROGRESS: 'A meeting is in progress. Finish it first.',
  ONE_ON_ONE_NOT_RUNNING:
    'This 1:1 isn’t active any more. Sync to see the latest.',
  ONE_ON_ONE_TIME_PASSED:
    'The time it was sent for has passed. Decline or withdraw it, then create a new 1:1.',
  ONE_ON_ONE_MEETING_NOT_FOUND: 'That meeting is no longer here. Sync to see.',
  ONE_ON_ONE_MEETING_NOT_STARTED: 'Start the meeting to take notes in it.',
  ONE_ON_ONE_MEETING_ALREADY_STARTED: 'It has already started. Sync to see.',
  ONE_ON_ONE_MEETING_FINISHED: 'This meeting has finished. Sync to see.',
  // Topics and notes share this refusal; only a topic's limit is short enough to be the cause
  // when one is typed.
  ONE_ON_ONE_MEETING_TEXT_INVALID:
    'That’s empty or too long. A topic is up to 200 characters.',
  ONE_ON_ONE_TOPIC_NOT_YOURS: 'Only the person who added it can change it.',
  ONE_ON_ONE_TOPIC_NOT_FOUND: 'That topic is no longer here. Sync to see.',
  ONE_ON_ONE_TOPIC_CHANGED:
    'This note changed since you read it. Sync to see it.',
  ONE_ON_ONE_TOPIC_ORDER_INVALID: 'The agenda changed. Sync, then reorder.',
  ONE_ON_ONE_TOPIC_ALREADY_ON_AGENDA: 'That’s already on the agenda.',
  ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND:
    'That isn’t something you can bring to this 1:1 any more.',
  ONE_ON_ONE_TEMPLATE_INVALID:
    'A template needs a name and at least one question, each short enough to read at a glance.',
  ONE_ON_ONE_TEMPLATE_NOT_YOURS:
    "Only an Admin changes the Workspace's templates, and only you change your own.",
  ONE_ON_ONE_TEMPLATE_NOT_FOUND:
    'That template is no longer here. It may have been removed.',
  ONE_ON_ONE_TEMPLATE_NAME_TAKEN:
    'There is already a template by that name here. Choose another name.',
  ONE_ON_ONE_TEMPLATE_LIMIT_REACHED:
    'There are as many templates here as Thrive keeps. Remove one first.',
};

/** Said when the agenda a person changed is no longer the one they saw. */
export const AGENDA_CHANGED = 'The agenda changed. Sync to see it.';

/** A call that decided, before the API could, that it will not go through. */
export type Refused = { readonly refused: string };

export function refuse(message: string): Refused {
  return { refused: message };
}

export type ActOptions = {
  /**
   * Whether the 1:1s page is read again once it went. Off for a write only its writer needs, such
   * as a note saving itself: what the other wrote then arrives on Sync rather than with every pause
   * in typing.
   */
  readonly revalidate?: boolean;
  /** The pages read again once it went, when it does; the 1:1s page unless given. */
  readonly paths?: readonly string[];
};

/**
 * Sends one write for the page drawn for `workspaceId`, which must still be the person's Workspace,
 * and says how it went. A refusal becomes a sentence; being signed out goes to sign in. Every 1:1
 * write goes through here, so they are refused and read again alike.
 */
export async function act(
  workspaceId: string,
  call: (
    workspace: { readonly workspaceId: string },
    cookie: string | undefined,
  ) => Promise<string | undefined | Refused>,
  { revalidate = true, paths = [ROUTES.oneOnOnes] }: ActOptions = {},
): Promise<OneOnOneActionResult> {
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  let signedOut = false;
  let outcome: string | undefined | Refused;
  try {
    outcome = await call({ workspaceId: membership.workspace.id }, cookie);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code !== 'NOT_SIGNED_IN') {
      return {
        ok: false,
        message: REFUSALS[error.code] ?? COULD_NOT,
        code: error.code,
      };
    }
    signedOut = true;
  }
  // Outside the catch: a redirect is thrown, and must not be caught as a refusal.
  if (signedOut) {
    redirect(ROUTES.signIn);
  }
  if (typeof outcome === 'object') {
    return { ok: false, message: outcome.refused };
  }
  if (revalidate) {
    for (const path of paths) {
      revalidatePath(path);
    }
  }
  return { ok: true, id: outcome };
}
