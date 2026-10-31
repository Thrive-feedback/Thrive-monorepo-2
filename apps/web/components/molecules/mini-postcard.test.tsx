import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MiniPostcard } from './mini-postcard';

function sidesOf(container: HTMLElement) {
  return container.querySelector('[data-slot="mini-postcard-sides"]')?.children;
}

describe('MiniPostcard', () => {
  it('carries the blue mark of a sent card, and no writing of its own', () => {
    render(<MiniPostcard kind="offered" />);

    expect(screen.getByText('THRIVE')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.queryByText('Feedback message')).not.toBeInTheDocument();
  });

  it('draws one side, with no line down it', () => {
    const { container } = render(<MiniPostcard kind="offered" />);

    expect(sidesOf(container)).toHaveLength(1);
  });

  it('halves a request from its answer', () => {
    const { container } = render(<MiniPostcard kind="requested" />);

    expect(sidesOf(container)).toHaveLength(2);
  });

  it('keeps the line between the halves off the blue mark', () => {
    const { container } = render(<MiniPostcard kind="requested" />);

    expect(
      container.querySelector('[data-slot="mini-postcard"]'),
    ).not.toHaveClass('divide-x');
  });

  it('shakes its face and not the popup, which stays outside it', () => {
    const { container } = render(<MiniPostcard kind="offered" />);

    const face = container.querySelector('[data-slot="mini-postcard-face"]');
    expect(face).not.toContainElement(screen.getByText('View postcard'));
    expect(face).toContainElement(screen.getByText('THRIVE'));
  });

  it('keeps its popup out of sight until asked', () => {
    render(<MiniPostcard kind="offered" />);

    expect(screen.getByText('View postcard')).toHaveClass('opacity-0');
  });

  it('shows its popup when told to', () => {
    render(<MiniPostcard kind="offered" isPopupShown />);

    expect(screen.getByText('View postcard')).toHaveClass('opacity-100');
  });

  it('is hidden from screen readers, whatever holds it names the postcard', () => {
    const { container } = render(<MiniPostcard kind="requested" />);

    expect(
      container.querySelector('[data-slot="mini-postcard"]'),
    ).toHaveAttribute('aria-hidden', 'true');
  });
});
