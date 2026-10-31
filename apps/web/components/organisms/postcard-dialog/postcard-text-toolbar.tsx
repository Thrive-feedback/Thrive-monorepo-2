import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Toggle } from '@/components/atoms/toggle';
import { cn } from '@/lib/cn.util';
import {
  type CardInk,
  POSTCARD_ALIGN_KEYS,
  POSTCARD_FONT_KEYS,
  POSTCARD_FONTS,
  POSTCARD_INK_KEYS,
  POSTCARD_INKS,
  POSTCARD_SIZES,
  type PostcardAlign,
  type PostcardInk,
  type PostcardTextStyle,
} from './postcard-style.constant';
import {
  PostcardToolButton,
  PostcardToolDivider,
} from './postcard-tool-button';

const ALIGNS: Readonly<
  Record<
    PostcardAlign,
    { label: string; Icon: React.ComponentType<{ className?: string }> }
  >
> = {
  left: { label: 'Left', Icon: AlignLeftIcon },
  center: { label: 'Centre', Icon: AlignCenterIcon },
  right: { label: 'Right', Icon: AlignRightIcon },
};

export type CardTextToolbarProps<Ink extends CardInk> = {
  textStyle: PostcardTextStyle<Ink>;
  /** The inks offered, in order. */
  inks: readonly Ink[];
  onTextStyleChange: (change: Partial<PostcardTextStyle<Ink>>) => void;
  /** Done: the writer has finished styling, so the bar's usual tools and Send come back. */
  onDone: () => void;
};

/**
 * A card's floating bar while its message is being written: its font, its size along the type
 * scale, its alignment and its ink, then Done. On a phone the font and ink keep their swatches and
 * drop their names. Memoise it per card, as `PostcardTextToolbar` is: typing the message changes
 * none of its props.
 */
export function CardTextToolbar<Ink extends CardInk>({
  textStyle,
  inks,
  onTextStyleChange,
  onDone,
}: CardTextToolbarProps<Ink>) {
  const size = POSTCARD_SIZES[textStyle.sizeStep];
  const font = POSTCARD_FONTS[textStyle.font];
  const ink = POSTCARD_INKS[textStyle.ink];

  return (
    <>
      <span className="px-2.5 text-subtitle-4 max-sm:hidden">Text</span>
      <PostcardToolDivider />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PostcardToolButton>
            <span aria-hidden="true" className="font-semibold">
              Aa
            </span>
            <span className={cn('max-sm:sr-only', font.className)}>
              {font.label}
            </span>
            <span className="sr-only"> font</span>
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </PostcardToolButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-60">
          <DropdownMenuRadioGroup
            value={textStyle.font}
            onValueChange={(value) => {
              const chosen = POSTCARD_FONT_KEYS.find((key) => key === value);
              if (chosen) {
                onTextStyleChange({ font: chosen });
              }
            }}
          >
            {POSTCARD_FONT_KEYS.map((key) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className="flex-col items-start gap-0"
              >
                <span
                  className={cn('text-body-1', POSTCARD_FONTS[key].className)}
                >
                  {POSTCARD_FONTS[key].label}
                </span>
                <span className="text-body-3 text-fg-secondary">
                  {POSTCARD_FONTS[key].note}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <PostcardToolDivider />
      {/* biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a row of tools is a plain named group. */}
      <div role="group" aria-label="Text size" className="flex items-center">
        <PostcardToolButton
          aria-label="Smaller"
          aria-disabled={textStyle.sizeStep === 0}
          onClick={() =>
            textStyle.sizeStep > 0 &&
            onTextStyleChange({ sizeStep: textStyle.sizeStep - 1 })
          }
          className="px-2"
        >
          <MinusIcon aria-hidden="true" className="size-4" />
        </PostcardToolButton>
        <output
          aria-live="polite"
          className="w-12 text-center text-body-2 tabular-nums"
        >
          {size?.px} px
        </output>
        <PostcardToolButton
          aria-label="Larger"
          aria-disabled={textStyle.sizeStep === POSTCARD_SIZES.length - 1}
          onClick={() =>
            textStyle.sizeStep < POSTCARD_SIZES.length - 1 &&
            onTextStyleChange({ sizeStep: textStyle.sizeStep + 1 })
          }
          className="px-2"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </PostcardToolButton>
      </div>
      <PostcardToolDivider />
      {/* biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a row of tools is a plain named group. */}
      <div role="group" aria-label="Alignment" className="flex items-center">
        {POSTCARD_ALIGN_KEYS.map((key) => {
          const { label, Icon } = ALIGNS[key];
          return (
            <Toggle
              key={key}
              size="sm"
              aria-label={`Align ${label.toLowerCase()}`}
              pressed={textStyle.align === key}
              onPressedChange={() => onTextStyleChange({ align: key })}
            >
              <Icon aria-hidden="true" className="size-4.5" />
            </Toggle>
          );
        })}
      </div>
      <PostcardToolDivider />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PostcardToolButton>
            <span
              aria-hidden="true"
              className={cn('size-4 rounded-full', ink.swatchClassName)}
            />
            <span className="max-sm:sr-only">{ink.label}</span>
            <span className="sr-only"> ink</span>
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </PostcardToolButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel>Text colour</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={textStyle.ink}
            onValueChange={(value) => {
              const chosen = inks.find((key) => key === value);
              if (chosen) {
                onTextStyleChange({ ink: chosen });
              }
            }}
          >
            {inks.map((key) => (
              <DropdownMenuRadioItem key={key} value={key} className="gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-5 rounded-full',
                    POSTCARD_INKS[key].swatchClassName,
                  )}
                />
                {POSTCARD_INKS[key].label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <PostcardToolDivider />
      <Button variant="primary" size="sm" onClick={onDone} className="ms-1">
        Done
      </Button>
    </>
  );
}

export type PostcardTextToolbarProps = Omit<
  CardTextToolbarProps<PostcardInk>,
  'inks'
>;

/** The postcard's bar for its message, in the postcard's inks. */
export const PostcardTextToolbar = memo(function PostcardTextToolbar(
  props: PostcardTextToolbarProps,
) {
  return <CardTextToolbar {...props} inks={POSTCARD_INK_KEYS} />;
});
