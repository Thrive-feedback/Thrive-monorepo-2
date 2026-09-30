import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

describe('Avatar', () => {
  // jsdom never loads an image, so this is also what a broken photo looks like.
  it('shows the fallback while the photo has not loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="/tony.png" alt="Tony Stark" />
        <AvatarFallback>TS</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText('TS')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
