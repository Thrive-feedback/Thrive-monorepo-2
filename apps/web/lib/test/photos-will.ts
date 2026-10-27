import { vi } from 'vitest';

/**
 * jsdom never fetches an image, so the network's answer is stood in for where the avatar asks
 * it: the `Image` it loads the photo into before showing it. Undo it after each test with
 * `vi.unstubAllGlobals()`.
 */
export function photosWill(outcome: 'load' | 'error') {
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      referrerPolicy = '';
      complete = false;
      naturalWidth = 0;
      set src(_value: string) {
        queueMicrotask(() => {
          this.complete = true;
          this.naturalWidth = outcome === 'load' ? 96 : 0;
          this.dispatchEvent(new Event(outcome));
        });
      }
    },
  );
}
