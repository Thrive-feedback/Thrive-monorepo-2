import { ROUTES } from '@/lib/routes.constant';

/** Whether a path is Settings' landing or one of its sections. */
export function isSettingsPath(pathname: string): boolean {
  return (
    pathname === ROUTES.settings.index ||
    pathname.startsWith(`${ROUTES.settings.index}/`)
  );
}
