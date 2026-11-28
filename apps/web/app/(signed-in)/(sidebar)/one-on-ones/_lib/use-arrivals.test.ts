import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useArrivals } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-arrivals';

type Item = { key: string; text: string };

function drawn(items: readonly Item[]) {
  return renderHook(({ list }) => useArrivals(list), {
    initialProps: { list: items },
  });
}

describe('useArrivals', () => {
  it('has nothing arriving in the list as it is first drawn', () => {
    const { result } = drawn([{ key: 'a', text: 'Launch retro' }]);

    expect(result.current.isArriving('a')).toBe(false);
  });

  it('has a new item arrive until it says it has', () => {
    const { result, rerender } = drawn([{ key: 'a', text: 'Launch retro' }]);

    rerender({
      list: [
        { key: 'a', text: 'Launch retro' },
        { key: 'b', text: 'Kudos from Nok' },
      ],
    });
    expect(result.current.isArriving('b')).toBe(true);
    expect(result.current.isArriving('a')).toBe(false);

    act(() => result.current.arrived('b'));
    expect(result.current.isArriving('b')).toBe(false);
  });

  it('has no item arrive that only took a new key with the same words', () => {
    const { result, rerender } = drawn([
      { key: 'preview-0', text: 'Launch retro' },
    ]);

    rerender({
      list: [
        { key: 'topic-1', text: 'Launch retro' },
        { key: 'topic-2', text: 'Career path' },
      ],
    });

    expect(result.current.isArriving('topic-1')).toBe(false);
    expect(result.current.isArriving('topic-2')).toBe(true);
  });
});
