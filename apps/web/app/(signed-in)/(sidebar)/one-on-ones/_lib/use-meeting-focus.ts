import { useListCollapsed } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-list-collapsed';
import { useSidebarFold } from '@/lib/use-sidebar-fold';

/**
 * Clears the room for a meeting as it starts: the sidebar folds to its icons and the list of 1:1s to
 * faces, so the meeting takes the width. Each stays as the person then leaves it, and either opens
 * again as usual. A sidebar the window holds at its width, as on a phone, is left as it is.
 */
export function useMeetingFocus(): () => void {
  const sidebar = useSidebarFold();
  const [isListCollapsed, setListCollapsed] = useListCollapsed();
  return () => {
    if (!sidebar.folded && !sidebar.locked) {
      sidebar.toggle();
    }
    if (!isListCollapsed) {
      setListCollapsed(true);
    }
  };
}
