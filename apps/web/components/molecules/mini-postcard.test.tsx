import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MiniPostcard } from './mini-postcard';

function sidesOf(container: HTMLElement) {
  return container.querySelector('[data-slot="mini-postcard-sides"]')?.children;
}

const SENT_ON = '2026-10-31T03:00:00.000Z';

describe('MiniPostcard', () => {
  it('carries the postmark of the day it was sent, and no writing of its own', () => {
    render(<MiniPostcard kind="offered" date={SENT_ON} />);

    expect(screen.getByText('Thrive')).toBeInTheDocument();
    expect(screen.getByText('31 OCT')).toBeInTheDocument();
    expect(screen.queryByText('Feedback message')).not.toBeInTheDocument();
  });

  it('draws one side, with no line down it', () => {
    const { container } = render(
      <MiniPostcard kind="offered" date={SENT_ON} />,
    );

    expect(sidesOf(container)).toHaveLength(1);
  });

  it('halves a request from its answer', () => {
    const { container } = render(
      <MiniPostcard kind="requested" date={SENT_ON} />,
    );

    expect(sidesOf(container)).toHaveLength(2);
  });

  it('keeps the line between the halves off the postmark', () => {
    const { container } = render(
      <MiniPostcard kind="requested" date={SENT_ON} />,
    );

    expect(
      container.querySelector('[data-slot="mini-postcard"]'),
    ).not.toHaveClass('divide-x');
  });

  it('shakes its face and not the popup, which stays outside it', () => {
    const { container } = render(
      <MiniPostcard kind="offered" date={SENT_ON} />,
    );

    const face = container.querySelector('[data-slot="mini-postcard-face"]');
    expect(face).not.toContainElement(screen.getByText('View postcard'));
    expect(face).toContainElement(screen.getByText('Thrive'));
  });

  it('fades and pulses while what it opens is on its way, and not otherwise', () => {
    const { container, rerender } = render(
      <MiniPostcard kind="offered" date={SENT_ON} />,
    );
    const face = container.querySelector('[data-slot="mini-postcard-face"]');
    expect(face).not.toHaveAttribute('data-pending');

    rerender(<MiniPostcard kind="offered" date={SENT_ON} isPending />);

    expect(face).toHaveClass('motion-safe:animate-pulse');
    expect(face).toHaveAttribute('data-pending');
  });

  it('keeps its popup out of sight until asked', () => {
    render(<MiniPostcard kind="offered" date={SENT_ON} />);

    expect(screen.getByText('View postcard')).toHaveClass('opacity-0');
  });

  it('shows its popup when told to', () => {
    render(<MiniPostcard kind="offered" date={SENT_ON} isPopupShown />);

    expect(screen.getByText('View postcard')).toHaveClass('opacity-100');
  });

  it('is hidden from screen readers, whatever holds it names the postcard', () => {
    const { container } = render(
      <MiniPostcard kind="requested" date={SENT_ON} />,
    );

    expect(
      container.querySelector('[data-slot="mini-postcard"]'),
    ).toHaveAttribute('aria-hidden', 'true');
  });
});
