import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyComponent, whenIdle } from './landing-lazy.util';

describe('lazyComponent', () => {
  it('has nothing until it is fetched, then keeps what arrived', async () => {
    const load = vi.fn().mockResolvedValue('Dialog');
    const lazy = lazyComponent(load);

    expect(lazy.current()).toBeUndefined();
    await expect(lazy.fetch()).resolves.toBe('Dialog');
    expect(lazy.current()).toBe('Dialog');
  });

  it('fetches once however often it is reached for', async () => {
    const load = vi.fn().mockResolvedValue('Dialog');
    const lazy = lazyComponent(load);

    await Promise.all([lazy.fetch(), lazy.fetch()]);
    await lazy.fetch();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('forgets a failed fetch, so the next reach tries again', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('Dialog');
    const lazy = lazyComponent(load);

    await expect(lazy.fetch()).rejects.toThrow('offline');
    expect(lazy.current()).toBeUndefined();
    await expect(lazy.fetch()).resolves.toBe('Dialog');
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('whenIdle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('waits a second where there is no idle callback, and runs nothing once cancelled', () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    const later = vi.fn();
    const never = vi.fn();

    whenIdle(later);
    const cancel = whenIdle(never);
    cancel();
    vi.advanceTimersByTime(999);
    expect(later).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(later).toHaveBeenCalledTimes(1);
    expect(never).not.toHaveBeenCalled();
  });
});
