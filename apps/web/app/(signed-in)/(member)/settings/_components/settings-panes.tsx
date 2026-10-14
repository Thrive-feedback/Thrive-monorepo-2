'use client';

import { ChevronLeftIcon } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';

/** The sections, in menu order. Account is also what `/settings` shows on a wide screen. */
const SECTIONS: readonly { readonly href: string; readonly label: string }[] = [
  { href: ROUTES.settings.account, label: 'Account' },
  { href: ROUTES.settings.workspace, label: 'Workspace' },
  { href: ROUTES.settings.appearance, label: 'Appearance' },
];

/**
 * The menu and the open section. On a wide screen they sit side by side, and `/settings` shows
 * Account beside the menu. On a narrow one they take turns: `/settings` is the menu alone, and a
 * section hides the menu and offers the way back to it. A client component because which pane
 * shows depends on the current path, which only the browser knows.
 */
export function SettingsPanes({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const atIndex = pathname === ROUTES.settings.index;

  function isCurrent(href: string): boolean {
    return pathname === href || (atIndex && href === ROUTES.settings.account);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Text
        variant="display-5"
        as="h1"
        className={cn(!atIndex && 'max-md:sr-only')}
      >
        Settings
      </Text>
      {!atIndex && (
        <NextLink
          href={ROUTES.settings.index}
          className="flex w-fit items-center gap-1 rounded-button text-button-sm text-fg-secondary hover:text-fg-primary md:hidden"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
          Settings
        </NextLink>
      )}
      <div className="grid gap-8 md:grid-cols-[12rem_1fr]">
        <nav
          aria-label="Settings"
          className={cn('flex flex-col gap-1', !atIndex && 'max-md:hidden')}
        >
          {SECTIONS.map((section) => (
            <NextLink
              key={section.href}
              href={section.href}
              aria-current={isCurrent(section.href) ? 'page' : undefined}
              className={cn(
                'rounded-button px-3 py-2 text-button-sm text-fg-secondary hover:bg-action-neutral-surface hover:text-fg-primary',
                'max-md:bg-surface-raised max-md:py-4',
                'md:aria-[current]:bg-action-primary-surface md:aria-[current]:text-action-primary',
              )}
            >
              {section.label}
            </NextLink>
          ))}
        </nav>
        <div className={cn('min-w-0', atIndex && 'max-md:hidden')}>
          {children}
        </div>
      </div>
    </div>
  );
}
