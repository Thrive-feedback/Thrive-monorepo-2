import { Suspense } from 'react';
import {
  BrandNewPageTitle,
  type BrandNewPageTitleProps,
} from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import {
  GIVEN_HEADING_ID,
  type PersonalItemsSide,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-items-side.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PersonalItemsViewToggle } from './personal-items-view-toggle';

const HEADINGS: Readonly<
  Record<
    PersonalItemsSide,
    {
      title: string;
      description: string;
      focusable?: Omit<BrandNewPageTitleProps, 'children'>;
    }
  >
> = {
  received: {
    title: 'Received',
    description: 'Feedback and kudos people wrote to you.',
  },
  given: {
    title: 'Given',
    description: 'Feedback and kudos you wrote.',
    // The first card sent replaces the button that opened it, so focus comes here instead.
    focusable: { id: GIVEN_HEADING_ID, tabIndex: -1 },
  },
};

export type PersonalItemsHeadingProps = {
  /** Which list it heads. */
  side: PersonalItemsSide;
};

/**
 * The head of Received or Given: what it is, and how to lay it out. The choice reads the address, which the
 * loading screen is built without, so it waits behind its own boundary, keeping its place.
 */
export function PersonalItemsHeading({ side }: PersonalItemsHeadingProps) {
  const { title, description, focusable } = HEADINGS[side];

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <BrandNewPageTitle {...focusable}>{title}</BrandNewPageTitle>
        <Text as="p" variant="body-1" tone="muted">
          {description}
        </Text>
      </div>
      <Suspense fallback={<Skeleton className="h-9 w-19 shrink-0" />}>
        <PersonalItemsViewToggle side={side} />
      </Suspense>
    </div>
  );
}
