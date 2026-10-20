import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  HASHTAG_RULE,
  MENTION_RULE,
} from '@/lib/feedback/text-tag-rules.constant';
import { AutocompleteTextarea } from './autocomplete-textarea';
import type { AutocompleteTrigger } from './use-tag-autocomplete';

const GOALS: AutocompleteTrigger = {
  rule: HASHTAG_RULE,
  label: 'Workspace Goals',
  tone: 'accent',
  options: ['ownership', 'ownershic', 'ลูกค้ามาก่อน'].map((name) => ({
    value: name,
    label: `#${name}`,
    keywords: [name],
  })),
};

const TEAMMATES: AutocompleteTrigger = {
  rule: MENTION_RULE,
  label: 'Teammates',
  tone: 'secondary',
  options: [
    {
      value: 'somchai.k',
      label: 'Somchai',
      detail: '@somchai.k',
      keywords: ['Somchai', 'Somchai Kaewmanee', 'somchai.k'],
    },
    {
      value: 'ann',
      label: 'Ann',
      detail: '@ann',
      keywords: ['Ann', 'Ann Lee', 'ann'],
    },
  ],
};

function Writing({
  triggers = [GOALS, TEAMMATES],
  initial = '',
  onKeyDown,
}: {
  triggers?: readonly AutocompleteTrigger[];
  initial?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}) {
  const [value, setValue] = useState(initial);
  return (
    <AutocompleteTextarea
      aria-label="Your feedback"
      value={value}
      triggers={triggers}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

function field() {
  return screen.getByRole('textbox', { name: 'Your feedback' });
}

function suggestionNames(listName: string) {
  return within(screen.getByRole('listbox', { name: listName }))
    .getAllByRole('option')
    .map((option) => option.textContent);
}

describe('AutocompleteTextarea', () => {
  it('offers every Workspace Goal by name once # is typed', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'Great work #');

    expect(suggestionNames('Workspace Goals')).toEqual([
      '#ownership',
      '#ownershic',
      '#ลูกค้ามาก่อน',
    ]);
    expect(field()).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('narrows what it offers as more is typed, ignoring letter case', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#OWNERSHIP');

    expect(suggestionNames('Workspace Goals')).toEqual(['#ownership']);
  });

  it('narrows on Thai typed right after a Thai word', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'ดีมาก#ลูกค้า');

    expect(suggestionNames('Workspace Goals')).toEqual(['#ลูกค้ามาก่อน']);
  });

  it('writes the one picked with Enter, in its own spelling, and a space after', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'Great work #OWN');
    await user.keyboard('{Enter}');

    expect(field()).toHaveValue('Great work #ownership ');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('moves through what it offers with the arrow keys, round from the last to the first', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}');
    const chosen = screen.getByRole('option', { selected: true });

    expect(chosen).toHaveTextContent('#ลูกค้ามาก่อน');
    expect(field()).toHaveAttribute('aria-activedescendant', chosen.id);
  });

  it('moves along the row of suggestions with Left and Right too, keeping the caret where it is', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'Go #');
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');

    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
      '#ownershic',
    );
    expect((field() as HTMLTextAreaElement).selectionStart).toBe(4);

    await user.keyboard('{ArrowLeft}{ArrowLeft}');

    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
      '#ลูกค้ามาก่อน',
    );

    await user.keyboard('{Enter}');

    expect(field()).toHaveValue('Go #ลูกค้ามาก่อน ');
  });

  it('leaves Left and Right to move the caret while nothing is offered', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'Great');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');

    expect((field() as HTMLTextAreaElement).selectionStart).toBe(3);
  });

  it('writes the one under the arrow with Tab', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#');
    await user.keyboard('{ArrowDown}{Tab}');

    expect(field()).toHaveValue('#ownershic ');
    expect(field()).toHaveFocus();
  });

  it('writes the one clicked, and keeps the caret in the field after it', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'Thanks #');
    await user.click(screen.getByRole('option', { name: '#ownershic' }));

    expect(field()).toHaveValue('Thanks #ownershic ');
    expect(field()).toHaveFocus();
    expect((field() as HTMLTextAreaElement).selectionStart).toBe(
      'Thanks #ownershic '.length,
    );
  });

  it('replaces only the tag being typed, keeping what follows the caret and its space', async () => {
    const user = userEvent.setup();
    render(<Writing initial="Great #own and more" />);

    await user.click(field());
    (field() as HTMLTextAreaElement).setSelectionRange(10, 10);
    fireEvent.select(field());
    await user.keyboard('{Enter}');

    expect(field()).toHaveValue('Great #ownership and more');
  });

  it('offers teammates on @, found by their name, and writes their slug', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), 'with @somch');

    expect(suggestionNames('Teammates')).toEqual(['Somchai@somchai.k']);

    await user.keyboard('{Enter}');

    expect(field()).toHaveValue('with @somchai.k ');
  });

  it('offers at most eight at once', async () => {
    const user = userEvent.setup();
    const many: AutocompleteTrigger = {
      ...GOALS,
      options: Array.from({ length: 12 }, (_, index) => ({
        value: `goal-${index}`,
        label: `#goal-${index}`,
        keywords: [`goal-${index}`],
      })),
    };
    render(<Writing triggers={[many]} />);

    await user.type(field(), '#goal');

    expect(suggestionNames('Workspace Goals')).toHaveLength(8);
  });

  it('closes on Escape for that tag, and opens again when it is typed on', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#own');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.type(field(), 'er');

    expect(suggestionNames('Workspace Goals')).toEqual([
      '#ownership',
      '#ownershic',
    ]);
  });

  it('closes when the tag ends at a space', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#own ');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes when focus leaves the field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Writing />
        <button type="button">Elsewhere</button>
      </>,
    );

    await user.type(field(), '#own');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens nothing when there is nothing to offer, and Enter starts a new line', async () => {
    const user = userEvent.setup();
    render(<Writing triggers={[{ ...GOALS, options: [] }]} />);

    await user.type(field(), 'Great #own{Enter}next');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(field()).toHaveValue('Great #own\nnext');
  });

  it('opens nothing for a hashtag no Workspace Goal matches', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#notalist');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('leaves Enter to an input method still composing a word', async () => {
    const user = userEvent.setup();
    render(<Writing />);

    await user.type(field(), '#own');
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });

    expect(field()).toHaveValue('#own');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('hands its own keys on to the caller while nothing is offered', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Writing onKeyDown={onKeyDown} />);

    await user.type(field(), 'a');

    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('colours the tags that name something, under exactly the text typed', async () => {
    const user = userEvent.setup();
    const { container } = render(<Writing />);

    await user.type(field(), 'Go #ownership and #notalist @ann');
    const highlights = container.querySelector('[data-slot="tag-highlights"]');

    expect(highlights).toHaveAttribute('aria-hidden', 'true');
    expect(highlights?.textContent).toBe('Go #ownership and #notalist @ann​');
    expect(
      within(highlights as HTMLElement).getByText('#ownership'),
    ).toHaveClass('text-fg-accent');
    expect(within(highlights as HTMLElement).getByText('@ann')).toHaveClass(
      'text-action-secondary',
    );
    expect(
      [...(highlights?.querySelectorAll('span') ?? [])].map(
        (span) => span.textContent,
      ),
    ).toEqual(['#ownership', '@ann']);
  });
});
