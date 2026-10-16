import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { platform } = LANDING_COPY;

/** The whole of what Thrive is building towards, Feedback first. */
export function LandingPlatform() {
  return (
    <LandingSection
      id="platform"
      eyebrow={platform.eyebrow}
      title={platform.title}
      lead={platform.lead}
    >
      <ul className="grid gap-gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {platform.features.map((feature) => (
          <li
            key={feature.title}
            className="flex flex-col gap-2 rounded-page border border-border-subtle p-inset-card"
          >
            <Text as="h3" variant="subtitle-2">
              {feature.title}
            </Text>
            <Text variant="body-2" tone="muted">
              {feature.body}
            </Text>
          </li>
        ))}
      </ul>
      <Text variant="body-1" tone="muted" className="max-w-2xl">
        {platform.next}
      </Text>
    </LandingSection>
  );
}
