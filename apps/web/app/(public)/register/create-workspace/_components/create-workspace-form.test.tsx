import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CreateWorkspaceForm } from './create-workspace-form';

function fields() {
  return {
    workspaceName: screen.getByRole('textbox', { name: 'Workspace name' }),
    teamSize: screen.getByRole('group', { name: 'Team size (optional)' }),
    createButton: screen.getByRole('button', { name: 'Create Workspace' }),
  };
}

describe('CreateWorkspaceForm', () => {
  it('requires a Workspace name', () => {
    render(<CreateWorkspaceForm />);

    expect(fields().workspaceName).toBeRequired();
  });

  it('refuses Create with no name, says why and focuses the field', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.click(createButton);

    expect(workspaceName).toBeInvalid();
    expect(workspaceName).toHaveAccessibleDescription(
      'Give your Workspace a name.',
    );
    expect(workspaceName).toHaveFocus();
  });

  it('treats a name of only spaces as no name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, '   ');
    await user.click(createButton);

    expect(workspaceName).toBeInvalid();
  });

  it('clears the refusal once a name is typed and accepts it', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.click(createButton);
    await user.type(workspaceName, 'Stark Industries');
    await user.click(createButton);

    expect(workspaceName).toBeValid();
    expect(
      screen.queryByText('Give your Workspace a name.'),
    ).not.toBeInTheDocument();
  });

  it('offers four optional Team sizes with none chosen', () => {
    render(<CreateWorkspaceForm />);
    const radios = screen.getAllByRole('radio');

    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
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
    render(<CreateWorkspaceForm />);

    await user.click(screen.getByRole('radio', { name: '2–10' }));
    await user.click(screen.getByRole('radio', { name: '50+' }));

    expect(screen.getByRole('radio', { name: '50+' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '2–10' })).not.toBeChecked();
  });
});
