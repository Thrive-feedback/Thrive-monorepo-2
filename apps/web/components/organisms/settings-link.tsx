'use client';

import { SettingsIcon } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { ROUTES } from '@/lib/routes.constant';

/**
 * The navbar's way into Settings, an icon marked while the person is anywhere in Settings. A
 * client component because only the browser knows the current path.
 */
export function SettingsLink() {
  const pathname = usePathname();
  const index = ROUTES.settings.index;
  const inSettings = pathname === index || pathname.startsWith(`${index}/`);

  return (
    <Button variant="ghost" size="icon" asChild>
      <NextLink
        href={index}
        aria-label="Settings"
        aria-current={inSettings ? 'page' : undefined}
        className="text-fg-secondary aria-[current]:bg-action-primary-surface aria-[current]:text-action-primary"
      >
        <SettingsIcon aria-hidden="true" className="size-5" />
      </NextLink>
    </Button>
  );
}
