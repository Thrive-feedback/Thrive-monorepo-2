import { CheckIcon, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { RadioGroup } from '@/components/atoms/radio-group';
import { POSTCARD_TEMPLATES } from './postcard-template.constant';
import { PostcardToolButton } from './postcard-tool-button';

export type PostcardTemplatePickerProps = {
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
  onTemplateChange: (templateKey: string) => void;
};

/**
 * Templates, on the front's bar: a drawer of every picture the front can show. A picture chosen
 * goes on the front at once and the drawer stays open, so pictures can be compared on the card
 * itself; it closes when the writer is done.
 */
export function PostcardTemplatePicker({
  templateKey,
  onTemplateChange,
}: PostcardTemplatePickerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <PostcardToolButton>
          <ImageIcon aria-hidden="true" className="size-4.5" />
          <span className="max-sm:sr-only">Templates</span>
        </PostcardToolButton>
      </DrawerTrigger>
      <DrawerContent>
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
          className="grid-cols-2"
        >
          {POSTCARD_TEMPLATES.map((template) => (
            <RadioGroupPrimitive.Item
              key={template.key}
              value={template.key}
              aria-label={template.alt}
              className="relative aspect-3/2 cursor-pointer overflow-hidden rounded-element border-2 border-border-muted transition-colors ease-smooth-out hover:border-border-strong data-[state=checked]:border-action-primary"
            >
              <Image
                src={template.src}
                alt=""
                fill
                sizes="(min-width: 48rem) 11rem, 50vw"
                className="object-cover"
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
