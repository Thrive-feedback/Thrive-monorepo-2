import { CornerDownRightIcon } from 'lucide-react';
import type { Meeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { Text } from '@/components/atoms/text';

/** The two people in a 1:1, as plain data, so a server component can hand them to a client one. */
export type MeetingPeople = {
  readonly readerAccountId: string;
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

/**
 * What a meeting came to, as both read it once it is finished: each topic talked about with the
 * note on it, and what was not reached and so carries over.
 */
export function MeetingSummary({ meeting }: { meeting: Meeting }) {
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
              <Text as="h4" variant="subtitle-4">
                {topic.text}
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
          <Text as="h4" variant="label" tone="muted">
            Carries over to next time
          </Text>
          <ul className="flex flex-col gap-1">
            {carried.map((topic) => (
              <li key={topic.id} className="flex items-center gap-2">
                <CornerDownRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-fg-muted"
                />
                <Text as="span" variant="body-2" tone="muted">
                  {topic.text}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
