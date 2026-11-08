import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShowcaseNav } from './showcase-nav';

const pathname = vi.fn(() => '/ui-showcase');
vi.mock('next/navigation', () => ({ usePathname: () => pathname() }));

function currentLinks() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent);
}

describe('ShowcaseNav', () => {
  it.each([
    ['/ui-showcase', 'Components'],
    ['/ui-showcase/tokens', 'Tokens'],
    ['/ui-showcase/cards', 'Cards'],
    ['/ui-showcase/notifications', 'Notifications'],
    ['/ui-showcase/settings', 'Settings'],
  ])('marks only the page it is on at %s', (path, page) => {
    pathname.mockReturnValue(path);
    render(<ShowcaseNav />);

    expect(currentLinks()).toEqual([page]);
  });

  it("counts a component's own page as Components", () => {
    pathname.mockReturnValue('/ui-showcase/button');
    render(<ShowcaseNav />);

    expect(currentLinks()).toEqual(['Components']);
  });
});
