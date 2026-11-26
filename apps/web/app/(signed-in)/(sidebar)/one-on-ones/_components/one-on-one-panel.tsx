import { CalendarClockIcon } from 'lucide-react';
import type {
  OneOnOne,
  OneOnOneSchedule,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  groupOf,
  isMet,
  isOnce,
  startedByReader,
  wasSuggested,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-state.util';
import type { OneOnOneMeetings } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  type OneOnOnePerson,
  otherPersonOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-person.util';
import {
  describeCalendarDay,
  describeDay,
  describeMeeting,
  describeSchedule,
  leavesListOn,
  timeOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { StatusText } from '@/components/atoms/status-text';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { type MeetingPeople } from './meeting-summary';
import { NextMeeting } from './next-meeting';
import {
  AnswerInvitation,
  RunningControls,
  Withdraw,
} from './one-on-one-controls';
import { FocusOnArrive } from './one-on-one-link';
import { PastMeetings, type PastMeetingsCompose } from './past-meetings';
import { RefocusWhenLost } from './refocus-when-lost';

export type OneOnOnePanelProps = {
  oneOnOne: OneOnOne;
  workspaceId: string;
  teammates: readonly Teammate[];
  templates: readonly OneOnOneTemplate[];
  /**
   * The meetings of a running 1:1: its next one and those finished. Without them, as the showcase
   * draws some states, a running 1:1 shows when it next meets and its template.
   */
  meetings?: OneOnOneMeetings;
  /** What Write as Feedback and Give Kudos need, from a finished meeting. */
  compose?: PastMeetingsCompose;
};

/** The reader's own account id: whichever of the two the 1:1 is not "with". */
function readerAccountOf(oneOnOne: OneOnOne): string {
  return oneOnOne.startedByAccountId === oneOnOne.withAccountId
    ? oneOnOne.invitedAccountId
    : oneOnOne.startedByAccountId;
}

/**
 * The heading every state of an open 1:1 is named by, which a press in the list focuses. It carries
 * the 1:1's id, so two panels on one page, as the showcase draws them, never share one.
 */
function headingIdOf(oneOnOne: OneOnOne): string {
  return `one-on-one-heading-${oneOnOne.id}`;
}

/** The panel every state of a 1:1 is drawn on: the page's paper, edged, flat. */
const PANEL =
  'flex min-w-0 flex-col gap-6 rounded-page border border-border-muted bg-surface-base p-inset-card';

type HeadProps = {
  headingId: string;
  person: OneOnOnePerson;
  /** What stands under the name. */
  children: React.ReactNode;
  /** What stands at the row's end, such as the controls. */
  end?: React.ReactNode;
  /** Quieter, for one that is over. */
  isQuiet?: boolean;
};

function Head({
  headingId,
  person,
  children,
  end,
  isQuiet = false,
}: HeadProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <AvatarName
        name={person.name}
        photoUrl={person.photoUrl}
        size="lg"
        avatarClassName={cn(isQuiet && 'opacity-70')}
      >
        <Text
          as="h2"
          variant="subtitle-2"
          id={headingId}
          tabIndex={-1}
          className="focus:outline-none"
        >
          {person.name}
        </Text>
        <Text as="p" variant="body-3" tone="muted">
          {children}
        </Text>
      </AvatarName>
      {end}
    </div>
  );
}

/** Somebody's own words, in the orange of a person's voice, quoted under who wrote them. */
function TheirWords({ who, words }: { who: string; words: string }) {
  return (
    <figure className="flex flex-col gap-1 border-action-secondary-border border-s ps-4">
      <Text as="figcaption" variant="body-3" tone="muted">
        {who} wrote
      </Text>
      <blockquote>
        <Text as="p" variant="body-2">
          {words}
        </Text>
      </blockquote>
    </figure>
  );
}

function templateOf(
  schedule: OneOnOneSchedule,
  templates: readonly OneOnOneTemplate[],
): OneOnOneTemplate | undefined {
  return templates.find((template) => template.key === schedule.templateKey);
}

/** "Weekly on Thursday at 10:00, 30 minutes", or "Once, on Wed 2 Dec at 11:00, 30 minutes". */
function scheduleLine(schedule: OneOnOneSchedule): string {
  return `${describeSchedule(schedule)}, ${schedule.lengthMinutes} minutes`;
}

/** A running 1:1: when it next meets, and its meetings, next and past. */
function Running({
  oneOnOne,
  person,
  schedule,
  workspaceId,
  templates,
  teammates,
  meetings,
  compose,
}: {
  oneOnOne: OneOnOne;
  person: OneOnOnePerson;
  schedule: OneOnOneSchedule;
  workspaceId: string;
  templates: readonly OneOnOneTemplate[];
  teammates: readonly Teammate[];
  meetings?: OneOnOneMeetings;
  compose?: PastMeetingsCompose;
}) {
  const template = templateOf(schedule, templates);
  const headingId = headingIdOf(oneOnOne);
  const once = isOnce(oneOnOne);
  const reader = readerAccountOf(oneOnOne);
  const people: MeetingPeople = {
    readerAccountId: reader,
    otherAccountId: person.accountId,
    otherName: person.shortName,
  };
  return (
    <section aria-labelledby={headingId} className={PANEL}>
      <Head
        headingId={headingId}
        person={person}
        end={
          <RunningControls
            workspaceId={workspaceId}
            oneOnOneId={oneOnOne.id}
            shortName={person.shortName}
            isOnce={once}
            schedule={schedule}
            templates={templates}
          />
        }
      >
        {scheduleLine(schedule)}
      </Head>
      {meetings ? (
        <Tabs
          defaultValue="next"
          className="border-border-subtle border-t pt-4"
        >
          <TabsList aria-label="Meetings">
            <TabsTrigger value="next">
              {meetings.next.meeting?.state === 'IN_PROGRESS'
                ? 'This meeting'
                : 'Next meeting'}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past meetings
              {meetings.past.length > 0 && (
                <span className="text-fg-muted tabular-nums">
                  {meetings.past.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="next">
            <NextMeeting
              workspaceId={workspaceId}
              oneOnOneId={oneOnOne.id}
              next={meetings.next}
              nextMeetingAt={oneOnOne.nextMeetingAt}
              lengthMinutes={schedule.lengthMinutes}
              people={people}
            />
          </TabsContent>
          <TabsContent value="past">
            <PastMeetings
              meetings={meetings.past}
              other={teammates.find(
                (teammate) => teammate.accountId === person.accountId,
              )}
              compose={compose}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-x-8 gap-y-6 border-border-subtle border-t pt-6 md:grid-cols-5">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Text as="h3" variant="label" tone="muted">
              {once ? 'Meeting' : 'Next meeting'}
            </Text>
            <Text
              as="p"
              variant="display-6"
              className="flex items-center gap-2 tabular-nums"
            >
              <CalendarClockIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-fg-accent"
              />
              {oneOnOne.nextMeetingAt
                ? describeMeeting(oneOnOne.nextMeetingAt)
                : 'Not set'}
            </Text>
            <Text as="p" variant="body-3" tone="muted">
              Bangkok time · {schedule.lengthMinutes} minutes
            </Text>
          </div>
          {template && (
            <div className="flex flex-col gap-2 md:col-span-3">
              <Text as="h3" variant="label" tone="muted">
                The agenda starts from {template.name}
              </Text>
              <ul className="flex list-disc flex-col gap-1.5 ps-5 marker:text-fg-muted">
                {template.questions.map((question) => (
                  <li key={question}>
                    <Text as="span" variant="body-2">
                      {question}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Whether the panel draws it running: an accepted 1:1 not yet met, which includes a one-time 1:1
 * whose meeting was started and is not finished, as the list counts it too.
 */
function isDrawnRunning(oneOnOne: OneOnOne): boolean {
  return oneOnOne.status === 'ACTIVE' && !isMet(oneOnOne);
}

/**
 * The 1:1 open beside the list, drawn for where it stands and who sent the invitation. Once it runs,
 * the two people in it are equal. One sent to the reader is drawn like the rest, on the same flat
 * panel: an invitation saying when it would meet, what the sender would like
 * to talk about, before they answer. Its heading takes focus when the 1:1 is opened from the list,
 * and when a change to it takes away the control that was pressed.
 */
export function OneOnOnePanel(props: OneOnOnePanelProps) {
  const { oneOnOne, meetings } = props;
  const headingId = headingIdOf(oneOnOne);
  const stateKey = [
    oneOnOne.status,
    isDrawnRunning(oneOnOne) ? 'running' : 'still',
    meetings?.next.meeting?.state ?? 'unopened',
    meetings?.past.length ?? 0,
  ].join(':');
  return (
    <>
      <FocusOnArrive oneOnOneId={oneOnOne.id} headingId={headingId} />
      <RefocusWhenLost headingId={headingId} stateKey={stateKey} />
      <PanelBody {...props} />
    </>
  );
}

/** The panel for where the 1:1 stands. */
function PanelBody({
  oneOnOne,
  workspaceId,
  teammates,
  templates,
  meetings,
  compose,
}: OneOnOnePanelProps) {
  const person = otherPersonOf(oneOnOne, teammates);
  const schedule = oneOnOne.schedule;
  const control = {
    workspaceId,
    oneOnOneId: oneOnOne.id,
    shortName: person.shortName,
  };
  const headingId = headingIdOf(oneOnOne);
  const group = groupOf(oneOnOne);

  if (isDrawnRunning(oneOnOne)) {
    return (
      <>
        <Running
          oneOnOne={oneOnOne}
          person={person}
          schedule={schedule}
          workspaceId={workspaceId}
          templates={templates}
          teammates={teammates}
          meetings={meetings}
          compose={compose}
        />
      </>
    );
  }

  if (group === 'past') {
    // A meeting held once is met once its time is over, or cancelled if it was ended before.
    const line = isMet(oneOnOne)
      ? `Met on ${describeDay(schedule.startsOn)} at ${timeOf(schedule.startMinute)}`
      : isOnce(oneOnOne)
        ? `Cancelled${oneOnOne.endedAt ? ` on ${describeCalendarDay(oneOnOne.endedAt)}` : ''} · it was set for ${describeDay(schedule.startsOn)}`
        : `Schedule ended${oneOnOne.endedAt ? ` on ${describeCalendarDay(oneOnOne.endedAt)}` : ''} · it met ${describeSchedule(schedule).toLowerCase()}`;
    return (
      <section aria-labelledby={headingId} className={PANEL}>
        <Head headingId={headingId} person={person} isQuiet>
          {line}
        </Head>
        {meetings && meetings.past.length > 0 ? (
          <div className="flex flex-col gap-3 border-border-subtle border-t pt-4">
            <Text as="h3" variant="subtitle-4">
              Past meetings{' '}
              <span className="font-normal text-body-3 text-fg-muted tabular-nums">
                {meetings.past.length}
              </span>
            </Text>
            <PastMeetings
              meetings={meetings.past}
              other={teammates.find(
                (teammate) => teammate.accountId === person.accountId,
              )}
              compose={compose}
            />
          </div>
        ) : (
          <Text as="p" variant="body-2" tone="muted" className="max-w-2xl">
            No more meetings are kept, and none was finished in it.
          </Text>
        )}
      </section>
    );
  }

  if (group === 'declined') {
    return (
      <section aria-labelledby={headingId} className={PANEL}>
        <Head headingId={headingId} person={person} isQuiet>
          Declined your invitation
          {oneOnOne.answeredAt &&
            ` on ${describeCalendarDay(oneOnOne.answeredAt)}`}
        </Head>
        {oneOnOne.answerNote && (
          <TheirWords who={person.shortName} words={oneOnOne.answerNote} />
        )}
        <Text as="p" variant="body-2" tone="muted" className="max-w-2xl">
          Nothing was started for either of you.
          {oneOnOne.answeredAt &&
            ` This leaves your list on ${leavesListOn(oneOnOne.answeredAt)}.`}
        </Text>
      </section>
    );
  }

  if (startedByReader(oneOnOne)) {
    // Sent by the person, waiting on the other: what they sent, and taking it back.
    return (
      <section aria-labelledby={headingId} className={PANEL}>
        <Head
          headingId={headingId}
          person={person}
          end={<Withdraw {...control} />}
        >
          <StatusText tone="warning">Waiting</StatusText> for {person.shortName}{' '}
          to answer your {wasSuggested(oneOnOne) ? 'suggestion' : 'invitation'}
        </Head>
        <Text as="p" variant="body-2" tone="muted" className="max-w-2xl">
          {isOnce(oneOnOne)
            ? `${scheduleLine(schedule)}, once ${person.shortName} accepts.`
            : `${scheduleLine(schedule)}, starting ${describeDay(schedule.startsOn)} once ${person.shortName} accepts.`}
        </Text>
        {oneOnOne.inviteNote && (
          <TheirWords who="You" words={oneOnOne.inviteNote} />
        )}
      </section>
    );
  }

  // Sent to the person: an invitation to answer, or one they sent sent back with another time.
  const suggested = wasSuggested(oneOnOne);
  return (
    <section aria-labelledby={headingId} className={PANEL}>
      <Head headingId={headingId} person={person}>
        <span className="font-medium text-fg-accent">
          {suggested ? 'Suggests another time' : 'Invites you'}
        </span>
      </Head>
      <div className="flex max-w-2xl flex-col gap-3">
        <Text as="p" variant="subtitle-3">
          {suggested
            ? `${person.shortName} can’t make the time you sent, and suggests another.`
            : isOnce(oneOnOne)
              ? `${person.shortName} would like a 1:1 with you, just once.`
              : `${person.shortName} would like a regular 1:1 with you.`}
        </Text>
        <Text as="p" variant="body-2" tone="muted">
          {isOnce(oneOnOne)
            ? `${scheduleLine(schedule)}. Nothing is set until you accept.`
            : `${scheduleLine(schedule)}, starting ${describeDay(schedule.startsOn)}. Nothing starts until you accept, and either of you can change it after.`}
        </Text>
        {oneOnOne.inviteNote && (
          <TheirWords who={person.shortName} words={oneOnOne.inviteNote} />
        )}
      </div>
      <AnswerInvitation
        {...control}
        schedule={schedule}
        templates={templates}
        wasSuggested={suggested}
      />
    </section>
  );
}
