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
  '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_lib/one-on-one-template-actions.service',
  () => ({
    keepOneOnOneTemplate: (...args: unknown[]) => keepOneOnOneTemplate(...args),
    rewriteOneOnOneTemplate: (...args: unknown[]) =>
      rewriteOneOnOneTemplate(...args),
    removeOneOnOneTemplate: (...args: unknown[]) =>
      removeOneOnOneTemplate(...args),
  }),
);

const { TemplateLibrary } = await import(
  '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_components/template-library'
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
      <TemplateLibrary
        workspaceId={WORKSPACE_ID}
        workspaceName="Acme"
        catalog={listed}
      />
      <Toaster />
    </>,
  );
}

/** Opens a template's menu and picks one of its actions, as a person does. */
async function choose(action: 'Edit' | 'Copy' | 'Remove', template: string) {
  await userEvent.click(
    screen.getByRole('button', { name: `Manage ${template}` }),
  );
  await userEvent.click(await screen.findByRole('menuitem', { name: action }));
}

/** The actions a template's menu offers. */
async function actionsOf(template: string): Promise<string[]> {
  await userEvent.click(
    screen.getByRole('button', { name: `Manage ${template}` }),
  );
  const items = (await screen.findAllByRole('menuitem')).map(
    (item) => item.textContent ?? '',
  );
  await userEvent.keyboard('{Escape}');
  return items;
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
  it("shows the person's own first, then the Workspace's, then Thrive's, each a card of its own", () => {
    draw(catalog([WEEKLY, OURS, MINE]));

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Your templates', 'Acme’s templates', 'Thrive’s templates']);
    const yours = within(section('Your templates'));
    const card = yours.getByRole('button', { name: /^Sprint retro/ });
    expect(card).toHaveTextContent('After each sprint');
    expect(card).toHaveTextContent('2 questions');
    expect(yours.queryByText('What slowed us?')).not.toBeVisible();
  });

  it('opens a template to its agenda, in order, and folds it away again', async () => {
    draw(catalog([MINE]));
    const card = screen.getByRole('button', { name: /^Sprint retro/ });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(card);

    expect(card).toHaveAttribute('aria-expanded', 'true');
    const agenda = document.getElementById(
      card.getAttribute('aria-controls') ?? '',
    );
    expect(
      within(agenda as HTMLElement)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['What slowed us?', 'What helped?']);
    await userEvent.click(card);
    expect(screen.queryByText('What slowed us?')).not.toBeVisible();
  });

  it('offers Edit and Remove only where the person may change it, and Copy everywhere', async () => {
    draw(catalog([WEEKLY, OURS, MINE]));

    expect(await actionsOf('Sprint retro')).toEqual(['Edit', 'Copy', 'Remove']);
    expect(await actionsOf('Team health')).toEqual(['Copy']);
    expect(await actionsOf('Weekly check-in')).toEqual(['Copy']);
  });

  it('says what an empty layer holds, and that Admins change the Workspace’s', () => {
    draw(catalog([WEEKLY]));

    expect(
      within(section('Your templates')).getByText(
        /Copy one below, or start a new one/,
      ),
    ).toBeVisible();
    expect(
      within(section('Acme’s templates')).getByText('None yet.'),
    ).toBeVisible();
    expect(
      screen.getByText('Everyone can use these. Admins change them.'),
    ).toBeVisible();
    // A Member starts a new one only as their own, from their own card.
    expect(
      within(section('Your templates')).getByRole('button', {
        name: 'New template',
      }),
    ).toBeVisible();
    expect(
      within(section('Acme’s templates')).queryByRole('button', {
        name: /New template/,
      }),
    ).not.toBeInTheDocument();
  });

  it("copies one of Thrive's as the person's own, under its own name, with a question added under the rest", async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: KRITS_ID });
    draw(catalog([WEEKLY]));

    await choose('Copy', 'Weekly check-in');
    const dialog = screen.getByRole('dialog', {
      name: 'Copy “Weekly check-in”',
    });
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Weekly check-in',
    );
    // A Member is not asked who it is for: it can only be their own.
    expect(within(dialog).queryByText('Who it’s for')).toBeNull();
    // The questions are rows as an agenda's topics are, with no numbers drawn.
    expect(within(dialog).queryByText('1')).not.toBeInTheDocument();
    const adding = within(dialog).getByRole('textbox', {
      name: 'Add a question',
    });
    await userEvent.type(adding, 'What else?{Enter}');
    expect(within(dialog).getByLabelText('Question 3')).toHaveValue(
      'What else?',
    );
    expect(adding).toHaveValue('');
    expect(adding).toHaveFocus();
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
          questions: [...WEEKLY.questions, 'What else?'],
        },
      ),
    );
    expect(await screen.findAllByText('Copy saved')).not.toHaveLength(0);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('lets an Admin start a new template for everyone from the Workspace’s card, and waits for a name and a question', async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: OURS_ID });
    draw(catalog([WEEKLY], true));

    await userEvent.click(
      screen.getByRole('button', { name: 'New template for everyone in Acme' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'A new template' });
    const save = within(dialog).getByRole('button', { name: 'Save template' });
    expect(save).toBeDisabled();
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Team health',
    );
    expect(save).toBeDisabled();
    expect(within(dialog).getByLabelText('Everyone in Acme')).toBeChecked();
    // Written and not yet added, it is still kept with the template.
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Add a question' }),
      'How is the team?',
    );
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

    await choose('Edit', 'Sprint retro');
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

  it('removes a template only once the person confirms, saying what becomes of the meetings that used it', async () => {
    removeOneOnOneTemplate.mockResolvedValue({ ok: true });
    draw(catalog([MINE]));

    await choose('Remove', 'Sprint retro');
    const dialog = screen.getByRole('dialog', {
      name: 'Remove “Sprint retro”?',
    });
    expect(
      within(dialog).getByText(
        /Meetings that already used it keep its questions/,
      ),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Keep it' }),
    );
    expect(removeOneOnOneTemplate).not.toHaveBeenCalled();

    await choose('Remove', 'Sprint retro');
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

    await choose('Edit', 'Sprint retro');
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

  it('takes a question out with its ×, and offers each a grip to move it', async () => {
    rewriteOneOnOneTemplate.mockResolvedValue({ ok: true });
    draw(catalog([MINE]));

    await choose('Edit', 'Sprint retro');
    const dialog = screen.getByRole('dialog', {
      name: 'Edit “Sprint retro”',
    });
    expect(
      within(dialog).getByRole('button', { name: 'Move What helped?' }),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remove What slowed us?' }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(rewriteOneOnOneTemplate).toHaveBeenCalledWith(
        WORKSPACE_ID,
        KRITS_ID,
        expect.objectContaining({ questions: ['What helped?'] }),
      ),
    );
  });

  it('cancels a question picked up with the keyboard on Escape, and keeps the dialog open with what was written', async () => {
    draw(catalog([MINE]));

    await choose('Edit', 'Sprint retro');
    const dialog = screen.getByRole('dialog', {
      name: 'Edit “Sprint retro”',
    });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await userEvent.type(name, ' 2');
    within(dialog)
      .getByRole('button', { name: 'Move What slowed us?' })
      .focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Escape}');

    expect(dialog).toBeInTheDocument();
    expect(name).toHaveValue('Sprint retro 2');
    // A second Escape, with nothing picked up, closes it as usual.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('names an Admin’s copy of the Workspace’s a copy only while it is kept for everyone too', async () => {
    keepOneOnOneTemplate.mockResolvedValue({ ok: true, id: KRITS_ID });
    draw(catalog([{ ...OURS, changeable: true }], true));

    await choose('Copy', 'Team health');
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

    await choose('Remove', 'Sprint retro');
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
      expect(
        screen.getByRole('heading', { name: 'Your templates' }),
      ).toHaveFocus(),
    );
  });
});
