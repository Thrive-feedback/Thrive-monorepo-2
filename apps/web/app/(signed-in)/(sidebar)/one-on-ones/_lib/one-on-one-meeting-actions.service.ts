'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  AGENDA_CHANGED,
  act,
  COULD_NOT,
  refuse,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-act.service';
import { apiClient } from '@/lib/api-client.service';
import { requireMemberOf } from '@/lib/session/session.service';
import { MEETING_CONTEXT_TABS } from './meeting-context.util';
import type { MeetingContextCard } from './one-on-one-meeting.type';
import { readContextPage } from './one-on-one-meetings.service';

const Id = z.uuid();
const Topic = z.string().trim().min(1).max(200);
const Note = z.string().max(4000);
const Position = z.number().int().min(0);
const SeenAgenda = z.array(z.string()).max(200);

/** A change to one topic, checked whole: nothing else the browser sends reaches the API. */
const TopicChange = z
  .strictObject({
    note: Note.optional(),
    /** When the note was last read, as `notesUpdatedAt` showed it. */
    noteReadAt: z.iso.datetime({ offset: true }).nullable().optional(),
    discussed: z.boolean().optional(),
  })
  .refine(
    (change) => change.note !== undefined || change.discussed !== undefined,
  );

export type TopicChange = z.input<typeof TopicChange>;

type MeetingsPath = {
  readonly workspaceId: string;
  readonly oneOnOneId: string;
};

/** The ids a call names, each a UUID, or `null` when any is not, which is refused before sending. */
function idsOf<Ids extends Record<string, string>>(ids: Ids): Ids | null {
  for (const id of Object.values(ids)) {
    if (!Id.safeParse(id).success) {
      return null;
    }
  }
  return ids;
}

/** The live meeting's id, opening the next one when nothing has been written to it yet. */
async function liveMeeting(
  path: MeetingsPath,
  cookie: string | undefined,
  meetingId: string | null,
): Promise<string> {
  if (meetingId !== null) {
    return meetingId;
  }
  const opened = unwrap(
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings',
      { params: { path, header: { cookie } } },
    ),
  );
  return opened.id;
}

/** Starts the next meeting, opening its agenda first if nobody has written to it yet. */
export async function startMeeting(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string | null,
): Promise<OneOnOneActionResult> {
  const ids = idsOf({ oneOnOneId, ...(meetingId ? { meetingId } : {}) });
  if (!ids) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    const path = { ...workspace, oneOnOneId };
    const id = await liveMeeting(path, cookie, meetingId);
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/start',
      { params: { path: { ...path, meetingId: id }, header: { cookie } } },
    );
    return id;
  });
}

/** Finishes a meeting, sharing its summary with both. */
export async function finishMeeting(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string,
): Promise<OneOnOneActionResult> {
  if (!idsOf({ oneOnOneId, meetingId })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/finish',
      {
        params: {
          path: { ...workspace, oneOnOneId, meetingId },
          header: { cookie },
        },
      },
    );
    return meetingId;
  });
}

/** What a topic is brought from: an item of the other person's Profile, named by its id. */
const BroughtFrom = z.strictObject({
  kind: z.enum(['FEEDBACK', 'KUDOS', 'ASK']),
  id: Id,
});

export type BroughtFrom = z.input<typeof BroughtFrom>;

/**
 * Adds a topic to the next meeting's agenda, opening it first if needed. One brought from what was
 * read before the meeting names it, and the API checks the reader may read it.
 */
export async function addTopic(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string | null,
  text: string,
  broughtFrom?: BroughtFrom,
): Promise<OneOnOneActionResult> {
  const topic = Topic.safeParse(text);
  if (!topic.success) {
    return { ok: false, message: 'A topic is a line, up to 200 characters.' };
  }
  const source =
    broughtFrom === undefined ? undefined : BroughtFrom.safeParse(broughtFrom);
  if (
    !idsOf({ oneOnOneId, ...(meetingId ? { meetingId } : {}) }) ||
    (source !== undefined && !source.success)
  ) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    const path = { ...workspace, oneOnOneId };
    const id = await liveMeeting(path, cookie, meetingId);
    const added = unwrap(
      await apiClient().POST(
        '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics',
        {
          params: { path: { ...path, meetingId: id }, header: { cookie } },
          body: {
            text: topic.data,
            ...(source?.success ? { broughtFrom: source.data } : {}),
          },
        },
      ),
    );
    return added.id;
  });
}

const TemplateKey = z.string().trim().min(1).max(100);

/**
 * Uses a template for the next meeting while it is prepared, opening it first if needed: its
 * questions are added after the agenda's topics (ADR 0099).
 */
export async function chooseTemplateForMeeting(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string | null,
  templateKey: string,
): Promise<OneOnOneActionResult> {
  const key = TemplateKey.safeParse(templateKey);
  if (!key.success) {
    return { ok: false, message: 'Choose one of the templates.' };
  }
  if (!idsOf({ oneOnOneId, ...(meetingId ? { meetingId } : {}) })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    const path = { ...workspace, oneOnOneId };
    const id = await liveMeeting(path, cookie, meetingId);
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().PUT(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/template',
      {
        params: { path: { ...path, meetingId: id }, header: { cookie } },
        body: { templateKey: key.data },
      },
    );
    return id;
  });
}

/**
 * Takes a template off the meeting being prepared: every question it asked leaves the agenda at once
 * (ADR 0099). Only a meeting already open has a template on it to take off.
 */
export async function removeTemplateFromMeeting(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string,
  templateKey: string,
): Promise<OneOnOneActionResult> {
  const key = TemplateKey.safeParse(templateKey);
  if (!key.success || !idsOf({ oneOnOneId, meetingId })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().DELETE(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/template/{templateKey}',
      {
        params: {
          path: { ...workspace, oneOnOneId, meetingId, templateKey: key.data },
          header: { cookie },
        },
      },
    );
    return undefined;
  });
}

/**
 * Writes a topic's shared note, or ticks it discussed. A note saving itself does not read the page
 * again: only its writer needs it, and what the other wrote arrives on Sync.
 */
export async function updateTopic(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string,
  topicId: string,
  change: TopicChange,
): Promise<OneOnOneActionResult> {
  const parsed = TopicChange.safeParse(change);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        change.note !== undefined && !Note.safeParse(change.note).success
          ? 'Keep a note to 4,000 characters.'
          : COULD_NOT,
    };
  }
  if (!idsOf({ oneOnOneId, meetingId, topicId })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(
    workspaceId,
    async (workspace, cookie) => {
      // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
      await apiClient().PATCH(
        '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics/{topicId}',
        {
          params: {
            path: { ...workspace, oneOnOneId, meetingId, topicId },
            header: { cookie },
          },
          body: parsed.data,
        },
      );
      return topicId;
    },
    { revalidate: parsed.data.discussed !== undefined },
  );
}

/** Takes a topic off the agenda. */
export async function removeTopic(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string,
  topicId: string,
): Promise<OneOnOneActionResult> {
  if (!idsOf({ oneOnOneId, meetingId, topicId })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().DELETE(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics/{topicId}',
      {
        params: {
          path: { ...workspace, oneOnOneId, meetingId, topicId },
          header: { cookie },
        },
      },
    );
    return undefined;
  });
}

/** Puts the agenda in a new order. */
export async function reorderTopics(
  workspaceId: string,
  oneOnOneId: string,
  meetingId: string,
  topicIds: readonly string[],
): Promise<OneOnOneActionResult> {
  if (
    !idsOf({ oneOnOneId, meetingId }) ||
    !topicIds.every((id) => Id.safeParse(id).success)
  ) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().PUT(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics/order',
      {
        params: {
          path: { ...workspace, oneOnOneId, meetingId },
          header: { cookie },
        },
        body: { topicIds: [...topicIds] },
      },
    );
    return undefined;
  });
}

/**
 * The agenda of the next meeting, opened now if nobody has written to it: its id and its topics in
 * order. Opened by this call, it has the topics its preview showed in the same order; opened already
 * by the other person, it may not, which the caller checks against what the person saw.
 */
async function openedAgenda(
  path: MeetingsPath,
  cookie: string | undefined,
): Promise<{
  meetingId: string;
  topics: readonly { readonly id: string; readonly text: string }[];
}> {
  const meetingId = await liveMeeting(path, cookie, null);
  const next = unwrap(
    await apiClient().GET(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/next',
      { params: { path, header: { cookie } }, cache: 'no-store' },
    ),
  );
  return { meetingId, topics: next.meeting?.topics ?? [] };
}

/**
 * Takes a topic off an agenda nobody had written to when the person read it, by its place and its
 * words, opening it first. If the topic there is no longer the one they saw, nothing is removed.
 */
export async function removePreviewTopic(
  workspaceId: string,
  oneOnOneId: string,
  position: number,
  text: string,
): Promise<OneOnOneActionResult> {
  const at = Position.safeParse(position);
  if (!at.success || !idsOf({ oneOnOneId })) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    const path = { ...workspace, oneOnOneId };
    const { meetingId, topics } = await openedAgenda(path, cookie);
    const topic = topics[at.data];
    if (topic?.text !== text) {
      return refuse(AGENDA_CHANGED);
    }
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().DELETE(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics/{topicId}',
      {
        params: {
          path: { ...path, meetingId, topicId: topic.id },
          header: { cookie },
        },
      },
    );
    return meetingId;
  });
}

/**
 * Moves a topic on an agenda nobody had written to when the person read it, opening it first.
 * `seen` is the agenda as they read it; if it no longer is, nothing moves.
 */
export async function reorderPreviewTopics(
  workspaceId: string,
  oneOnOneId: string,
  seen: readonly string[],
  from: number,
  to: number,
): Promise<OneOnOneActionResult> {
  const source = Position.safeParse(from);
  const target = Position.safeParse(to);
  const agenda = SeenAgenda.safeParse(seen);
  if (
    !source.success ||
    !target.success ||
    !agenda.success ||
    !idsOf({ oneOnOneId })
  ) {
    return { ok: false, message: COULD_NOT };
  }
  return act(workspaceId, async (workspace, cookie) => {
    const path = { ...workspace, oneOnOneId };
    const { meetingId, topics } = await openedAgenda(path, cookie);
    const unchanged =
      topics.length === agenda.data.length &&
      topics.every((topic, index) => topic.text === agenda.data[index]);
    if (!unchanged) {
      return refuse(AGENDA_CHANGED);
    }
    const topicIds = topics.map((topic) => topic.id);
    const [moved] = topicIds.splice(source.data, 1);
    if (moved === undefined) {
      return refuse(AGENDA_CHANGED);
    }
    topicIds.splice(target.data, 0, moved);
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().PUT(
      '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/{meetingId}/topics/order',
      {
        params: { path: { ...path, meetingId }, header: { cookie } },
        body: { topicIds },
      },
    );
    return meetingId;
  });
}

/** Where the next meeting stands, for a page to tell whether the other person moved it on. */
export type MeetingState = {
  readonly meetingId: string | null;
  readonly state: 'PREPARING' | 'IN_PROGRESS' | null;
};

/**
 * Where the next meeting of a 1:1 stands now: which meeting is open, if any, and whether it has
 * started. It writes nothing and reads the page again for nobody; the page asks it every few seconds
 * so that Start and Finish pressed by one person reach the other without Sync. `null` when it could
 * not be read, which the page takes as nothing changed.
 */
export async function checkMeetingState(
  workspaceId: string,
  oneOnOneId: string,
): Promise<MeetingState | null> {
  if (!idsOf({ oneOnOneId })) {
    return null;
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const next = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/next',
        {
          params: {
            path: { workspaceId: membership.workspace.id, oneOnOneId },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
    const meeting = next.meeting;
    return {
      meetingId: meeting?.id ?? null,
      state:
        meeting?.state === 'PREPARING' || meeting?.state === 'IN_PROGRESS'
          ? meeting.state
          : null,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}

/** The next batch of one tab, checked whole before it is asked for. */
const ContextBatch = z.strictObject({
  aboutAccountId: Id,
  tab: z.enum(MEETING_CONTEXT_TABS),
  since: z.iso.datetime({ offset: true }),
  cursor: z.string().min(1).max(500),
});

export type ContextBatchRequest = z.input<typeof ContextBatch>;

/**
 * The next batch of one tab of Before you meet, read when Next passes the last card loaded; `null`
 * when it could not be read, and the page says so. A read, not a write: what the Profile's route
 * answers for the signed-in reader, through the server, which holds the session.
 */
export async function readMoreMeetingContext(
  workspaceId: string,
  request: ContextBatchRequest,
): Promise<{
  readonly items: readonly MeetingContextCard[];
  readonly nextCursor: string | null;
} | null> {
  const asked = ContextBatch.safeParse(request);
  if (!asked.success) {
    return null;
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    return await readContextPage(
      membership,
      asked.data.aboutAccountId,
      asked.data.tab,
      asked.data.since,
      asked.data.cursor,
      cookie,
    );
  } catch (error) {
    // Only a refusal the API answered is said as a failed read; anything else is a fault.
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}
