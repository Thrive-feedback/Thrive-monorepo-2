import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { TimeAgo } from '@/components/atoms/time-ago';

const HOUR = 60 * 60 * 1000;

const CASES: readonly { label: string; hoursAgo: number }[] = [
  { label: 'Just now', hoursAgo: 0 },
  { label: 'Hours', hoursAgo: 3 },
  { label: 'Yesterday', hoursAgo: 25 },
  { label: 'Weeks', hoursAgo: 24 * 15 },
  { label: 'Months', hoursAgo: 24 * 70 },
];

export function TimeAgoEntry() {
  const now = Date.now();

  return (
    <ShowcaseEntry
      name="TimeAgo"
      level="atom"
      origin="thrive"
      source="components/atoms/time-ago.tsx"
      summary="How long ago something happened, with the day itself on a hover."
      useFor="When something happened, on any card of the new Home."
      avoidFor="A postmark, which prints the day, or a date someone has to act on."
      usage={`import { TimeAgo } from '@/components/atoms/time-ago';

<TimeAgo dateTime={item.givenAt} />`}
      props={[
        {
          name: 'dateTime',
          type: 'string',
          description: 'When it happened, as an ISO date.',
        },
      ]}
      accessibility={['A time element, so the exact moment stays in the page.']}
    >
      {CASES.map(({ label, hoursAgo }) => (
        <StateCell key={label} label={label}>
          <TimeAgo dateTime={new Date(now - hoursAgo * HOUR).toISOString()} />
        </StateCell>
      ))}
    </ShowcaseEntry>
  );
}

export function TimeAgoPreview() {
  return <TimeAgo dateTime="2026-10-31T03:00:00.000Z" />;
}
