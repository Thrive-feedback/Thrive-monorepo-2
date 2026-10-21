import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { LANDING_COPY } from './landing-copy.constant';
import { writeOn } from './landing-note';
import { LandingSection } from './landing-section';

const { research } = LANDING_COPY;

/**
 * Each research finding beside what Thrive does because of it. A figure never appears without its
 * source, and never without the choice it explains; it is jotted by hand, and writes itself on.
 */
export function LandingResearch() {
  return (
    <LandingSection id="research" title={research.title} note={research.note}>
      <ul className="flex flex-col">
        {research.findings.map((finding) => (
          <li
            key={finding.figure}
            className="grid gap-4 border-border-muted border-t py-8 md:grid-cols-3 md:gap-gap-grid"
          >
            <Text
              as="p"
              variant="display-1"
              className={cn(
                'w-fit font-handwrite text-action-secondary-hover',
                writeOn,
              )}
            >
              {finding.figure}
            </Text>
            <div className="flex flex-col gap-3 md:col-span-2">
              <Text variant="subtitle-1">{finding.claim}</Text>
              <Text variant="body-3" tone="muted">
                Source: {finding.source}
              </Text>
              <Text variant="subtitle-2" tone="muted">
                {finding.inThrive}
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
