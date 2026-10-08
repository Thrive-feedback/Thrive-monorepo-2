import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateWorkspaceState } from '@/app/(signed-in)/register/create-workspace/_lib/create-workspace-state.type';
import { CreateWorkspaceForm } from './create-workspace-form';

const createWorkspace =
  vi.fn<
    (
      previous: CreateWorkspaceState,
      formData: FormData,
    ) => Promise<CreateWorkspaceState>
  >();
vi.mock(
  '@/app/(signed-in)/register/create-workspace/_lib/workspace-actions.service',
  () => ({
    createWorkspace: (previous: CreateWorkspaceState, formData: FormData) =>
      createWorkspace(previous, formData),
  }),
);

beforeEach(() => {
  createWorkspace.mockReset();
});

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

  it('keeps Create disabled until the Workspace has a name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    expect(createButton).toBeDisabled();

    await user.type(workspaceName, 'Stark Industries');
    expect(createButton).toBeEnabled();

    await user.clear(workspaceName);
    expect(createButton).toBeDisabled();
  });

  it('treats a name of only spaces as no name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, '   ');

    expect(createButton).toBeDisabled();
  });

  it('does not submit on Enter while there is no name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);

    await user.type(fields().workspaceName, '   {Enter}');

    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it('creates the Workspace with the name and the picked team size', async () => {
    createWorkspace.mockResolvedValue({});
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(screen.getByRole('radio', { name: '11–50' }));
    await user.click(createButton);

    const formData = createWorkspace.mock.lastCall?.[1];
    expect(formData?.get('workspaceName')).toBe('Stark Industries');
    expect(formData?.get('teamSize')).toBe('FROM_11_TO_50');
  });

  it('sends no team size when none was picked', async () => {
    createWorkspace.mockResolvedValue({});
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(createButton);

    expect(createWorkspace.mock.lastCall?.[1].get('teamSize')).toBeNull();
  });

  it('keeps Create disabled while the Workspace is being created, so it is not sent twice', async () => {
    let finishCreating = (_state: CreateWorkspaceState) => {};
    createWorkspace.mockReturnValue(
      new Promise((resolve) => {
        finishCreating = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(createButton);

    expect(createButton).toBeDisabled();
    // React holds every later transition until a pending action settles, so this one must.
    await act(async () => finishCreating({}));
  });

  it('shows why the name was refused beside it, and keeps what was typed and picked', async () => {
    createWorkspace.mockResolvedValue({
      fieldErrors: { workspaceName: 'Use 100 characters or fewer.' },
    });
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(screen.getByRole('radio', { name: '50+' }));
    await user.click(createButton);

    expect(
      await screen.findByText('Use 100 characters or fewer.'),
    ).toBeInTheDocument();
    expect(workspaceName).toBeInvalid();
    expect(workspaceName).toHaveValue('Stark Industries');
    expect(screen.getByRole('radio', { name: '50+' })).toBeChecked();
  });

  it('says so when creating failed for another reason', async () => {
    createWorkspace.mockResolvedValue({
      formError: "We couldn't create your Workspace. Please try again.",
    });
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);
    const { workspaceName, createButton } = fields();

    await user.type(workspaceName, 'Stark Industries');
    await user.click(createButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't create your Workspace. Please try again.",
    );
    expect(createButton).toBeEnabled();
  });

  it('offers four optional Team sizes with none chosen', () => {
    render(<CreateWorkspaceForm />);
    const radios = screen.getAllByRole('radio');

    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
      'JUST_ME',
      'FROM_2_TO_10',
      'FROM_11_TO_50',
      'OVER_50',
    ]);
    expect(
      screen
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Just me', '2–10', '11–50', '50+']);
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
