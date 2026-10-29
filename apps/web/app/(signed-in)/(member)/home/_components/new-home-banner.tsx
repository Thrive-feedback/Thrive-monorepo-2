import NextLink from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

/**
 * Atop Home, for every Member and with no way to close it: the new Home is on its way, and here
 * is the way to it. It goes when the new Home replaces this one.
 *
 * On a wide screen its height is fixed and it reaches up into the main region's padding, because
 * `home-split.module.css` subtracts both from the split's height to keep the page from scrolling.
 */
export function NewHomeBanner() {
  return (
    <aside
      aria-label="The new Home"
      className="mx-auto mb-6 flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 rounded-page bg-surface-raised px-4 py-2 lg:-mt-8 lg:mb-0 lg:h-14 lg:max-w-none lg:flex-nowrap"
    >
      <Text variant="body-2">A new Home is on its way.</Text>
      <Button asChild size="sm">
        <NextLink href={ROUTES.brandNewHome}>Try the new Home</NextLink>
      </Button>
    </aside>
  );
}
