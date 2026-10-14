import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AccountAvatar } from './account-avatar';

describe('AccountAvatar', () => {
  it('shows the address the person signs in with on focus', async () => {
    render(<AccountAvatar name="Ann Lee" email="ann@acme.test" />);

    await userEvent.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'ann@acme.test',
    );
  });
});
