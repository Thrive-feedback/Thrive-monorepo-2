import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { CreateWorkspaceForm } from './create-workspace-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

function fields() {
  return {
    workspaceName: screen.getByRole('textbox', { name: 'Workspace name' }),
    teamSize: screen.getByRole('group', { name: 'Team size (optional)' }),
    createButton: screen.getByRole('button', { name: 'Create Workspace' }),
  };
}

describe('CreateWorkspaceForm', () => {
  it('requires a Workspace name', () => {
    renderWithIntl(<CreateWorkspaceForm />);

    expect(fields().workspaceName).toBeRequired();
  });

  it('keeps Create disabled until the Workspace has a name', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    expect(createButton).toBeDisabled();

    await user.type(workspaceName, 'Stark Industries');
    expect(createButton).toBeEnabled();

    await user.clear(workspaceName);
    expect(createButton).toBeDisabled();
  });

  it('treats a name of only spaces as no name', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, '   ');

    expect(createButton).toBeDisabled();
  });

  it('does not submit on Enter while there is no name', async () => {
    const user = userEvent.setup();
    push.mockClear();
    renderWithIntl(<CreateWorkspaceForm />);

    await user.type(fields().workspaceName, '   {Enter}');

    expect(push).not.toHaveBeenCalled();
  });

  it('moves on to Invite your teammates once named', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(createButton);

    expect(push).toHaveBeenCalledWith('/register/invite-teammates');
  });

  it('offers four optional Team sizes with none chosen', () => {
    renderWithIntl(<CreateWorkspaceForm />);
    const radios = screen.getAllByRole('radio');

    expect(radios.map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Just me',
      '2–10',
      '11–50',
      '50+',
    ]);
    for (const radio of radios) {
      expect(radio).not.toBeChecked();
    }
  });

  it('chooses one Team size at a time', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CreateWorkspaceForm />);

    await user.click(screen.getByRole('radio', { name: '2–10' }));
    await user.click(screen.getByRole('radio', { name: '50+' }));

    expect(screen.getByRole('radio', { name: '50+' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '2–10' })).not.toBeChecked();
  });

  it('words and formats the Team sizes in Thai', () => {
    renderWithIntl(<CreateWorkspaceForm />, { locale: 'th' });

    expect(
      screen.getByRole('group', { name: 'ขนาดทีม (ไม่บังคับ)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'แค่ฉันคนเดียว' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2–10' })).toBeInTheDocument();
  });
});
