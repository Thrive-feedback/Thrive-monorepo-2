import { NOTIFICATION_KINDS } from '@/app/ui-showcase/notifications/_lib/notification-kinds.constant';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { notificationLine } from '@/lib/notifications/notification-copy.constant';

/** The page's own content, drawn as bars because only where the line lands matters here. */
const PAGE_ROWS = ['w-full', 'w-5/6', 'w-11/12', 'w-2/3'] as const;

export type LandingPreviewProps = {
  /** The line last pressed in the sample bell, or null before any has been. */
  notification: BellNotification | null;
};

/**
 * Where the last pressed bell line would have taken its reader: the address its link points at,
 * the page that address is, the filter that page opens on and what opens over it. A sketch in a
 * browser's frame rather than the page itself, because the pages need an Account behind them.
 *
 * What it says is announced as it changes, since the panel that was pressed has just closed.
 */
export function LandingPreview({ notification }: LandingPreviewProps) {
  const line = notification === null ? null : notificationLine(notification);
  const kind =
    notification === null ? null : NOTIFICATION_KINDS[notification.type];
  const landing = kind?.landsOn ?? null;

  return (
    <figure
      aria-label="Where the pressed line lands"
      className="flex w-full max-w-120 flex-col gap-2"
    >
      <div className="flex flex-col overflow-hidden rounded-container border border-border-default bg-surface-base">
        <div className="flex items-center gap-3 border-border-default border-b bg-surface-subtle px-3 py-2">
          <span aria-hidden="true" className="flex shrink-0 gap-1">
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
          </span>
          <Text
            as="span"
            variant="code"
            tone={line === null ? 'muted' : 'default'}
            className="min-w-0 flex-1 truncate rounded-control bg-surface-raised px-2 py-1"
          >
            {line === null ? 'No line pressed yet' : line.destination}
          </Text>
        </div>
        <div className="relative flex min-h-56 flex-col gap-3 p-4">
          {landing === null ? (
            <Text
              variant="body-2"
              tone="muted"
              className="m-auto max-w-64 text-center"
            >
              Press a line in the sample bell to see the page it opens.
            </Text>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Text as="span" variant="subtitle-2">
                  {landing.page}
                </Text>
                {landing.showing && (
                  <Badge tone="brand">{landing.showing}</Badge>
                )}
              </div>
              <div aria-hidden="true" className="flex flex-col gap-2">
                {PAGE_ROWS.map((width) => (
                  <span
                    key={width}
                    className={cn(
                      'h-6 rounded-element bg-surface-subtle',
                      width,
                    )}
                  />
                ))}
              </div>
              {landing.overIt && (
                <div className="absolute inset-x-8 top-14 flex flex-col gap-1 rounded-surface border border-border-default bg-surface-raised p-4 shadow-high">
                  <Text as="span" variant="overline" tone="muted">
                    Open over the page
                  </Text>
                  <Text as="span" variant="body-2">
                    {landing.overIt}
                  </Text>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Text as="figcaption" variant="caption" tone="muted" aria-live="polite">
        {line === null || kind === null
          ? 'Where a pressed line lands shows here, in place of following its link.'
          : `“${line.sentence}” opens ${kind.opens}`}
      </Text>
    </figure>
  );
}
