'use server';

import { unwrap } from '@repo/api';
import { z } from 'zod';
import type {
  OneOnOneActionResult,
  OneOnOneScheduleChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  act,
  COULD_NOT,
  REFUSALS,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-act.service';
import { apiClient } from '@/lib/api-client.service';

const Id = z.uuid();
const AccountId = z.uuid();
const ScheduleChoice = z.object({
  cadence: z.enum(['WEEKLY', 'EVERY_TWO_WEEKS', 'MONTHLY', 'ONCE']),
  weekday: z.number().int().min(1).max(7),
  startsOn: z.iso.date().optional(),
});
const Note = z.string().max(280);

/**
 * Invites a teammate to a 1:1, saying when it meets and, if the person wrote one, what they would
 * like to talk about. The teammate is asked to accept it.
 */
export async function inviteToOneOnOne(
  workspaceId: string,
  invitedAccountId: string,
  schedule: OneOnOneScheduleChoice,
  note = '',
): Promise<OneOnOneActionResult> {
  const invited = AccountId.safeParse(invitedAccountId);
  const choice = ScheduleChoice.safeParse(schedule);
  const written = Note.safeParse(note.trim());
  if (!invited.success || !choice.success) {
    return { ok: false, message: COULD_NOT };
  }
  if (!written.success) {
    return {
      ok: false,
      message: REFUSALS.ONE_ON_ONE_INVITE_NOTE_TOO_LONG ?? COULD_NOT,
    };
  }
  return act(workspaceId, async (path, cookie) => {
    const created = unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/one-on-ones', {
        params: { path, header: { cookie } },
        body: {
          invitedAccountId: invited.data,
          schedule: choice.data,
          ...(written.data === '' ? {} : { note: written.data }),
        },
      }),
    );
    return created.id;
  });
}

/** Accepts an invitation to a 1:1, on the schedule it was sent with. */
export async function acceptOneOnOne(
  workspaceId: string,
  oneOnOneId: string,
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(oneOnOneId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (path, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/accept',
      {
        params: {
          path: { ...path, oneOnOneId: id.data },
          header: { cookie },
        },
      },
    );
    return id.data;
  });
}

/** Turns down an invitation to a 1:1, with a note for whoever sent it if the person wrote one. */
export async function declineOneOnOne(
  workspaceId: string,
  oneOnOneId: string,
  note = '',
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(oneOnOneId);
  const written = Note.safeParse(note.trim());
  if (!id.success) {
    return { ok: false, message: COULD_NOT };
  }
  if (!written.success) {
    return {
      ok: false,
      message: REFUSALS.ONE_ON_ONE_ANSWER_NOTE_TOO_LONG ?? COULD_NOT,
    };
  }
  return act(workspaceId, async (path, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/decline',
      {
        params: {
          path: { ...path, oneOnOneId: id.data },
          header: { cookie },
        },
        body: written.data === '' ? {} : { note: written.data },
      },
    );
    return undefined;
  });
}

/** Ends a running 1:1, or withdraws an invitation the person sent that is not answered yet. */
export async function endOneOnOne(
  workspaceId: string,
  oneOnOneId: string,
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(oneOnOneId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (path, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/end',
      {
        params: {
          path: { ...path, oneOnOneId: id.data },
          header: { cookie },
        },
      },
    );
    return undefined;
  });
}

/** Changes when a 1:1 meets: either person once it runs, the sender before it is answered. */
export async function rescheduleOneOnOne(
  workspaceId: string,
  oneOnOneId: string,
  schedule: OneOnOneScheduleChoice,
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(oneOnOneId);
  const choice = ScheduleChoice.safeParse(schedule);
  if (!id.success || !choice.success) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (path, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().PUT(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/schedule',
      {
        params: {
          path: { ...path, oneOnOneId: id.data },
          header: { cookie },
        },
        body: choice.data,
      },
    );
    return id.data;
  });
}

/**
 * Sends an invitation back with another time, instead of declining it, with a note if the person
 * wrote one. It then waits on whoever sent it.
 */
export async function suggestAnotherTime(
  workspaceId: string,
  oneOnOneId: string,
  schedule: OneOnOneScheduleChoice,
  note = '',
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(oneOnOneId);
  const choice = ScheduleChoice.safeParse(schedule);
  const written = Note.safeParse(note.trim());
  if (!id.success || !choice.success) {
    return { ok: false, message: COULD_NOT };
  }
  if (!written.success) {
    return {
      ok: false,
      message: REFUSALS.ONE_ON_ONE_INVITE_NOTE_TOO_LONG ?? COULD_NOT,
    };
  }
  return act(workspaceId, async (path, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/suggest',
      {
        params: {
          path: { ...path, oneOnOneId: id.data },
          header: { cookie },
        },
        body: {
          schedule: choice.data,
          ...(written.data === '' ? {} : { note: written.data }),
        },
      },
    );
    return id.data;
  });
}
