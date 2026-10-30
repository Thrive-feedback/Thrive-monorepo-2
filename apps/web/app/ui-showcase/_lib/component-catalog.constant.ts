import {
  AutocompleteInputEntry,
  AutocompleteInputPreview,
} from '@/app/ui-showcase/_components/entries/autocomplete-input-entry';
import {
  AutocompleteTextareaEntry,
  AutocompleteTextareaPreview,
} from '@/app/ui-showcase/_components/entries/autocomplete-textarea-entry';
import {
  AvatarEntry,
  AvatarPreview,
} from '@/app/ui-showcase/_components/entries/avatar-entry';
import {
  AvatarGroupButtonEntry,
  AvatarGroupButtonPreview,
} from '@/app/ui-showcase/_components/entries/avatar-group-button-entry';
import {
  AvatarGroupEntry,
  AvatarGroupPreview,
} from '@/app/ui-showcase/_components/entries/avatar-group-entry';
import {
  BadgeEntry,
  BadgePreview,
} from '@/app/ui-showcase/_components/entries/badge-entry';
import {
  BreadcrumbEntry,
  BreadcrumbPreview,
} from '@/app/ui-showcase/_components/entries/breadcrumb-entry';
import {
  ButtonEntry,
  ButtonPreview,
} from '@/app/ui-showcase/_components/entries/button-entry';
import {
  ButtonGroupEntry,
  ButtonGroupPreview,
} from '@/app/ui-showcase/_components/entries/button-group-entry';
import {
  CardEntry,
  CardPreview,
} from '@/app/ui-showcase/_components/entries/card-entry';
import {
  CheckboxEntry,
  CheckboxPreview,
} from '@/app/ui-showcase/_components/entries/checkbox-entry';
import {
  DialogEntry,
  DialogPreview,
} from '@/app/ui-showcase/_components/entries/dialog-entry';
import {
  DrawerEntry,
  DrawerPreview,
} from '@/app/ui-showcase/_components/entries/drawer-entry';
import {
  DropdownMenuEntry,
  DropdownMenuPreview,
} from '@/app/ui-showcase/_components/entries/dropdown-menu-entry';
import {
  InputEntry,
  InputPreview,
} from '@/app/ui-showcase/_components/entries/input-entry';
import {
  LabelEntry,
  LabelPreview,
} from '@/app/ui-showcase/_components/entries/label-entry';
import {
  LetterEntry,
  LetterPreview,
} from '@/app/ui-showcase/_components/entries/letter-entry';
import {
  LinkEntry,
  LinkPreview,
} from '@/app/ui-showcase/_components/entries/link-entry';
import {
  MemberPickerDialogEntry,
  MemberPickerDialogPreview,
} from '@/app/ui-showcase/_components/entries/member-picker-dialog-entry';
import {
  PeopleStackEntry,
  PeopleStackPreview,
} from '@/app/ui-showcase/_components/entries/people-stack-entry';
import {
  PhotoAvatarEntry,
  PhotoAvatarPreview,
} from '@/app/ui-showcase/_components/entries/photo-avatar-entry';
import {
  PostcardDialogEntry,
  PostcardDialogPreview,
} from '@/app/ui-showcase/_components/entries/postcard-dialog-entry';
import {
  RadioGroupEntry,
  RadioGroupPreview,
} from '@/app/ui-showcase/_components/entries/radio-group-entry';
import {
  ResizableEntry,
  ResizablePreview,
} from '@/app/ui-showcase/_components/entries/resizable-entry';
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
  TableEntry,
  TablePreview,
} from '@/app/ui-showcase/_components/entries/table-entry';
import {
  TabsEntry,
  TabsPreview,
} from '@/app/ui-showcase/_components/entries/tabs-entry';
import {
  TaggedTextEntry,
  TaggedTextPreview,
} from '@/app/ui-showcase/_components/entries/tagged-text-entry';
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
import {
  ToggleEntry,
  TogglePreview,
} from '@/app/ui-showcase/_components/entries/toggle-entry';
import {
  TooltipEntry,
  TooltipPreview,
} from '@/app/ui-showcase/_components/entries/tooltip-entry';
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
  {
    level: 'organism',
    title: 'Organisms',
    folder: 'components/organisms/',
    description:
      'Name a domain concept, and may read data and decide business rules.',
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
    slug: 'button-group',
    name: 'ButtonGroup',
    level: 'atom',
    Preview: ButtonGroupPreview,
    Entry: ButtonGroupEntry,
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
    slug: 'toggle',
    name: 'Toggle',
    level: 'atom',
    Preview: TogglePreview,
    Entry: ToggleEntry,
  },
  {
    slug: 'select',
    name: 'Select',
    level: 'atom',
    Preview: SelectPreview,
    Entry: SelectEntry,
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    level: 'atom',
    Preview: TabsPreview,
    Entry: TabsEntry,
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    level: 'atom',
    Preview: BreadcrumbPreview,
    Entry: BreadcrumbEntry,
  },
  {
    slug: 'dropdown-menu',
    name: 'DropdownMenu',
    level: 'atom',
    Preview: DropdownMenuPreview,
    Entry: DropdownMenuEntry,
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    level: 'atom',
    Preview: DialogPreview,
    Entry: DialogEntry,
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    level: 'atom',
    Preview: DrawerPreview,
    Entry: DrawerEntry,
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    level: 'atom',
    Preview: TooltipPreview,
    Entry: TooltipEntry,
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    level: 'atom',
    Preview: AvatarPreview,
    Entry: AvatarEntry,
  },
  {
    slug: 'badge',
    name: 'Badge',
    level: 'atom',
    Preview: BadgePreview,
    Entry: BadgeEntry,
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
    slug: 'table',
    name: 'Table',
    level: 'atom',
    Preview: TablePreview,
    Entry: TableEntry,
  },
  {
    slug: 'resizable',
    name: 'Resizable',
    level: 'atom',
    Preview: ResizablePreview,
    Entry: ResizableEntry,
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
    slug: 'autocomplete-textarea',
    name: 'AutocompleteTextarea',
    level: 'molecule',
    Preview: AutocompleteTextareaPreview,
    Entry: AutocompleteTextareaEntry,
  },
  {
    slug: 'autocomplete-input',
    name: 'AutocompleteInput',
    level: 'molecule',
    Preview: AutocompleteInputPreview,
    Entry: AutocompleteInputEntry,
  },
  {
    slug: 'tagged-text',
    name: 'TaggedText',
    level: 'molecule',
    Preview: TaggedTextPreview,
    Entry: TaggedTextEntry,
  },
  {
    slug: 'avatar-group',
    name: 'AvatarGroup',
    level: 'molecule',
    Preview: AvatarGroupPreview,
    Entry: AvatarGroupEntry,
  },
  {
    slug: 'avatar-group-button',
    name: 'AvatarGroupButton',
    level: 'molecule',
    Preview: AvatarGroupButtonPreview,
    Entry: AvatarGroupButtonEntry,
  },
  {
    slug: 'people-stack',
    name: 'PeopleStack',
    level: 'molecule',
    Preview: PeopleStackPreview,
    Entry: PeopleStackEntry,
  },
  {
    slug: 'photo-avatar',
    name: 'PhotoAvatar',
    level: 'molecule',
    Preview: PhotoAvatarPreview,
    Entry: PhotoAvatarEntry,
  },
  {
    // Not `letter`: that address is the letter's first look, a page of its own.
    slug: 'letter-sheet',
    name: 'Letter',
    level: 'organism',
    Preview: LetterPreview,
    Entry: LetterEntry,
  },
  {
    slug: 'member-picker-dialog',
    name: 'MemberPickerDialog',
    level: 'organism',
    Preview: MemberPickerDialogPreview,
    Entry: MemberPickerDialogEntry,
  },
  {
    slug: 'postcard-dialog',
    name: 'PostcardDialog',
    level: 'organism',
    Preview: PostcardDialogPreview,
    Entry: PostcardDialogEntry,
  },
];
