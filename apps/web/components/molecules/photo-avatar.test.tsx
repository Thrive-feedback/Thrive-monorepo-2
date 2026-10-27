import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { photosWill } from '@/lib/test/photos-will';
import { PhotoAvatar } from './photo-avatar';

const PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';

/** The avatar is hidden from screen readers, so it is found the way it is seen. */
function shownPhoto(container: HTMLElement) {
  return container.querySelector('img');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PhotoAvatar', () => {
  it('shows the photo once it has loaded', async () => {
    photosWill('load');

    const { container } = render(
      <PhotoAvatar name="Ann Lee" photoUrl={PHOTO} />,
    );

    await vi.waitFor(() => expect(shownPhoto(container)).not.toBeNull());
    expect(shownPhoto(container)).toHaveAttribute('src', PHOTO);
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('shows the initials when there is no photo', () => {
    const { container } = render(
      <PhotoAvatar name="Ann Lee" photoUrl={null} />,
    );

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(shownPhoto(container)).toBeNull();
  });

  it('keeps the initials, never a broken image, when the photo fails to load', async () => {
    photosWill('error');

    const { container } = render(
      <PhotoAvatar name="Ann Lee" photoUrl={PHOTO} />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(shownPhoto(container)).toBeNull();
  });
});
