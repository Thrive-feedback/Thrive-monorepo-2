import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEXT_TAG_RULES } from '@/lib/feedback/text-tag-rules.constant';
import { TaggedText, type TextTag } from './tagged-text';

const OWNERSHIP: TextTag = {
  char: '#',
  value: 'ownership',
  label: '#ownership',
  tone: 'accent',
};
const CARA: TextTag = {
  char: '@',
  value: 'cara.lee',
  label: '@Cara',
  tone: 'secondary',
};

function renderInParagraph(text: string, tags: readonly TextTag[]) {
  render(
    <p data-testid="text">
      <TaggedText text={text} rules={TEXT_TAG_RULES} tags={tags} />
    </p>,
  );
}

describe('TaggedText', () => {
  it('shows a bound hashtag in the spelling it was bound with, whatever case was written', () => {
    renderInParagraph('Great work #OWNERSHIP!', [OWNERSHIP]);

    expect(screen.getByTestId('text')).toHaveTextContent(
      'Great work #ownership!',
    );
    expect(screen.getByText('#ownership')).toHaveClass('rounded-chip');
  });

  it('shows a bound mention by the name the Member went by', () => {
    renderInParagraph('You and @cara.lee kept the room.', [CARA]);

    expect(screen.getByTestId('text')).toHaveTextContent(
      'You and @Cara kept the room.',
    );
    expect(screen.getByText('@Cara')).toHaveClass('text-action-secondary');
  });

  it('leaves a tag that was not bound as the plain text written', () => {
    renderInParagraph('#notalist and @dan', [OWNERSHIP, CARA]);

    expect(screen.getByTestId('text')).toHaveTextContent('#notalist and @dan');
    expect(screen.getByTestId('text').querySelector('span')).toBeNull();
  });

  it('keeps every line break written', () => {
    renderInParagraph('Line one\n\nLine two #ownership', [OWNERSHIP]);

    expect(screen.getByTestId('text').textContent).toBe(
      'Line one\n\nLine two #ownership',
    );
  });
});
