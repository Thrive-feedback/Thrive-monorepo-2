import { Text } from '@/components/atoms/text';

export type PageLeadProps = {
  children: React.ReactNode;
};

/**
 * The line under a page's title that says what the page holds, the same on every page beside the
 * sidebar: muted body-1, a step under the title (`gap-1` in the head that holds both).
 */
export function PageLead({ children }: PageLeadProps) {
  return (
    <Text as="p" variant="body-1" tone="muted">
      {children}
    </Text>
  );
}
