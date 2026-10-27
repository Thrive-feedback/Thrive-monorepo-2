import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from '@/components/atoms/avatar';
import { initials } from '@/lib/initials.util';

export type PhotoAvatarProps = AvatarProps & {
  /** Who it shows; their initials stand in until the photo loads, or when it never does. */
  name: string;
  /** `null` when there is no photo, and the initials are all there is. */
  photoUrl: string | null;
};

/**
 * Someone's photo, or their initials. Always drawn beside their name, which already says who it
 * is, so it is hidden from screen readers rather than announced twice. The photo is fetched
 * without a referrer, so the page it sits on is not sent to whoever hosts it.
 *
 * The photo is the link Google gave at sign-in, already small (`=s96-c`, a few kilobytes) and
 * used as it is everywhere, so the browser downloads each person's face once and reuses it on
 * every page. The initials hold the space while it loads, so nothing moves when it arrives.
 *
 * The rest of the props reach the avatar itself, so it can be a tooltip's trigger.
 */
export function PhotoAvatar({ name, photoUrl, ...rest }: PhotoAvatarProps) {
  return (
    <Avatar aria-hidden="true" {...rest}>
      {photoUrl && (
        <AvatarImage src={photoUrl} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
