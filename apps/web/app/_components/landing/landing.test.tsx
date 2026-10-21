import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Landing } from './landing';

// The preview's dialog asks for the router, which only matters when it closes to an address.
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe('Landing', () => {
  /*
   * A guard for changes that should not show, such as work on how fast the page renders: the
   * whole page's markup, so any difference a visitor could see fails here first. What the page
   * says and does is asserted by role in the section tests and `app/page.test.tsx`; this stands
   * beside them, not in their place. Update it with `-u` only when the page is meant to change.
   */
  it('renders the same page', () => {
    const { container } = render(<Landing />);

    expect(container).toMatchSnapshot();
  });
});
