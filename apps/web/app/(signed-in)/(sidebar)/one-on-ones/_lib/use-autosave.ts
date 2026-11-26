import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';

type Timer = ReturnType<typeof setTimeout>;

/** Stops a save waiting out a pause, if one is. */
function stop(timer: { current: Timer | null }): void {
  if (timer.current) {
    clearTimeout(timer.current);
    timer.current = null;
  }
}

/** How long a field waits after the last keystroke before it saves itself. */
export const SAVE_AFTER_MS = 1200;

/** The refusal of a save over a note somebody else changed since it was read. */
const CHANGED = 'ONE_ON_ONE_TOPIC_CHANGED';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export type AutosaveOptions = {
  /** Whether the text as last read was written by somebody else, not by this person. */
  readonly storedIsTheirs: boolean;
  /** Told of each save as it is sent, so the page can wait for it to land. */
  readonly track?: (save: Promise<unknown>) => void;
};

/**
 * A text that saves itself: after a pause in typing, and when it loses focus. It says quietly how
 * the last save went, and keeps what was typed when a save is refused, so nothing is lost.
 *
 * `stored` is the text as the page last read it. When a read brings one somebody else wrote while
 * this person has unsaved words, neither text is thrown away and nothing saves by itself until the
 * person chooses — `takeTheirs` or `keepMine`. With nothing unsaved, the field shows what was read;
 * the person's own save read back is no conflict. Once a save is refused because somebody else
 * changed the note, it stops saving, rather than being refused at every pause, until the next read.
 */
export function useAutosave(
  stored: string,
  save: (value: string) => Promise<OneOnOneActionResult>,
  { storedIsTheirs, track }: AutosaveOptions,
) {
  const [value, setValue] = useState(stored);
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  /** What somebody else wrote while this person had unsaved words, until they choose. */
  const [theirs, setTheirs] = useState<string | null>(null);
  const saved = useRef(stored);
  const typed = useRef(stored);
  typed.current = value;
  const blocked = useRef(false);
  blocked.current = theirs !== null;
  /** Refused as changed by somebody else: no more saves until a read shows what they wrote. */
  const stale = useRef(false);
  // The latest save, so a save that waited out a pause sends what the page read most recently.
  const latestSave = useRef(save);
  latestSave.current = save;
  const timer = useRef<Timer | null>(null);
  const isTheirs = useRef(storedIsTheirs);
  isTheirs.current = storedIsTheirs;

  // A save still waiting when the field goes away is dropped rather than sent after it has gone.
  useEffect(() => () => stop(timer), []);

  useEffect(() => {
    if (stored === saved.current) {
      return;
    }
    stale.current = false;
    if (typed.current === saved.current) {
      setValue(stored);
    } else if (isTheirs.current && typed.current !== stored) {
      stop(timer);
      setTheirs(stored);
    }
    saved.current = stored;
  }, [stored]);

  async function flush(next: string) {
    stop(timer);
    if (blocked.current || stale.current || next === saved.current) {
      return;
    }
    setStatus('saving');
    const sent = latestSave.current(next);
    track?.(sent);
    const result = await sent;
    if (result.ok) {
      saved.current = next;
      setStatus('saved');
      return;
    }
    setStatus('failed');
    stale.current = result.code === CHANGED;
    toast.error(result.message);
  }

  function change(next: string) {
    setValue(next);
    stop(timer);
    timer.current = setTimeout(() => void flush(next), SAVE_AFTER_MS);
  }

  function takeTheirs() {
    if (theirs === null) {
      return;
    }
    setValue(theirs);
    setTheirs(null);
    setStatus('idle');
  }

  function keepMine() {
    blocked.current = false;
    stale.current = false;
    setTheirs(null);
    void flush(typed.current);
  }

  return {
    value,
    status,
    theirs,
    change,
    flush: () => flush(typed.current),
    takeTheirs,
    keepMine,
  };
}
