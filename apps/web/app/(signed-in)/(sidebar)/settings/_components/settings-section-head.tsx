import { ChevronLeftIcon } from 'lucide-react';
import NextLink from 'next/link';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { settingsSectionAt } from '@/app/(signed-in)/(sidebar)/settings/_lib/settings-sections.constant';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { ROUTES } from '@/lib/routes.constant';

export type SettingsSectionHeadProps = {
  /** The section this heads, by its address; its title and note come from the menu's own list. */
  href: string;
  /** What the page is mostly for, beside the title, such as Invite people on Members. */
  action?: React.ReactNode;
};

/**
 * The head of a Settings section, drawn as Home's is: the title in the display face with a note by
 * hand beside it, and the section's main action at the end of the row. On a screen too narrow for
 * the menu beside it, the way back to the menu sits above.
 */
export function SettingsSectionHead({
  href,
  action,
}: SettingsSectionHeadProps) {
  const section = settingsSectionAt(href);

  return (
    <div className="flex flex-col gap-3">
      <NextLink
        href={ROUTES.settings.index}
        className="flex w-fit items-center gap-1 rounded-button text-button-sm text-fg-secondary hover:text-fg-primary lg:hidden"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        Settings
      </NextLink>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-end gap-x-3">
          <PageTitle>{section.label}</PageTitle>
          <HandwrittenNote size="md" className="-translate-y-1.5">
            {section.note}
          </HandwrittenNote>
        </div>
        {action}
      </div>
    </div>
  );
}
