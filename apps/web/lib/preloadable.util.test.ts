import { describe, expect, it, vi } from 'vitest';
import { preloadable } from './preloadable.util';

describe('preloadable', () => {
  it('fetches once, however often it is asked', async () => {
    const load = vi.fn(async () => 'module');
    const read = preloadable(load);

    await Promise.all([read(), read()]);

    expect(load).toHaveBeenCalledOnce();
  });

  it('says it has arrived, so React can read it without waiting', async () => {
    const read = preloadable(async () => 'module');

    await read();

    expect(read()).toMatchObject({ status: 'fulfilled', value: 'module' });
  });

  it('tries again after a failed fetch', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('module');
    const read = preloadable(load);

    await expect(read()).rejects.toThrow('offline');

    await expect(read()).resolves.toBe('module');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
