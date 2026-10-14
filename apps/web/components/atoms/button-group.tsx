import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

/*
 * shadcn's ButtonGroup on our tokens, written as a composition:
 *
 *   <ButtonGroup aria-label="Text alignment">
 *     <Button variant="primary" aria-pressed="true">Left</Button>
 *     <Button aria-pressed="false">Centre</Button>
 *   </ButtonGroup>
 *
 * Only the group itself is taken; its text and separator parts wait for a caller.
 */

const buttonGroupVariants = cva(
  'flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10',
  {
    variants: {
      orientation: {
        horizontal:
          '*:not-first:rounded-l-none *:not-first:border-l-0 *:not-last:rounded-r-none',
        vertical:
          'flex-col *:not-first:rounded-t-none *:not-first:border-t-0 *:not-last:rounded-b-none',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

export type ButtonGroupProps = React.ComponentPropsWithRef<'div'> &
  VariantProps<typeof buttonGroupVariants>;

/**
 * Buttons joined into one control: the corners between them square off and the borders they
 * share collapse into one. It is announced as a group, so name it with `aria-label` for what
 * the buttons choose between.
 */
export function ButtonGroup({
  orientation,
  className,
  ...rest
}: ButtonGroupProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a row of buttons, or of links in a `nav`, is a plain named group.
    <div
      data-slot="button-group"
      role="group"
      data-orientation={orientation ?? 'horizontal'}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...rest}
    />
  );
}
