import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Text } from '@/components/atoms/text';
import { TaggedText } from '@/components/molecules/tagged-text';
import { TEXT_TAG_RULES } from '@/lib/feedback/text-tag-rules.constant';

const TAGS = [
  {
    char: '#',
    value: 'ownership',
    label: '#ownership',
    tone: 'accent' as const,
  },
  {
    char: '@',
    value: 'somchai.k',
    label: '@สมชาย',
    tone: 'secondary' as const,
  },
];

export function TaggedTextEntry() {
  return (
    <ShowcaseEntry
      name="TaggedText"
      level="molecule"
      origin="thrive"
      source="components/molecules/tagged-text.tsx"
      summary="Sent text with every tag it was bound to drawn as a pill reading that tag's label. Tags that were not bound stay as written."
      useFor="Reading back what AutocompleteTextarea or AutocompleteInput wrote — a Request message or a Feedback message."
      avoidFor="Text being typed; the autocomplete fields colour their own."
      usage={`import { TaggedText } from '@/components/molecules/tagged-text';

<p className="whitespace-pre-wrap">
  <TaggedText text={text} rules={TEXT_TAG_RULES} tags={tags} />
</p>`}
      props={[
        { name: 'text', type: 'string', description: 'As it was written.' },
        {
          name: 'rules',
          type: 'readonly TagRule[]',
          description: 'How tags are written in it.',
        },
        {
          name: 'tags',
          type: 'readonly TextTag[]',
          description:
            'What it was bound to: char, value (matched ignoring case), label and tone.',
        },
      ]}
      accessibility={[
        'Renders inline runs only, inside whatever paragraph or heading holds it.',
        'A pill reads as its label, so a mention is heard as the name, not the slug.',
      ]}
    >
      <StateCell label="Bound and unbound">
        <Text as="p" variant="body-2" className="whitespace-pre-wrap">
          <TaggedText
            text={
              'Great work last week #OWNERSHIP with @somchai.k.\n#notalist stays plain.'
            }
            rules={TEXT_TAG_RULES}
            tags={TAGS}
          />
        </Text>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TaggedTextPreview() {
  return (
    <Text as="p" variant="body-2">
      <TaggedText
        text="Great work #ownership with @somchai.k"
        rules={TEXT_TAG_RULES}
        tags={TAGS}
      />
    </Text>
  );
}
