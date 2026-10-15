import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from '@/components/atoms/avatar';
import { initials } from '@/lib/initials.util';

export type PhotoAvatarProps = {
  /** Who it shows; their initials stand in until the photo loads, or when it never does. */
  name: string;
  /** `null` when there is no photo, and the initials are all there is. */
  photoUrl: string | null;
  size?: AvatarProps['size'];
};

/**
 * Someone's photo, or their initials. Always drawn beside their name, which already says who it
 * is, so it is hidden from screen readers rather than announced twice. The photo is fetched
 * without a referrer, so the page it sits on is not sent to whoever hosts it.
 */
export function PhotoAvatar({ name, photoUrl, size }: PhotoAvatarProps) {
  return (
    <Avatar size={size} aria-hidden="true">
      {photoUrl && (
        <AvatarImage src={photoUrl} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
