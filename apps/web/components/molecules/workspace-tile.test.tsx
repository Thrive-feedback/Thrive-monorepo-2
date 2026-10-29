import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkspaceTile } from './workspace-tile';

describe('WorkspaceTile', () => {
  it('shows the Workspace’s initials when it has no logo, hidden from screen readers', () => {
    const { container } = render(
      <WorkspaceTile name="Acme Corp" tone="current" />,
    );

    const tile = container.firstElementChild;
    expect(tile).toHaveTextContent('AC');
    expect(tile).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the initials in place while a logo loads', () => {
    const { container } = render(
      <WorkspaceTile
        name="Acme"
        logoUrl="https://logos.test/acme.png"
        tone="choice"
      />,
    );

    // jsdom never loads an image, so this is also what shows when a logo fails.
    expect(container.firstElementChild).toHaveTextContent('A');
  });
});
