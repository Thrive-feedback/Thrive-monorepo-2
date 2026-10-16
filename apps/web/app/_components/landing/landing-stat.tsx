import { Text } from '@/components/atoms/text';

export type LandingStatProps = {
  figure: string;
  claim: string;
  source: string;
};

/** One research finding: the figure, what it measures, and who measured it, never apart. */
export function LandingStat({ figure, claim, source }: LandingStatProps) {
  return (
    <figure className="flex flex-col gap-2 rounded-page bg-surface-raised p-inset-card">
      <Text as="p" variant="display-3" className="text-action-secondary">
        {figure}
      </Text>
      <Text as="p" variant="body-1">
        {claim}
      </Text>
      <Text as="figcaption" variant="caption" tone="muted">
        Source: {source}
      </Text>
    </figure>
  );
}
