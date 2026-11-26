import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
import { FEATURE_FLAG_ENTRIES } from '@/app/ui-showcase/feature-flags/_lib/feature-flag-catalog.constant';
import { StatusText } from '@/components/atoms/status-text';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table';
import { Text } from '@/components/atoms/text';
import type { FeatureFlags } from '@/lib/feature-flags/feature-flags.type';

export type FeatureFlagsGalleryProps = {
  /** What the deployment answered just now, or `null` when the API could not say. */
  flags: FeatureFlags | null;
};

/** A flag's state as a word: On in the colour of done, Off plain, Unknown when nothing was read. */
function FlagState({ isOn }: { isOn: boolean | undefined }) {
  if (isOn === undefined) {
    return <StatusText tone="warning">Unknown</StatusText>;
  }
  return isOn ? (
    <StatusText tone="success">On</StatusText>
  ) : (
    <Text as="span" variant="body-2" tone="muted" className="font-medium">
      Off
    </Text>
  );
}

/**
 * Every flag this deployment can switch, with what it answered for each when the page was opened
 * (ADR 0087). When the API could not say, the page says so and every state reads Unknown, because
 * the pages themselves treat a failed read as off, and showing Off here would hide the failure.
 */
export function FeatureFlagsGallery({ flags }: FeatureFlagsGalleryProps) {
  return (
    <ShowcasePage
      title="Feature flags"
      description={
        <>
          <p>
            What this deployment has switched on, read from its API when the
            page opened. Reload the page to read it again.
          </p>
          <p>
            A flag is a variable of <Text variant="code">thrive-api</Text>: set
            it to <Text variant="code">true</Text> or{' '}
            <Text variant="code">false</Text> and redeploy the API to change it.
            Left out, it is off.
          </p>
        </>
      }
    >
      {flags === null && (
        <Text role="status">
          <StatusText tone="error">
            Couldn’t read the flags from the API.
          </StatusText>{' '}
          Each page treats that as every flag off, so that is what visitors see
          now.
        </Text>
      )}
      <Table aria-label="Feature flags">
        <TableHeader>
          <TableRow>
            <TableHead>Flag</TableHead>
            <TableHead>State</TableHead>
            <TableHead>On</TableHead>
            <TableHead>Off</TableHead>
            <TableHead>Pages</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURE_FLAG_ENTRIES.map((entry) => (
            <TableRow key={entry.key}>
              <TableHead scope="row" className="h-auto py-3 align-top">
                <span className="flex flex-col gap-1">
                  <Text as="span" variant="body-2" className="font-medium">
                    {entry.title}
                  </Text>
                  <Text as="span" variant="code" tone="muted">
                    {entry.variable}
                  </Text>
                </span>
              </TableHead>
              <TableCell className="align-top">
                <FlagState isOn={flags?.[entry.key]} />
              </TableCell>
              <TableCell className="align-top text-fg-secondary">
                {entry.whenOn}
              </TableCell>
              <TableCell className="align-top text-fg-secondary">
                {entry.whenOff}
              </TableCell>
              <TableCell className="align-top">
                <span className="flex flex-col gap-1">
                  {entry.pages.map((page) => (
                    <Text key={page} as="span" variant="code">
                      {page}
                    </Text>
                  ))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ShowcasePage>
  );
}
