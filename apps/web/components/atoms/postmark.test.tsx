import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Postmark } from './postmark';

const DATE = '2026-10-04T09:30:00.000Z';

describe('Postmark', () => {
  it('is hidden from screen readers', () => {
    const { container } = render(<Postmark date={DATE} />);

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('says who posted it round its edge', () => {
    render(<Postmark date={DATE} />);

    expect(screen.getByText('Thrive')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('prints the day on two lines', () => {
    render(<Postmark date={DATE} />);

    expect(screen.getByText('04 OCT')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('keeps the arcs of two marks on one page apart', () => {
    const { container } = render(
      <>
        <Postmark date={DATE} />
        <Postmark date={DATE} />
      </>,
    );
    const ids = [...container.querySelectorAll('defs path')].map(
      (path) => path.id,
    );

    expect(new Set(ids).size).toBe(4);
  });

  it('takes its size from the caller, and hands on its element', () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(
      <Postmark ref={ref} date={DATE} className="w-24" />,
    );
    const mark = container.querySelector('svg');

    expect(mark).toHaveClass('w-24');
    expect(mark).not.toHaveClass('w-full');
    expect(ref.current).toBe(mark);
  });
});
