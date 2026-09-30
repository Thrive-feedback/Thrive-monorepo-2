import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { FIELD_PROPS } from '@/app/ui-showcase/_lib/field-props.constant';
import { TextField } from '@/components/molecules/text-field';

export function TextFieldEntry() {
  return (
    <ShowcaseEntry
      name="TextField"
      level="molecule"
      origin="thrive"
      source="components/molecules/text-field.tsx — Label + Input"
      summary="A single-line input with its label and one line of help or error."
      useFor="Every single-line field on a form."
      avoidFor="Long text (TextAreaField) or a choice from a fixed list (Select, RadioGroup)."
      usage={`import { TextField } from '@/components/molecules/text-field';

<TextField
  label="Full Name"
  name="fullName"
  autoComplete="name"
  required
  value={fullName}
  onChange={(event) => setFullName(event.target.value)}
  errorMessage={errors.fullName}
/>`}
      props={[
        ...FIELD_PROPS,
        {
          name: '...rest',
          type: "ComponentProps<'input'> (no id)",
          description:
            'value/onChange, name, type, placeholder, autoComplete… The id is generated.',
        },
      ]}
      accessibility={[
        'The label is a real <label>; clicking it focuses the input.',
        'Helper or error text is linked with aria-describedby, so it is read with the field.',
        'The asterisk is hidden from screen readers; “required” is announced instead.',
      ]}
    >
      <StateCell label="Default">
        <TextField label="Full Name" placeholder="Enter your name" />
      </StateCell>
      <StateCell label="Required, with help">
        <TextField
          label="What should we call you?"
          placeholder="e.g. Ton, P'Mod, Tony"
          helperText="This will appear on your desk and Kudo cards."
          required
        />
      </StateCell>
      <StateCell label="Focused">
        <TextField label="Full Name" defaultValue="Tony" data-focus-preview />
      </StateCell>
      <StateCell label="Error">
        <TextField
          label="Email"
          defaultValue="tony@"
          errorMessage="Enter a full email address."
        />
      </StateCell>
      <StateCell label="Disabled">
        <TextField label="Workspace" defaultValue="Stark Industries" disabled />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TextFieldPreview() {
  return (
    <TextField
      label="Full Name"
      placeholder="Enter your name"
      className="w-full"
      required
    />
  );
}
