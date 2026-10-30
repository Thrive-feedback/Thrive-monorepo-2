import { CheckIcon, ImageIcon } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useRef, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { RadioGroup } from '@/components/atoms/radio-group';
import { PostcardPicture } from './postcard-picture';
import { POSTCARD_TEMPLATES } from './postcard-template.constant';
import { PostcardToolButton } from './postcard-tool-button';
import { usePostcardDrawerContainer } from './use-postcard-drawer-container';

export type PostcardTemplatePickerProps = {
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
  onTemplateChange: (templateKey: string) => void;
};

/**
 * Templates, on the front's bar: a drawer of every picture the front can show, which behaves as
 * Stamps does. A picture pressed goes on the front and the drawer closes; a press anywhere
 * outside it puts it away, and since it does not hold the page, that press reaches the page too.
 * From the keyboard the arrow keys try each picture on the front as they move, which leaves the
 * drawer open so the pictures can be compared; Space keeps the one chosen and closes it.
 */
export function PostcardTemplatePicker({
  templateKey,
  onTemplateChange,
}: PostcardTemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = usePostcardDrawerContainer();
  // Whether an arrow key is down. A picture the arrows reach is chosen as it takes focus, which
  // only tries it on the front, so that choice must not close the drawer.
  const isArrowingRef = useRef(false);

  return (
    <Drawer
      modal={false}
      open={isOpen}
      onOpenChange={(open) => {
        // An arrow let go somewhere else would leave it set; a fresh drawer starts with none down.
        if (open) {
          isArrowingRef.current = false;
        }
        setIsOpen(open);
      }}
    >
      <DrawerTrigger asChild>
        <PostcardToolButton>
          <ImageIcon aria-hidden="true" className="size-4.5" />
          <span className="max-sm:sr-only">Templates</span>
        </PostcardToolButton>
      </DrawerTrigger>
      <DrawerContent container={container}>
        <DrawerHeader>
          <DrawerTitle>Templates</DrawerTitle>
          <DrawerDescription>
            Choose the picture on the front of your card.
          </DrawerDescription>
        </DrawerHeader>
        <RadioGroup
          aria-label="Templates"
          value={templateKey}
          onValueChange={onTemplateChange}
          onKeyDownCapture={(event) => {
            if (event.key.startsWith('Arrow')) {
              isArrowingRef.current = true;
            }
          }}
          onKeyUpCapture={() => {
            isArrowingRef.current = false;
          }}
          // An arrow held while the cursor leaves the pictures is let go where they cannot hear it.
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              isArrowingRef.current = false;
            }
          }}
          className="grid-cols-2"
        >
          {POSTCARD_TEMPLATES.map((template) => (
            <RadioGroupPrimitive.Item
              key={template.key}
              value={template.key}
              aria-label={template.alt}
              // The arrows choose as they move. Radix does this itself, from a listener on the
              // document that the drawer's popup can keep arrow keys from (it stops their
              // propagation; ADR 0066), so the picker chooses here too; where Radix also does,
              // it chooses the same picture.
              onFocus={() => {
                if (isArrowingRef.current) {
                  onTemplateChange(template.key);
                }
              }}
              // Any click that chooses closes: a press, Space, or a screen reader's activation,
              // in the same click, so the choice is made before the drawer goes.
              onClick={() => {
                if (!isArrowingRef.current) {
                  setIsOpen(false);
                }
              }}
              className="relative aspect-3/2 cursor-pointer overflow-hidden rounded-element border-2 border-border-muted transition-colors ease-smooth-out hover:border-border-strong data-[state=checked]:border-action-primary"
            >
              <PostcardPicture
                picture={template}
                alt=""
                sizes="(min-width: 48rem) 11rem, 50vw"
                fallbackClassName="p-2 text-tag"
              />
              <RadioGroupPrimitive.Indicator className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-action-primary text-fg-on-action shadow-med">
                <CheckIcon aria-hidden="true" className="size-4" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroup>
      </DrawerContent>
    </Drawer>
  );
}
