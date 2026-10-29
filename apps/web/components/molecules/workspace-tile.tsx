import { cva, type VariantProps } from 'class-variance-authority';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { initials } from '@/lib/initials.util';

const workspaceTile = cva('', {
  variants: {
    tone: {
      current: 'bg-action-primary text-fg-on-action',
      choice: 'bg-action-primary-surface text-action-primary',
      inactive: 'bg-surface-subtle text-fg-secondary',
    },
  },
});

export type WorkspaceTileProps = {
  name: string;
  /** The Workspace's own logo. Without one, or while it loads or if it fails, its initials show. */
  logoUrl?: string;
  size?: 'sm' | 'md';
} & Required<VariantProps<typeof workspaceTile>>;

/** A Workspace's logo, or its initials, as a rounded tile; the name beside it is what is read out. */
export function WorkspaceTile({
  name,
  logoUrl,
  size = 'md',
  tone,
}: WorkspaceTileProps) {
  return (
    <Avatar size={size} shape="rounded" aria-hidden="true" className="shrink-0">
      {logoUrl && <AvatarImage src={logoUrl} alt="" />}
      <AvatarFallback className={workspaceTile({ tone })}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
