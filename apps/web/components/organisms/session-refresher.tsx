'use client';

import { useEffect, useRef } from 'react';
import { refreshSession } from '@/lib/session/session-actions.service';

/**
 * Rendered only when the session is due a refresh. A server component cannot set the
 * renewed cookie, so this runs the server action that can, once per mount: the ref keeps a
 * re-render, including the one the action itself causes, from running it twice. Renders
 * nothing.
 */
export function SessionRefresher() {
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (hasRefreshed.current) return;
    hasRefreshed.current = true;
    void refreshSession();
  }, []);

  return null;
}
