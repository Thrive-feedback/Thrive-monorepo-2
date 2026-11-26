import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  OneOnOneTemplate,
  OneOnOneTemplateCatalog,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { Toaster } from '@/components/atoms/toaster';

const refresh = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
const keepOneOnOneTemplate = vi.fn();
const rewriteOneOnOneTemplate = vi.fn();
const removeOneOnOneTemplate = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-template-actions.service',
  () => ({
    keepOneOnOneTemplate: (...args: unknown[]) => keepOneOnOneTemplate(...args),
    rewriteOneOnOneTemplate: (...args: unknown[]) =>
      rewriteOneOnOneTemplate(...args),
    removeOneOnOneTemplate: (...args: unknown[]) =>
      removeOneOnOneTemplate(...args),
  }),
);

const { NewTemplate, TemplateLibrary } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/templates/_components/template-library'
);

const WORKSPACE_ID = '0196b4c8-0000-7000-8000-0000000000aa';
const KRITS_ID = '0196b4c8-0000-7000-8000-000000000011';
const OURS_ID = '0196b4c8-0000-7000-8000-000000000012';

const WEEKLY: OneOnOneTemplate = {
  key: 'weekly-check-in',
  scope: 'THRIVE',
  name: 'Weekly check-in',
  suggestedWhen: 'The default for every 1:1',
  questions: ['What went well this week?', "What's in your way?"],
  changeable: false,
};

const OURS: OneOnOneTemplate = {
  key: OURS_ID,
  scope: 'WORKSPACE',
  name: 'Team health',
  suggestedWhen: '',
  questions: ['How is the team?'],
  changeable: false,
};

const MINE: OneOnOneTemplate = {
  key: KRITS_ID,
  scope: 'PERSONAL',
  name: 'Sprint retro',
  suggestedWhen: 'After each sprint',
  questions: ['What slowed us?', 'What helped?'],
  changeable: true,
};

function catalog(
  items: readonly OneOnOneTemplate[],
  mayKeepForWorkspace = false,
): OneOnOneTemplateCatalog {
  return { items: [...items], mayKeepForWorkspace };
}

function draw(listed: OneOnOneTemplateCatalog) {
  render(
    <>
      <NewTemplate
        workspaceId={WORKSPACE_ID}
        workspaceName="Acme"
        mayKeepForWorkspace={listed.mayKeepForWorkspace}
      />
      <TemplateLibrary
        workspaceId={WORKSPACE_ID}
        workspaceName="Acme"
        catalog={listed}
      />
      <Toaster />
    </>,
  );
}

function section(name: string) {
  return screen.getByRole('region', { name });
}

beforeEach(() => {
  keepOneOnOneTemplate.mockReset();
  rewriteOneOnOneTemplate.mockReset();
  removeOneOnOneTemplate.mockReset();
  refresh.mockReset();
});

describe('TemplateLibrary', () => {
  it("shows the person's own first, then the Workspace's, then Thrive's, each with its questions in order", () => {
    draw(catalog([WEEKLY, OURS, MINE]));

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Yours', 'Acme’s', 'Thrive’s']);
    const yours = within(section('Yours'));
    expect(yours.getByRole('heading', { name: 'Sprint retro' })).toBeVisible();
    expect(yours.getByText('After each sprint')).toBeVisible();
    expect(
      yours
        .getAllByRole('listitem')
        .slice(1)
        .map((li) => li.textContent),
    ).toEqual(['What slowed us?', 'What helped?']);
  });

  it('offers Edit and Remove only where the person may change it, and Copy everywhere', () => {
    draw(catalog([WEEKLY, OURS, MINE]));

    const yours = within(section('Yours'));
    expect(
      yours.getByRole('button', { name: 'Edit Sprint retro' }),
    ).toBeVisible();
    expect(
      yours.getByRole('button', { name: 'Remove Sprint retro' }),
    ).toBeVisible();
    const ours = within(section('Acme’s'));
    expect(ours.queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(ours.queryByRole('button', { name: /^Remove/ })).toBeNull();
    expect(
      ours.getByRole('button', { name: 'Copy Team health' }),
    ).toBeVisible();
    expect(
      within(section('Thrive’s')).getByRole('button', {
        name: 'Copy Weekly check-in',
      }),
    ).toBeVisible();
  });

  it('says what an empty layer holds, and that Admins change the Workspace’s', () => {
    draw(catalog([WEEKLY]));

    expect(
      within(section('Yours')).getByText(/Nothing of your own yet/),
    ).toBeVisible();
    expect(
      within(section('Acme’s')).getByText('Acme keeps none yet.'),
    ).toBeVisible();
    expect(screen.getByText(/Admins change them/)).toBeVisible();
  });

  it("copies one of Thrive's as the person's own, under its own name, putting focus in a question just added", async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: KRITS_ID });
    draw(catalog([WEEKLY]));

    await userEvent.click(
      screen.getByRole('button', { name: 'Copy Weekly check-in' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Copy “Weekly check-in”',
    });
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Weekly check-in',
    );
    // A Member is not asked who it is for: it can only be their own.
    expect(within(dialog).queryByText('Who it’s for')).toBeNull();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Add a question' }),
    );
    expect(within(dialog).getByLabelText('Question 3')).toHaveFocus();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save copy' }),
    );

    await waitFor(() =>
      expect(keepOneOnOneTemplate).toHaveBeenCalledWith(
        WORKSPACE_ID,
        'PERSONAL',
        {
          name: 'Weekly check-in',
          suggestedWhen: 'The default for every 1:1',
          questions: [...WEEKLY.questions, ''],
        },
      ),
    );
    expect(await screen.findAllByText('Copy saved')).not.toHaveLength(0);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('lets an Admin keep a new template for everyone, and waits for a name and a question', async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: OURS_ID });
    draw(catalog([WEEKLY], true));

    await userEvent.click(screen.getByRole('button', { name: 'New template' }));
    const dialog = screen.getByRole('dialog', { name: 'A new template' });
    const save = within(dialog).getByRole('button', { name: 'Save template' });
    expect(save).toBeDisabled();
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Team health',
    );
    expect(save).toBeDisabled();
    await userEvent.type(
      within(dialog).getByLabelText('Question 1'),
      'How is the team?',
    );
    await userEvent.click(within(dialog).getByLabelText('Everyone in Acme'));
    await userEvent.click(save);

    await waitFor(() =>
      expect(keepOneOnOneTemplate).toHaveBeenCalledWith(
        WORKSPACE_ID,
        'WORKSPACE',
        {
          name: 'Team health',
          suggestedWhen: '',
          questions: ['How is the team?'],
        },
      ),
    );
  });

  it('keeps the dialog open with what was written when the API refuses it, and says why', async () => {
    rewriteOneOnOneTemplate.mockResolvedValue({
      ok: false,
      message: 'There is already a template by that name here.',
      code: 'ONE_ON_ONE_TEMPLATE_NAME_TAKEN',
    });
    draw(catalog([MINE]));

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Sprint retro' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Edit “Sprint retro”',
    });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Weekly check-in');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('There is already a template by that name here.'),
    ).toBeInTheDocument();
    expect(rewriteOneOnOneTemplate).toHaveBeenCalledWith(
      WORKSPACE_ID,
      KRITS_ID,
      expect.objectContaining({ name: 'Weekly check-in' }),
    );
    expect(dialog).toBeInTheDocument();
    expect(name).toHaveValue('Weekly check-in');
  });

  it('removes a template only once the person confirms, saying what becomes of its 1:1s', async () => {
    removeOneOnOneTemplate.mockResolvedValue({ ok: true });
    draw(catalog([MINE]));

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Sprint retro' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Remove “Sprint retro”?',
    });
    expect(
      within(dialog).getByText(
        /keep its questions until someone picks another/,
      ),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Keep it' }),
    );
    expect(removeOneOnOneTemplate).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Sprint retro' }),
    );
    await userEvent.click(
      within(
        screen.getByRole('dialog', { name: 'Remove “Sprint retro”?' }),
      ).getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() =>
      expect(removeOneOnOneTemplate).toHaveBeenCalledWith(
        WORKSPACE_ID,
        KRITS_ID,
      ),
    );
    expect(await screen.findAllByText('Template removed')).not.toHaveLength(0);
  });

  it('edits a template from what it says now, and saves the rewrite by its key', async () => {
    rewriteOneOnOneTemplate.mockResolvedValue({ ok: true });
    draw(catalog([MINE]));

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Sprint retro' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Edit “Sprint retro”',
    });
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Sprint retro',
    );
    expect(
      within(dialog).getByRole('textbox', { name: 'When to use it' }),
    ).toHaveValue('After each sprint');
    const second = within(dialog).getByLabelText('Question 2');
    expect(second).toHaveValue('What helped?');
    await userEvent.clear(second);
    await userEvent.type(second, 'What should we keep?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(rewriteOneOnOneTemplate).toHaveBeenCalledWith(
        WORKSPACE_ID,
        KRITS_ID,
        {
          name: 'Sprint retro',
          suggestedWhen: 'After each sprint',
          questions: ['What slowed us?', 'What should we keep?'],
        },
      ),
    );
    expect(keepOneOnOneTemplate).not.toHaveBeenCalled();
    expect(await screen.findAllByText('Template saved')).not.toHaveLength(0);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('names an Admin’s copy of the Workspace’s a copy only while it is kept for everyone too', async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: KRITS_ID });
    draw(catalog([{ ...OURS, changeable: true }], true));

    await userEvent.click(
      screen.getByRole('button', { name: 'Copy Team health' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Copy “Team health”' });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue('Team health');
    await userEvent.click(within(dialog).getByLabelText('Everyone in Acme'));
    expect(name).toHaveValue('Team health (copy)');
    await userEvent.click(within(dialog).getByLabelText('Just me'));
    expect(name).toHaveValue('Team health');
  });

  it('gives focus to the layer once the template removed from it is gone', async () => {
    removeOneOnOneTemplate.mockResolvedValue({ ok: true });
    const { rerender } = render(
      <TemplateLibrary
        workspaceId={WORKSPACE_ID}
        workspaceName="Acme"
        catalog={catalog([MINE])}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Sprint retro' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Remove “Sprint retro”?',
    });
    // The page is read again as the remove goes, so the card leaves before the dialog closes.
    removeOneOnOneTemplate.mockImplementation(async () => {
      rerender(
        <TemplateLibrary
          workspaceId={WORKSPACE_ID}
          workspaceName="Acme"
          catalog={catalog([])}
        />,
      );
      return { ok: true };
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Yours' })).toHaveFocus(),
    );
  });
});
