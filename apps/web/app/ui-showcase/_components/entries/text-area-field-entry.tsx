import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { FIELD_PROPS } from '@/app/ui-showcase/_lib/field-props.constant';
import { TextAreaField } from '@/components/molecules/text-area-field';

export function TextAreaFieldEntry() {
  return (
    <ShowcaseEntry
      name="TextAreaField"
      level="molecule"
      origin="thrive"
      source="components/molecules/text-area-field.tsx — Label + Textarea"
      summary="A multi-line input that grows with what is typed, with its label and one line of help or error."
      useFor="Feedback, notes, descriptions — anything longer than a line."
      avoidFor="A name, an email or anything that fits on one line."
      usage={`import { TextAreaField } from '@/components/molecules/text-area-field';

<TextAreaField
  label="What went well?"
  name="praise"
  helperText="Be specific: what did they do, and what did it change?"
/>`}
      props={[
        ...FIELD_PROPS,
        {
          name: '...rest',
          type: "ComponentProps<'textarea'> (no id)",
          description:
            'value/onChange, name, rows, maxLength… The id is generated.',
        },
      ]}
      accessibility={[
        'Same labelling and description as TextField.',
        'Enter adds a line; it never submits the form.',
      ]}
    >
      <StateCell label="Default">
        <TextAreaField
          label="What went well?"
          placeholder="Be specific"
          helperText="They will see this with your name."
        />
      </StateCell>
      <StateCell label="Error">
        <TextAreaField
          label="What went well?"
          errorMessage="Write at least one sentence."
          required
        />
      </StateCell>
      <StateCell label="Disabled">
        <TextAreaField
          label="What went well?"
          defaultValue="Shipped the sign-in page on time."
          disabled
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TextAreaFieldPreview() {
  return (
    <TextAreaField
      label="What went well?"
      errorMessage="Write at least one sentence."
      className="w-full"
    />
  );
}
