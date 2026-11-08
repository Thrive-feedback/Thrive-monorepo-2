import { XIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { DialogTitle } from '@/components/atoms/dialog';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import type { PostcardWriter } from './postcard-draft.type';

export type PostcardTitleRowProps = {
  /** What the card is, above it. */
  title: string;
  /**
   * The person the title names, whose face goes just before their name in it. Left out when it
   * names nobody, such as "Your Feedback".
   */
  person?: PostcardWriter;
  className?: string;
  /** Close was pressed. */
  onClose: () => void;
};

/**
 * The title with the face of whoever it names set just before their name, where the name is
 * written in it: "Feedback from ◯ Ben Carter". The face keeps to the line its name starts on.
 * A title that does not say the name gets no face, rather than one beside the wrong words.
 */
function titleWithFace(title: string, person: PostcardWriter | undefined) {
  const at = person ? title.lastIndexOf(person.name) : -1;
  if (!person || at < 0) {
    return title;
  }
  const [firstWord = '', ...restOfName] = person.name.split(' ');
  const rest = restOfName.length > 0 ? ` ${restOfName.join(' ')}` : '';

  return (
    <>
      {title.slice(0, at)}
      <span className="whitespace-nowrap">
        <PhotoAvatar
          name={person.name}
          photoUrl={person.photoUrl}
          size="md"
          className="me-2 inline-flex align-middle"
        />
        {firstWord}
      </span>
      {rest}
      {title.slice(at + person.name.length)}
    </>
  );
}

/**
 * The line above the card: the dialog's title, with the face of whoever it names beside their
 * name, and Close. The face only repeats the name the title says, so assistive technology skips
 * it and the dialog is named by the words alone.
 */
export function PostcardTitleRow({
  title,
  person,
  className,
  onClose,
}: PostcardTitleRowProps) {
  return (
    <div className={cn('flex w-full max-w-2xl items-center gap-2', className)}>
      <DialogTitle className="flex-1 text-subtitle-display-1">
        {titleWithFace(title, person)}
      </DialogTitle>
      <Button variant="secondary" size="icon" onClick={onClose}>
        <XIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
}
