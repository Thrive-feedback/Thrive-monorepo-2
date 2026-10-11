import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveProfileState } from '../_lib/save-profile-state.type';
import { IntroduceYourselfForm } from './introduce-yourself-form';

const saveProfile =
  vi.fn<
    (
      previous: SaveProfileState,
      formData: FormData,
    ) => Promise<SaveProfileState>
  >();
vi.mock('../_lib/profile-actions.service', () => ({
  saveProfile: (previous: SaveProfileState, formData: FormData) =>
    saveProfile(previous, formData),
}));

beforeEach(() => {
  saveProfile.mockReset();
});

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
      'This is how your name will show up in the system.',
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

  it('saves both names as they were typed', async () => {
    saveProfile.mockResolvedValue({});
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, continueButton } = fields();

    await user.type(fullName, 'Tony Stark');
    await user.click(continueButton);

    const formData = saveProfile.mock.lastCall?.[1];
    expect(formData?.get('fullName')).toBe('Tony Stark');
    expect(formData?.get('displayName')).toBe('Tony');
  });

  it('shows why a name was refused beside that field, and keeps what was typed', async () => {
    saveProfile.mockResolvedValue({
      fieldErrors: { displayName: 'Use 50 characters or fewer.' },
    });
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName, continueButton } = fields();

    await user.type(fullName, 'Tony Stark');
    await user.click(continueButton);

    expect(
      await screen.findByText('Use 50 characters or fewer.'),
    ).toBeInTheDocument();
    expect(displayName).toBeInvalid();
    expect(displayName).toHaveAccessibleDescription(
      'Use 50 characters or fewer.',
    );
    expect(fullName).toHaveValue('Tony Stark');
  });

  it('says so when saving failed for another reason, and keeps what was typed', async () => {
    saveProfile.mockResolvedValue({
      formError: "We couldn't save your details. Please try again.",
    });
    const user = userEvent.setup();
    render(<IntroduceYourselfForm />);
    const { fullName, displayName, continueButton } = fields();

    await user.type(fullName, 'Tony Stark');
    await user.click(continueButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't save your details. Please try again.",
    );
    expect(fullName).toHaveValue('Tony Stark');
    expect(displayName).toHaveValue('Tony');
    expect(continueButton).toBeEnabled();
  });

  it('starts from the name it is given, and Display name from its first word', () => {
    render(<IntroduceYourselfForm defaultFullName="Tony Stark" />);
    const { fullName, displayName, continueButton } = fields();

    expect(fullName).toHaveValue('Tony Stark');
    expect(displayName).toHaveValue('Tony');
    expect(continueButton).toBeEnabled();
  });
});
