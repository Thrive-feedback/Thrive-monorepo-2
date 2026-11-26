import type { OneOnOne } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { inListOrder } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-state.util';
import { OneOnOnePanel } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-one-panel';
import { OneOnOneStrip } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-one-strip';
import { OneOnOnesCreate } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-ones-create';
import { OneOnOnesEmpty } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-ones-empty';
import { GallerySection } from '@/app/ui-showcase/_components/gallery-section';
import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
import {
  SAMPLE_NEXT_MEETINGS,
  SAMPLE_ONE_ON_ONE_LIST,
  SAMPLE_ONE_ON_ONE_TEAMMATES,
  SAMPLE_ONE_ON_ONE_TEMPLATES,
  SAMPLE_ONE_ON_ONES,
  SAMPLE_ONE_ON_ONES_MORE,
  SAMPLE_PAST_MEETINGS,
  SAMPLE_TODAY,
  SAMPLE_UNAVAILABLE,
  SAMPLE_UPCOMING_ONLY,
} from '@/app/ui-showcase/one-on-ones/_lib/one-on-one-samples.constant';
import { Text } from '@/components/atoms/text';

/** No Workspace is read here; the actions it calls answer with an error, as nobody is signed in. */
const SAMPLE_WORKSPACE_ID = '0196b4c8-0000-7000-8000-0000000000ff';

/** One case of the open 1:1, captioned with which side the reader is on and where it stands. */
function Case({
  title,
  note,
  oneOnOne,
}: {
  title: string;
  note: string;
  oneOnOne: OneOnOne;
}) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-col gap-0.5">
        <Text as="h3" variant="subtitle-3">
          {title}
        </Text>
        <Text as="p" variant="body-3" tone="muted">
          {note}
        </Text>
      </figcaption>
      <OneOnOnePanel
        oneOnOne={oneOnOne}
        workspaceId={SAMPLE_WORKSPACE_ID}
        teammates={SAMPLE_ONE_ON_ONE_TEAMMATES}
        templates={SAMPLE_ONE_ON_ONE_TEMPLATES}
      />
    </figure>
  );
}

const CASES: readonly {
  readonly group: string;
  readonly description: string;
  readonly cases: readonly {
    readonly title: string;
    readonly note: string;
    readonly oneOnOne: OneOnOne;
  }[];
}[] = [
  {
    group: 'Needs your answer',
    description:
      'Sent to the reader, on the same flat panel as every state, with the sender’s note in the orange of a person’s voice, before anyone answers. Decline asks first and takes a note, or turns into Suggest another time, which sends it back with a new one.',
    cases: [
      {
        title: 'Invitation, with a note',
        note: 'Elena says what she would like to talk about.',
        oneOnOne: SAMPLE_ONE_ON_ONES.invitedWithNote,
      },
      {
        title: 'Invitation, without a note',
        note: 'Femi sent the schedule alone.',
        oneOnOne: SAMPLE_ONE_ON_ONES.invitedWithoutNote,
      },
      {
        title: 'Invitation, just once',
        note: 'Sam is new and asks for one meeting on a date, not a schedule.',
        oneOnOne: SAMPLE_ONE_ON_ONES_MORE.onceInvitation,
      },
      {
        title: 'Another time suggested',
        note: 'You invited Omar; he sent it back with Tuesday afternoons. Accept this time, or decline or suggest again.',
        oneOnOne: SAMPLE_ONE_ON_ONES_MORE.suggestedToYou,
      },
    ],
  },
  {
    group: 'Running',
    description:
      'When it next meets and what its agenda starts from. The two are equal: either changes the schedule, which holds at once, and either ends it, which asks first.',
    cases: [
      {
        title: 'Running · weekly',
        note: 'You sent the invitation; it makes no difference now.',
        oneOnOne: SAMPLE_ONE_ON_ONES.runningWeekly,
      },
      {
        title: 'Running · monthly',
        note: 'Grace sent it. On the second Friday, from Feedback both ways.',
        oneOnOne: SAMPLE_ONE_ON_ONES.runningMonthly,
      },
      {
        title: 'Running · every two weeks',
        note: '45 minutes, from the Career conversation template.',
        oneOnOne: SAMPLE_ONE_ON_ONES.runningEveryTwoWeeks,
      },
      {
        title: 'Running · just once',
        note: 'One meeting with Tom. Change time and Cancel meeting instead of the schedule’s controls.',
        oneOnOne: SAMPLE_ONE_ON_ONES_MORE.onceUpcoming,
      },
    ],
  },
  {
    group: 'Waiting on them',
    description:
      'Sent by the reader and not answered yet, with what they wrote. Withdraw asks first.',
    cases: [
      {
        title: 'Your invitation, waiting',
        note: 'Dev has not answered.',
        oneOnOne: SAMPLE_ONE_ON_ONES.yourInvitationWaiting,
      },
      {
        title: 'Your suggestion, waiting',
        note: 'Priya invited you; you sent it back with Friday mornings.',
        oneOnOne: SAMPLE_ONE_ON_ONES_MORE.yourSuggestionWaiting,
      },
    ],
  },
  {
    group: 'Declined',
    description:
      'Quiet, never red: the date it was turned down, the note if one was written, and the day it leaves the list.',
    cases: [
      {
        title: 'Declined, with a note',
        note: 'Hugo turned down your invitation.',
        oneOnOne: SAMPLE_ONE_ON_ONES.declinedWithNote,
      },
      {
        title: 'Declined, without a note',
        note: 'Jun turned it down and wrote nothing.',
        oneOnOne: SAMPLE_ONE_ON_ONES.declinedWithoutNote,
      },
    ],
  },
  {
    group: 'Ended',
    description:
      'In the History tab: a schedule ended, or a meeting held once that has met. Kept for both people to look back on.',
    cases: [
      {
        title: 'Schedule ended',
        note: 'Nothing to do; what was written in it stays readable.',
        oneOnOne: SAMPLE_ONE_ON_ONES.ended,
      },
      {
        title: 'Met once',
        note: 'Ana’s one meeting is over, so it moved here by itself.',
        oneOnOne: SAMPLE_ONE_ON_ONES_MORE.onceMet,
      },
    ],
  },
];

/**
 * Every case of the 1:1s page on sample data (brain ADR-0060, proposed): the list in all its groups,
 * the open 1:1 in each state, the one way to begin, its meetings and the empty page. The real
 * components, at about the widths the page gives them.
 */
export function OneOnOneGallery() {
  return (
    <ShowcasePage
      title="1:1s"
      description={
        <>
          Every state of a 1:1 on sample data. Buttons open their dialogs as in
          the app; sending calls the real actions, which answer with an error
          here, since nobody is signed in.
        </>
      }
    >
      <GallerySection
        title="Create a 1:1"
        description="At the head of the page, the one way to begin. A two-step dialog: who it is with, with Mint and Dev greyed and the reason said; then when it meets, its template and an optional note."
      >
        <OneOnOnesCreate
          workspaceId={SAMPLE_WORKSPACE_ID}
          teammates={SAMPLE_ONE_ON_ONE_TEAMMATES}
          templates={SAMPLE_ONE_ON_ONE_TEMPLATES}
          unavailable={SAMPLE_UNAVAILABLE}
        />
      </GallerySection>

      <GallerySection
        title="The list"
        description="Up to three tabs, opened on the open 1:1’s. Upcoming: what meets, soonest first, without a heading. Pending: invitations waiting on the reader first, drawn like every card and counted in plum on the tab, then theirs waiting on the other person. History: what was declined and what has ended. Pending and History hide while empty; with Upcoming alone there is no tab bar, just the list (the last one here). From lg a 288px column that scrolls on its own while the page stays put; narrower than lg, each tab is one row that scrolls sideways."
      >
        <div className="flex flex-wrap gap-10">
          {(['upcoming', 'pending', 'history'] as const).map((tab) => (
            <div key={tab} className="w-72 max-w-full">
              <OneOnOneStrip
                oneOnOnes={inListOrder(SAMPLE_ONE_ON_ONE_LIST)}
                selectedId={SAMPLE_ONE_ON_ONES.invitedWithNote.id}
                teammates={SAMPLE_ONE_ON_ONE_TEAMMATES}
                initialTab={tab}
                today={SAMPLE_TODAY}
              />
            </div>
          ))}
          <div className="w-72 max-w-full">
            <OneOnOneStrip
              oneOnOnes={inListOrder(SAMPLE_UPCOMING_ONLY)}
              selectedId={SAMPLE_ONE_ON_ONES.runningWeekly.id}
              teammates={SAMPLE_ONE_ON_ONE_TEAMMATES}
              today={SAMPLE_TODAY}
            />
          </div>
        </div>
      </GallerySection>

      {CASES.map(({ group, description, cases }) => (
        <GallerySection key={group} title={group} description={description}>
          <div className="flex max-w-3xl flex-col gap-10">
            {cases.map((each) => (
              <Case key={each.title} {...each} />
            ))}
          </div>
        </GallerySection>
      ))}

      <GallerySection
        title="Meetings"
        description="A running 1:1's panel: Next meeting and Past meetings. Before anyone writes, the agenda shows what it will open with: what was not reached last time, then the template. Preparing: either person adds, reorders and removes topics (their own, or the template's and last time's). Each topic is one line, with where it came from beside it. In progress: a Discussed tick on each topic, and one topic's note open at a time, starting at the first not talked about; ticking it moves on to the next. Finish shows the summary before sharing it. Past meetings open to their summary; each meeting offers Give and Kudos for the other person, outlined in their voices as a teammate's row does. Start and Finish reach the other person within seconds; notes save themselves and arrive with Sync."
      >
        <div className="flex max-w-3xl flex-col gap-10">
          {(
            [
              [
                'Nothing written yet',
                SAMPLE_NEXT_MEETINGS.untouched,
                '0196b4c8-0000-7000-8000-0000000004a1',
              ],
              [
                'Preparing',
                SAMPLE_NEXT_MEETINGS.preparing,
                '0196b4c8-0000-7000-8000-0000000004a2',
              ],
              [
                'In progress',
                SAMPLE_NEXT_MEETINGS.inProgress,
                '0196b4c8-0000-7000-8000-0000000004a3',
              ],
            ] as const
          ).map(([title, next, id]) => (
            <figure key={title} className="flex flex-col gap-3">
              <figcaption>
                <Text as="h3" variant="subtitle-3">
                  Meeting · {title}
                </Text>
              </figcaption>
              <OneOnOnePanel
                // Its own id per state, so the three panels never share a heading id.
                oneOnOne={{ ...SAMPLE_ONE_ON_ONES.runningWeekly, id }}
                workspaceId={SAMPLE_WORKSPACE_ID}
                teammates={SAMPLE_ONE_ON_ONE_TEAMMATES}
                templates={SAMPLE_ONE_ON_ONE_TEMPLATES}
                meetings={{ next, past: SAMPLE_PAST_MEETINGS }}
              />
            </figure>
          ))}
        </div>
      </GallerySection>

      <GallerySection
        title="Empty page"
        description="The page before the reader has any: what a 1:1 is in Thrive, with Create 1:1 above it."
      >
        <div className="max-w-3xl">
          <OneOnOnesEmpty />
        </div>
      </GallerySection>
    </ShowcasePage>
  );
}
