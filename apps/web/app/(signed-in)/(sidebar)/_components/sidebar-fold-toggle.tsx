'use client';

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { SIDEBAR_ID } from '@/app/(signed-in)/(sidebar)/_lib/sidebar-id.constant';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { sideNavLink } from '@/components/molecules/side-nav';
import { cn } from '@/lib/cn.util';
import { useSidebarFold } from '@/lib/use-sidebar-fold';

const COLLAPSE = 'Collapse sidebar';
const EXPAND = 'Expand sidebar';

export type SidebarFoldToggleProps = {
  /** The page is one of Settings', where the rail is held below `xl`. */
  inSettings: boolean;
};

/**
 * Folds the sidebar to its rail of icons, or widens it again, drawn as one of the sidebar's rows. The
 * choice is kept in this browser and holds at every width. Which icon and words show follows
 * `data-sidebar` in CSS, so the first paint is right before hydration; the name a screen reader
 * hears and whether it is expanded come from the same attribute once hydrated. Where Settings holds
 * the rail, it is not offered, since it could not act.
 */
export function SidebarFoldToggle({ inSettings }: SidebarFoldToggleProps) {
  const { folded, toggle } = useSidebarFold(inSettings);
  const label = folded ? EXPAND : COLLAPSE;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-expanded={!folded}
          aria-controls={SIDEBAR_ID}
          aria-label={label}
          onClick={toggle}
          className={cn(
            sideNavLink({ foldsToIcons: true }),
            'rail-locked:hidden cursor-pointer',
          )}
        >
          <PanelLeftCloseIcon
            aria-hidden="true"
            className="rail:hidden size-4.5 shrink-0"
          />
          <PanelLeftOpenIcon
            aria-hidden="true"
            className="not-rail:hidden size-4.5 shrink-0"
          />
          <span
            aria-hidden="true"
            className="rail:sr-only min-w-0 flex-1 truncate"
          >
            {COLLAPSE}
          </span>
        </button>
      </TooltipTrigger>
      {/* The words show beside the icon while it is wide, so the tooltip names it on the rail only. */}
      <TooltipContent side="right" className="not-rail:hidden">
        {EXPAND}
      </TooltipContent>
    </Tooltip>
  );
}
