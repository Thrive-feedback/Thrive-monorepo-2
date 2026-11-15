import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AccountAvatar } from './account-avatar';

const ANN = {
  name: 'Ann Lee',
  email: 'ann@acme.test',
  slug: 'ann.lee',
  photoUrl: null,
} as const;

describe('AccountAvatar', () => {
  it('leads to the person’s Profile, named for them', () => {
    render(<AccountAvatar {...ANN} />);

    expect(
      screen.getByRole('link', { name: 'Profile: Ann Lee' }),
    ).toHaveAttribute('href', '/profile/ann.lee');
  });

  it('leads to their Account while they have no Profile to open', () => {
    render(<AccountAvatar {...ANN} slug={null} />);

    expect(
      screen.getByRole('link', { name: 'Account: Ann Lee' }),
    ).toHaveAttribute('href', '/settings/account');
  });

  it('shows the address the person signs in with on focus', async () => {
    render(<AccountAvatar {...ANN} />);

    await userEvent.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'ann@acme.test',
    );
  });
});
