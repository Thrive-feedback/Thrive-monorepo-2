import { cva, type VariantProps } from 'class-variance-authority';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';

const avatarName = cva('inline-flex min-w-0 max-w-full items-center', {
  variants: {
    size: { sm: 'gap-2', md: 'gap-2', lg: 'gap-3' },
  },
  defaultVariants: { size: 'md' },
});

export type AvatarNameProps = VariantProps<typeof avatarName> & {
  /** Who it is: their initials stand in for the photo, and it is what shows unless replaced. */
  name: string;
  /** `null` when there is no photo, and the initials are all there is. */
  photoUrl: string | null;
  /** What shows beside the face, where that is more than the name, such as an email under it. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Someone's face beside their name, centred on each other, with the gap that suits the face's size.
 * The one way the two are drawn together, so they line up alike on every page.
 *
 * Only as wide as it needs, so it sits after a word such as "From"; a row of a list makes it `flex`.
 * It is built of blocks, so it cannot go inside a paragraph.
 */
export function AvatarName({
  name,
  photoUrl,
  size,
  children,
  className,
}: AvatarNameProps) {
  return (
    <div className={cn(avatarName({ size }), className)}>
      <PhotoAvatar name={name} photoUrl={photoUrl} size={size} />
      <div className="min-w-0 flex-1 break-words">
        {children ?? (
          <span className="text-fg-primary text-subtitle-4">{name}</span>
        )}
      </div>
    </div>
  );
}
