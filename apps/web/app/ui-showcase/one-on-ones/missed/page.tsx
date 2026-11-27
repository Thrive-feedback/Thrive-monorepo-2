import type { Metadata } from 'next';
import { GallerySection } from '@/app/ui-showcase/_components/gallery-section';
import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
import { Text } from '@/components/atoms/text';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { MissedCaseTable } from './_components/missed-case-table';
import { MissedSimulator } from './_components/missed-simulator';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Missed 1:1s',
    description:
      'What a 1:1 shows when a meeting day passes without anyone pressing Start, in every case.',
    robots: { index: false, follow: false },
  };
}

const RULES = [
  'A meeting whose day passed unstarted is overdue until the next meeting day. Either of you can still start it, late, and it is that day’s meeting.',
  'When the next day comes and it was never started, it is skipped. Its agenda, topics and template, moves to the new day.',
  'The schedule never moves: after a late meeting, the next is the next day on the schedule.',
  'Starting before a day is that day’s meeting, early. Never two in one round.',
  'Every skipped day shows in Past meetings, worked out from the schedule; skips in a row share one line.',
  'A meeting held once is overdue for seven days, then skipped, in History.',
  'Changing the schedule while overdue skips that day at once; its agenda moves to the new first day. Ending it skips that day too.',
  'Overdue is said on the page only. Nobody is notified.',
] as const;

/**
 * Every way a missed meeting plays out, as a simulator to play with and as a table of every case,
 * both from one set of rules (`missed-meeting.model.ts`): the spec the API and the 1:1 panel follow.
 */
export default async function MissedOneOnOnesPage() {
  await requireUiShowcaseAccess();
  return (
    <ShowcasePage
      title="Missed 1:1s"
      description="The rules the 1:1s follow, as built, to play with and to check every case against. A 1:1 with Mint that meets on Tuesdays from Tue 1 Dec 2026, so weekly it meets on the 1st, the 8th, the 15th: what its card, its next meeting and Past meetings show when a meeting day passes without anyone pressing Start."
    >
      <GallerySection title="The rules">
        <ul className="flex max-w-3xl list-disc flex-col gap-1.5 ps-5 marker:text-fg-muted">
          {RULES.map((rule) => (
            <li key={rule}>
              <Text as="span" variant="body-2">
                {rule}
              </Text>
            </li>
          ))}
        </ul>
      </GallerySection>

      <GallerySection
        title="Simulator"
        description="Pick how often it meets, step the day, and act as either of you would. Start from any case below to see how it got there."
      >
        <div className="max-w-4xl">
          <MissedSimulator />
        </div>
      </GallerySection>

      <GallerySection
        title="Every case"
        description="By how often it meets. Each is the simulator's answer for that day, so the two never disagree."
      >
        <div className="max-w-4xl">
          <MissedCaseTable />
        </div>
      </GallerySection>
    </ShowcasePage>
  );
}
