'use client';

import {
  Building2Icon,
  ChevronLeftIcon,
  CircleUserRoundIcon,
  HashIcon,
  PaletteIcon,
  UsersIcon,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/atoms/breadcrumb';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { SideNav, type SideNavItem } from '@/components/molecules/side-nav';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';

/** What `/settings` shows on a wide screen, so it is also the section marked there. */
const ACCOUNT: SideNavItem = {
  href: ROUTES.settings.account,
  label: 'Account',
  Icon: CircleUserRoundIcon,
};

/** The sections, in menu order. */
const SECTIONS: readonly SideNavItem[] = [
  ACCOUNT,
  { href: ROUTES.settings.workspace, label: 'Workspace', Icon: Building2Icon },
  {
    href: ROUTES.settings.workspaceGoals,
    label: 'Workspace Goals',
    Icon: HashIcon,
  },
  { href: ROUTES.settings.members, label: 'Members', Icon: UsersIcon },
  { href: ROUTES.settings.appearance, label: 'Appearance', Icon: PaletteIcon },
];

/**
 * One panel: the menu down the left, and the open section on the right under a header that
 * names it. On a wide screen they sit side by side, and `/settings` shows Account beside the
 * menu. On a narrow one they take turns: `/settings` is the menu alone, and a section hides the
 * menu and offers the way back to it. A client component because which pane shows depends on
 * the current path, which only the browser knows.
 *
 * The panel keeps the main region's side padding but reaches 8 steps into its `py-12`
 * (`MemberShell`), leaving 4 above and below, as Home's split does.
 */
export function SettingsPanes({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const atIndex = pathname === ROUTES.settings.index;
  const current =
    SECTIONS.find((section) => section.href === pathname) ?? ACCOUNT;

  return (
    <div className="-my-8 flex flex-1 flex-col overflow-hidden rounded-page md:flex-row">
      <div
        className={cn(
          'flex flex-col gap-4 border-border-subtle p-4 md:w-72 md:shrink-0 md:border-r',
          !atIndex && 'max-md:hidden',
        )}
      >
        <Breadcrumb className="px-3 pt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.home}>Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Text variant="subtitle-1" as="h1" className="px-3">
          Settings
        </Text>
        <SideNav label="Settings" items={SECTIONS} currentHref={current.href} />
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          atIndex && 'max-md:hidden',
        )}
      >
        <header className="flex flex-col gap-3 border-border-subtle border-b px-6 py-4">
          {!atIndex && (
            <NextLink
              href={ROUTES.settings.index}
              className="flex w-fit items-center gap-1 rounded-button text-button-sm text-fg-secondary hover:text-fg-primary md:hidden"
            >
              <ChevronLeftIcon aria-hidden="true" className="size-4" />
              Settings
            </NextLink>
          )}
          <Text variant="subtitle-2" as="h2">
            {current.label}
          </Text>
        </header>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
