import type { Metadata } from 'next';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import type { OneOnOne } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  awaitsReadersAnswer,
  inListOrder,
  isMet,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-state.util';
import {
  readMyOneOnOnes,
  readOneOnOneTemplates,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-ones.service';
import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { OneOnOnePanel } from './_components/one-on-one-panel';
import { OneOnOneStrip } from './_components/one-on-one-strip';
import { OneOnOnesCreate } from './_components/one-on-ones-create';
import { OneOnOnesEmpty } from './_components/one-on-ones-empty';
import {
  readNextMeeting,
  readPastMeetings,
} from './_lib/one-on-one-meetings.service';
import { otherAccountOf } from './_lib/one-on-one-person.util';
import { todayInBangkok } from './_lib/one-on-one-schedule.util';
import {
  ONE_ON_ONES_COLUMN,
  ONE_ON_ONES_LIST_COLUMN,
  ONE_ON_ONES_PANEL_COLUMN,
} from './_lib/one-on-ones-layout.constant';
import { OneOnOnesSearchParams } from './_lib/one-on-ones-search-params.schema';
import styles from './page.module.css';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: '1:1s',
  robots: { index: false, follow: false },
};

type OneOnOnesProps = {
  /** `with` is the 1:1 open beside the list. */
  searchParams: Promise<{ with?: string | string[] }>;
};

/** The 1:1 to open when none is named: the first in list order, which is one awaiting an answer. */
function openByDefault(listed: readonly OneOnOne[]): OneOnOne | undefined {
  return listed.find(awaitsReadersAnswer) ?? listed[0];
}

/**
 * The person's 1:1s (brain ADR-0060, proposed): everyone they have one with, grouped by what each
 * asks of them, and the one open beside the list — to answer, to wait on, to meet, or to look back
 * on. Anybody may invite anybody; once a 1:1 is accepted the two are equal. A line under the title
 * says so for anyone new to it. From `lg` the page fills the frame, and only the list scrolls.
 */
export default async function OneOnOnes({ searchParams }: OneOnOnesProps) {
  const { with: openId } = OneOnOnesSearchParams.parse(await searchParams);
  const session = await requireMember();
  const { membership, email } = session;
  // The Workspace Goals depend on nothing else here, so they are read with the first batch; only a
  // 1:1 with meetings uses them, for Write as Feedback and Give Kudos.
  const [oneOnOnes, teammates, templates, workspaceGoals] = await Promise.all([
    readMyOneOnOnes(membership),
    readTeammates(membership, email),
    readOneOnOneTemplates(membership),
    readWorkspaceGoalNames(membership),
  ]);
  const listed = inListOrder(oneOnOnes);
  const named = listed.find((oneOnOne) => oneOnOne.id === openId);
  const open = named ?? openByDefault(listed);
  // A running 1:1's panel holds its meetings; one met once, or over, shows what was finished.
  const hasMeetings =
    open !== undefined && (open.status === 'ACTIVE' || open.status === 'ENDED');
  const [next, past] = hasMeetings
    ? await Promise.all([
        readNextMeeting(membership, open.id),
        readPastMeetings(membership, open.id),
      ])
    : [undefined, undefined];
  // Two people keep one 1:1 that is not over at a time, so the dialogs say who already has one.
  const unavailable = oneOnOnes
    .filter(
      (oneOnOne) =>
        oneOnOne.status !== 'DECLINED' &&
        oneOnOne.status !== 'ENDED' &&
        !isMet(oneOnOne),
    )
    .map(
      (oneOnOne) =>
        [
          otherAccountOf(oneOnOne),
          oneOnOne.status === 'ACTIVE'
            ? 'You already have a 1:1'
            : 'A 1:1 is waiting on an answer',
        ] as const,
    );

  return (
    <div className={cn(ONE_ON_ONES_COLUMN, styles.frame)}>
      <div className="flex shrink-0 flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <PageTitle>1:1s</PageTitle>
            <HandwrittenNote
              size="md"
              writes="on-open"
              className="hidden -translate-y-1.5 lg:block"
            >
              time that’s just the two of you
            </HandwrittenNote>
          </div>
          {/* One line from `lg`, where the page has the width for it; narrower, it wraps. */}
          <Text as="p" variant="body-2" tone="muted" className="lg:text-nowrap">
            Regular time with one teammate. Invite someone, and once they
            accept, either of you can change when it meets.
          </Text>
        </div>
        <div className="ms-auto">
          <OneOnOnesCreate
            workspaceId={membership.workspace.id}
            teammates={teammates}
            templates={templates}
            unavailable={unavailable}
          />
        </div>
      </div>
      {openId !== undefined && named === undefined && (
        <Text as="p" variant="body-2" role="status" tone="muted">
          That 1:1 is no longer in your list.
          {open ? ' Here is the first one instead.' : ''}
        </Text>
      )}
      {open === undefined ? (
        <OneOnOnesEmpty />
      ) : (
        <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-8">
          <div className={ONE_ON_ONES_LIST_COLUMN}>
            <OneOnOneStrip
              oneOnOnes={listed}
              selectedId={open.id}
              teammates={teammates}
              today={todayInBangkok()}
            />
          </div>
          <div className={ONE_ON_ONES_PANEL_COLUMN}>
            <OneOnOnePanel
              key={open.id}
              oneOnOne={open}
              workspaceId={membership.workspace.id}
              teammates={teammates}
              templates={templates}
              meetings={next && past ? { next, past } : undefined}
              compose={{
                workspaceId: membership.workspace.id,
                teammates,
                workspaceGoals,
                writer: toSessionWriter(session),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
