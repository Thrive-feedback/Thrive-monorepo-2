import { Text } from '@/components/atoms/text';
import type { BrandNewHomeShow } from '@/lib/routes.constant';

/** What each choice says when it holds nothing, in the words of the design (`FB-4-S1`). */
const EMPTY: Readonly<
  Record<BrandNewHomeShow, { title: string; body?: string }>
> = {
  all: {
    title: 'No Feedback to show yet',
    body: 'Feedback shared with you or with the whole Workspace will show up here.',
  },
  everyone: { title: 'Nothing has been shared with the whole Workspace yet.' },
  shared: { title: 'Nothing has been shared with you yet.' },
};

export type FeedEmptyProps = {
  /** What the feed was asked to show. */
  show: BrandNewHomeShow;
};

/** Home's feed with nothing to show, in the words of the choice that was made. */
export function FeedEmpty({ show }: FeedEmptyProps) {
  const { title, body } = EMPTY[show];

  return (
    <div className="flex flex-col gap-1 py-5">
      <Text as="p" variant="subtitle-3">
        {title}
      </Text>
      {body && (
        <Text as="p" variant="body-2" tone="muted">
          {body}
        </Text>
      )}
    </div>
  );
}
