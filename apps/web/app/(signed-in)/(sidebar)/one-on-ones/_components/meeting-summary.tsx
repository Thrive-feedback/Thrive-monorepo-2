import { CornerDownRightIcon } from 'lucide-react';
import { TopicText } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/topic-text';
import type {
  Meeting,
  MeetingTopic,
  TemplateName,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { describeDay } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Text } from '@/components/atoms/text';

/** The two people in a 1:1, as plain data, so a server component can hand them to a client one. */
export type MeetingPeople = {
  readonly readerAccountId: string;
  /** The reader's first name, for words both people read, which never say "you". */
  readonly readerName: string;
  readonly otherAccountId: string;
  /** The other person's first name. */
  readonly otherName: string;
};

/** How the page names one of the two: "You" for the reader, a first name for the other. */
export function nameOf(
  people: MeetingPeople,
  accountId: string | null,
): string {
  if (accountId === people.readerAccountId) {
    return 'You';
  }
  return accountId === people.otherAccountId ? people.otherName : 'Someone';
}

/** What a topic says of where it came from: how it was put on the agenda. */
export type TopicOrigin = Pick<
  MeetingTopic,
  'source' | 'authorAccountId' | 'broughtFrom' | 'templateKey'
>;

/**
 * Where a topic came from, said quietly beside it wherever an agenda is read: the template that asked
 * it by name, what it was brought from before the meeting, last time, or who added it. One written for
 * a meeting day that was then skipped says so first. A template's name comes from `templates`; one
 * stored before topics named theirs has only `templateName`, the meeting's.
 */
export function topicSourceOf(
  origin: TopicOrigin,
  {
    templates,
    templateName = null,
    people,
    carriedFrom = null,
  }: {
    readonly templates: readonly TemplateName[];
    readonly templateName?: string | null;
    readonly people: MeetingPeople;
    readonly carriedFrom?: string | null;
  },
): string {
  if (carriedFrom) {
    return `From ${describeDay(carriedFrom)} (skipped)`;
  }
  switch (origin.broughtFrom?.kind) {
    case 'FEEDBACK':
      return 'From Feedback';
    case 'KUDOS':
      return 'From Kudos';
    case 'ASK':
      return 'From an open ask';
  }
  switch (origin.source) {
    case 'CARRIED':
      return 'From last time';
    case 'TEMPLATE': {
      const name =
        templates.find((template) => template.key === origin.templateKey)
          ?.name ?? templateName;
      return name ? `From ${name}` : 'From a template';
    }
    default:
      return `Added by ${nameOf(people, origin.authorAccountId)}`;
  }
}

export type MeetingSummaryProps = {
  meeting: Meeting;
  people: MeetingPeople;
  /** What each template its topics came from is called. */
  templates: readonly TemplateName[];
  /**
   * The level its own headings take, one under whatever it sits beneath: `h4` under a meeting in
   * Past meetings, `h3` under the Finish dialog's title.
   */
  headingLevel?: 'h3' | 'h4';
};

/**
 * What a meeting came to, as both read it once it is finished: each topic talked about with the
 * note on it, and what was not reached and so carries over, each saying where it came from.
 */
export function MeetingSummary({
  meeting,
  people,
  templates,
  headingLevel = 'h4',
}: MeetingSummaryProps) {
  const sourceOf = (topic: MeetingTopic) =>
    topicSourceOf(topic, { templates, people });
  const discussed = meeting.topics.filter((topic) => topic.discussedAt);
  const carried = meeting.topics.filter((topic) => !topic.discussedAt);
  return (
    <div className="flex flex-col gap-5">
      {discussed.length > 0 ? (
        <ol className="flex flex-col">
          {discussed.map((topic) => (
            <li
              key={topic.id}
              className="flex flex-col gap-1.5 border-border-subtle border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <Text as={headingLevel} variant="subtitle-4">
                <TopicText text={topic.text} />{' '}
                {/* Read apart from the topic's own words, which may name where it came from too. */}
                <span className="sr-only">, </span>
                <span className="whitespace-nowrap font-normal text-body-3 text-fg-muted">
                  {sourceOf(topic)}
                </span>
              </Text>
              {topic.notes ? (
                // What was said reads in full ink, set off from the topic by a hairline.
                <Text
                  as="p"
                  variant="body-2"
                  className="max-w-prose whitespace-pre-wrap border-border-muted border-s ps-3"
                >
                  {topic.notes}
                </Text>
              ) : (
                <Text as="p" variant="body-3" tone="muted">
                  No notes.
                </Text>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <Text as="p" variant="body-2" tone="muted">
          No topics were ticked.
        </Text>
      )}
      {carried.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Text as={headingLevel} variant="label" tone="muted">
            Carries over to next time
          </Text>
          <ul className="flex flex-col gap-1">
            {carried.map((topic) => (
              <li key={topic.id} className="flex items-start gap-2">
                <CornerDownRightIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-fg-muted"
                />
                <Text as="span" variant="body-2" tone="muted">
                  <TopicText text={topic.text} />{' '}
                  <span className="sr-only">, </span>
                  <span className="whitespace-nowrap text-body-3">
                    {sourceOf(topic)}
                  </span>
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
