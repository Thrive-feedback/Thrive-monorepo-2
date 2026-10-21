import { afterEach, describe, expect, it, vi } from 'vitest';
import { whenIdle } from './when-idle.util';

describe('whenIdle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('waits for the browser to be idle where it can say so', () => {
    let idle: (() => void) | undefined;
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
      idle = callback;
      return 1;
    });
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const work = vi.fn();

    whenIdle(work);
    expect(work).not.toHaveBeenCalled();
    idle?.();

    expect(work).toHaveBeenCalledOnce();
  });

  it('waits a moment where the browser cannot say when it is idle, and can be called off', () => {
    // Only the timeout is faked: fake timers would otherwise bring an idle callback of their own.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('requestIdleCallback', undefined);
    const work = vi.fn();
    const cancel = whenIdle(work);
    const cancelled = vi.fn();
    const cancelLater = whenIdle(cancelled);

    cancelLater();
    vi.advanceTimersByTime(1000);

    expect(work).toHaveBeenCalledOnce();
    expect(cancelled).not.toHaveBeenCalled();
    cancel();
  });
});
