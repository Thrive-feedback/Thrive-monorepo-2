import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntroduceYourselfForm } from './introduce-yourself-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

function fields() {
  return {
    fullName: screen.getByRole('textbox', { name: 'Full Name' }),
    displayName: screen.getByRole('textbox', {
      name: 'What should we call you?',
    }),
    continueButton: screen.getByRole('button', { name: 'Save & Continue' }),
  };
}

describe('IntroduceYourselfForm', () => {
  it('asks for both names, and both are required', () => {
    render(<IntroduceYourselfForm />);
    const { fullName, displayName } = fields();

    expect(fullName).toBeRequired();
    expect(displayName).toBeRequired();
    expect(displayName).toHaveAccessibleDescription(
      'This will appear on your desk and Kudo cards.',
    );
  });

  it('keeps Continue disabled until both names are given', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, continueButton } = fields();

    expect(continueButton).toBeDisabled();

    await user.type(fullName, 'Tony Stark');

    expect(continueButton).toBeEnabled();
  });

  it('pre-fills Display name from the first word of Full name', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName } = fields();

    await user.type(fullName, '  Tony Stark');

    expect(displayName).toHaveValue('Tony');
  });

  it('stops following Full name once Display name is edited', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName } = fields();

    await user.type(fullName, 'Tony');
    await user.type(displayName, 'boy');
    await user.clear(fullName);
    await user.type(fullName, 'Anthony Stark');

    expect(displayName).toHaveValue('Tonyboy');
  });

  it('disables Continue when Display name is cleared', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName, continueButton } = fields();

    await user.type(fullName, 'Tony Stark');
    await user.clear(displayName);

    expect(displayName).toHaveValue('');
    expect(continueButton).toBeDisabled();
  });

  it('treats a name of only spaces as empty', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName, continueButton } = fields();

    await user.type(fullName, 'Tony');
    await user.clear(displayName);
    await user.type(displayName, '   ');

    expect(continueButton).toBeDisabled();
  });

  it('moves on to Create a Workspace', async () => {
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, continueButton } = fields();

    await user.type(fullName, 'Tony Stark');
    await user.click(continueButton);

    expect(push).toHaveBeenCalledWith('/register/create-workspace');
  });
});
