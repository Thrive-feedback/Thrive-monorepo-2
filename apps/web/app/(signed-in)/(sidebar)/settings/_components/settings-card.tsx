import { useId } from 'react';
import { Text } from '@/components/atoms/text';

export type SettingsCardProps = {
  /** Names the group. A card of one plain row, such as Sign out, needs none. */
  title?: string;
  /** A muted line under the title, saying what the group is for. */
  description?: string;
  /** Drawn at the end of the title's row, such as a way to close the card. */
  action?: React.ReactNode;
  /** For something to send focus to the title when the card opens, with `tabIndex` of -1. */
  titleRef?: React.Ref<HTMLHeadingElement>;
  /** Its rows, divided from each other by a line. */
  children: React.ReactNode;
};

/**
 * One group of settings, in the box Home's composer is drawn in: an edge in the muted line, the
 * page's corner, and its rows divided inside it. A titled card is a region named by its title, so
 * the groups can be found by heading or landmark; Settings never puts one card inside another.
 */
export function SettingsCard({
  title,
  description,
  action,
  titleRef,
  children,
}: SettingsCardProps) {
  const titleId = useId();
  const Box = title ? 'section' : 'div';

  return (
    <Box
      aria-labelledby={title ? titleId : undefined}
      className="flex flex-col rounded-page border border-border-muted"
    >
      {title && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div className="flex flex-col gap-1">
            <Text
              as="h2"
              variant="subtitle-3"
              id={titleId}
              ref={titleRef}
              tabIndex={titleRef ? -1 : undefined}
            >
              {title}
            </Text>
            {description && (
              <Text as="p" variant="body-3" tone="muted">
                {description}
              </Text>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="flex flex-col divide-y divide-border-subtle px-6 py-1">
        {children}
      </div>
    </Box>
  );
}
