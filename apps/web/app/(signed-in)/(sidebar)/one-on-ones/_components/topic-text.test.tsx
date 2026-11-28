import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopicText } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/topic-text';

describe('TopicText', () => {
  it('draws each hashtag blue and each mention orange, as Feedback draws them', () => {
    render(
      <p>
        <TopicText text="Ploy sent to Mint: Pairing with @Ben fixed it. #Ownership" />
      </p>,
    );

    expect(screen.getByText('#Ownership')).toHaveClass(
      'text-status-info-active',
    );
    expect(screen.getByText('@Ben')).toHaveClass('text-action-secondary');
    expect(screen.getByRole('paragraph')).toHaveTextContent(
      'Ploy sent to Mint: Pairing with @Ben fixed it. #Ownership',
    );
  });

  it('leaves words with no tag as they are', () => {
    const { container } = render(<TopicText text="Career path" />);

    expect(container).toHaveTextContent('Career path');
    expect(container.querySelector('span')).toBeNull();
  });
});
