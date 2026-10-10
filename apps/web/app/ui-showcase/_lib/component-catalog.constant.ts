import {
  AvatarEntry,
  AvatarPreview,
} from '@/app/ui-showcase/_components/entries/avatar-entry';
import {
  ButtonEntry,
  ButtonPreview,
} from '@/app/ui-showcase/_components/entries/button-entry';
import {
  CardEntry,
  CardPreview,
} from '@/app/ui-showcase/_components/entries/card-entry';
import {
  CheckboxEntry,
  CheckboxPreview,
} from '@/app/ui-showcase/_components/entries/checkbox-entry';
import {
  GoogleSignInButtonEntry,
  GoogleSignInButtonPreview,
} from '@/app/ui-showcase/_components/entries/google-sign-in-button-entry';
import {
  InputEntry,
  InputPreview,
} from '@/app/ui-showcase/_components/entries/input-entry';
import {
  LabelEntry,
  LabelPreview,
} from '@/app/ui-showcase/_components/entries/label-entry';
import {
  LinkEntry,
  LinkPreview,
} from '@/app/ui-showcase/_components/entries/link-entry';
import {
  RadioGroupEntry,
  RadioGroupPreview,
} from '@/app/ui-showcase/_components/entries/radio-group-entry';
import {
  SelectEntry,
  SelectPreview,
} from '@/app/ui-showcase/_components/entries/select-entry';
import {
  SkeletonEntry,
  SkeletonPreview,
} from '@/app/ui-showcase/_components/entries/skeleton-entry';
import {
  SpinnerEntry,
  SpinnerPreview,
} from '@/app/ui-showcase/_components/entries/spinner-entry';
import {
  SwitchEntry,
  SwitchPreview,
} from '@/app/ui-showcase/_components/entries/switch-entry';
import {
  TextAreaFieldEntry,
  TextAreaFieldPreview,
} from '@/app/ui-showcase/_components/entries/text-area-field-entry';
import {
  TextEntry,
  TextPreview,
} from '@/app/ui-showcase/_components/entries/text-entry';
import {
  TextFieldEntry,
  TextFieldPreview,
} from '@/app/ui-showcase/_components/entries/text-field-entry';
import {
  TextareaEntry,
  TextareaPreview,
} from '@/app/ui-showcase/_components/entries/textarea-entry';
import {
  ToastEntry,
  ToastPreview,
} from '@/app/ui-showcase/_components/entries/toast-entry';
import type { AtomicLevel } from '@/app/ui-showcase/_components/level-badge';

export type ShowcaseComponent = {
  slug: string;
  name: string;
  level: AtomicLevel;
  Preview: () => React.ReactNode;
  Entry: () => React.ReactNode;
};

export const ATOMIC_LEVELS = [
  {
    level: 'atom',
    title: 'Atoms',
    folder: 'components/atoms/',
    description:
      'Compose nothing else from this set. Most come from shadcn/ui, restyled with our tokens.',
  },
  {
    level: 'molecule',
    title: 'Molecules',
    folder: 'components/molecules/',
    description:
      'Arrange atoms into one job, and add nothing but their arrangement.',
  },
] as const;

/**
 * Every component the showcase knows, in the order the index and the previous/next links
 * follow. The slug is the URL (`/ui-showcase/<slug>`), so renaming one is a broken link.
 * Adding a component is one row here, one entry and one preview.
 */
export const COMPONENT_CATALOG: readonly ShowcaseComponent[] = [
  {
    slug: 'text',
    name: 'Text',
    level: 'atom',
    Preview: TextPreview,
    Entry: TextEntry,
  },
  {
    slug: 'button',
    name: 'Button',
    level: 'atom',
    Preview: ButtonPreview,
    Entry: ButtonEntry,
  },
  {
    slug: 'link',
    name: 'Link',
    level: 'atom',
    Preview: LinkPreview,
    Entry: LinkEntry,
  },
  {
    slug: 'input',
    name: 'Input',
    level: 'atom',
    Preview: InputPreview,
    Entry: InputEntry,
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    level: 'atom',
    Preview: TextareaPreview,
    Entry: TextareaEntry,
  },
  {
    slug: 'label',
    name: 'Label',
    level: 'atom',
    Preview: LabelPreview,
    Entry: LabelEntry,
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    level: 'atom',
    Preview: CheckboxPreview,
    Entry: CheckboxEntry,
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    level: 'atom',
    Preview: RadioGroupPreview,
    Entry: RadioGroupEntry,
  },
  {
    slug: 'switch',
    name: 'Switch',
    level: 'atom',
    Preview: SwitchPreview,
    Entry: SwitchEntry,
  },
  {
    slug: 'select',
    name: 'Select',
    level: 'atom',
    Preview: SelectPreview,
    Entry: SelectEntry,
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    level: 'atom',
    Preview: AvatarPreview,
    Entry: AvatarEntry,
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    level: 'atom',
    Preview: SkeletonPreview,
    Entry: SkeletonEntry,
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    level: 'atom',
    Preview: SpinnerPreview,
    Entry: SpinnerEntry,
  },
  {
    slug: 'toast',
    name: 'Toast',
    level: 'atom',
    Preview: ToastPreview,
    Entry: ToastEntry,
  },
  {
    slug: 'card',
    name: 'Card',
    level: 'atom',
    Preview: CardPreview,
    Entry: CardEntry,
  },
  {
    slug: 'text-field',
    name: 'TextField',
    level: 'molecule',
    Preview: TextFieldPreview,
    Entry: TextFieldEntry,
  },
  {
    slug: 'text-area-field',
    name: 'TextAreaField',
    level: 'molecule',
    Preview: TextAreaFieldPreview,
    Entry: TextAreaFieldEntry,
  },
  {
    slug: 'google-sign-in-button',
    name: 'GoogleSignInButton',
    level: 'molecule',
    Preview: GoogleSignInButtonPreview,
    Entry: GoogleSignInButtonEntry,
  },
];
