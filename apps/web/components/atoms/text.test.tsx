import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Text } from './text';

describe('Text', () => {
  it('renders a heading style as a heading of that level', () => {
    render(<Text variant="h3">Kudos this week</Text>);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Kudos this week' }),
    ).toBeInTheDocument();
  });

  it('keeps the look of one level on the element of another', () => {
    render(
      <Text variant="h6" as="h2">
        Introduce yourself
      </Text>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 6 })).not.toBeInTheDocument();
  });

  it('renders body copy as a paragraph, not a heading', () => {
    render(<Text>Ask for, give and act on feedback.</Text>);

    expect(screen.getByText('Ask for, give and act on feedback.').tagName).toBe(
      'P',
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('hands its ref to the element it renders', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Text variant="h2" ref={ref}>
        Kudos
      </Text>,
    );

    expect(ref.current).toBe(screen.getByRole('heading', { level: 2 }));
  });

  it('passes the element’s own props through', () => {
    render(
      <>
        <Text as="label" variant="subtitle-4" htmlFor="name">
          Name
        </Text>
        <input id="name" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });
});
