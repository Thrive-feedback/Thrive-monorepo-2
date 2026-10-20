import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { AutocompleteTextareaDemo } from './tag-autocomplete-demo';

export function AutocompleteTextareaEntry() {
  return (
    <ShowcaseEntry
      name="AutocompleteTextarea"
      level="molecule"
      origin="thrive"
      source="components/molecules/autocomplete-textarea.tsx — Textarea + suggestion chips + coloured tags"
      summary="A Textarea that completes tags — # and a name, @ and a slug — with suggestions in chips above the box, and colours every tag that names one."
      useFor="Writing that can name things the product knows: Workspace Goals and teammates in Feedback. TextAreaField takes the same triggers."
      avoidFor="Free text with nothing to complete; use Textarea or TextAreaField."
      usage={`import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';

<AutocompleteTextarea
  aria-label="Feedback"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  triggers={[{ rule: HASHTAG_RULE, label: 'Goals', tone: 'accent', options }]}
/>`}
      props={[
        {
          name: 'value',
          type: 'string',
          description:
            'Controlled. Picking a suggestion goes through onChange like typing does.',
        },
        {
          name: 'triggers',
          type: 'readonly AutocompleteTrigger[]',
          description:
            'Each kind of tag: its rule (char, body, typing), the list label, its tone and its options.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'textarea'>",
          description: 'Everything a Textarea takes.',
        },
      ]}
      accessibility={[
        'Stays a textbox with aria-autocomplete="list"; focus never leaves it.',
        'Any arrow key moves through the suggestions while they are open (Right and Down forward, Left and Up back), announced through aria-activedescendant; Enter or Tab picks; Escape closes them for that tag.',
        'Enter is left alone while an input method is composing, so Thai and other scripts commit normally.',
        'The colour layer is aria-hidden: the textarea is the only thing read.',
      ]}
    >
      <StateCell label="Empty — type # or @">
        <AutocompleteTextareaDemo />
      </StateCell>
      <StateCell label="With tags">
        <AutocompleteTextareaDemo initial="ดีมาก#ลูกค้ามาก่อน and thanks @nok — #notalist stays plain." />
      </StateCell>
      <StateCell label="Disabled">
        <AutocompleteTextareaDemo initial="Great work #ownership" disabled />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AutocompleteTextareaPreview() {
  return <AutocompleteTextareaDemo initial="Great work #ownership @nok" />;
}
