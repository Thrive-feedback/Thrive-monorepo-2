import { HandwrittenNote, writeOn } from '@/components/atoms/handwritten-note';

export { writeOn };

export const LandingNote = HandwrittenNote;

/**
 * Pins a note across the top corner of the words it sits inside, centred on the corner as if
 * scribbled over it, from `lg` up, where the margin has room for it. Below that, a caller shows the
 * note somewhere else or not at all.
 */
export const cornerNote =
  'absolute top-1/4 left-full -ml-6 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap lg:block';

/**
 * Display text with a note at its top right corner: the end of its first line. A heading's box
 * runs the width of its column however short its lines wrap, so a note pinned to the box lands
 * far from the words; pinned to the first line's last word, it stays on them. A `\n` in the text
 * ends that first line from `lg` up, where the note shows; below that, the text wraps as it likes.
 */
export function NotedText({ text, note }: { text: string; note: string }) {
  const [firstLine = '', ...rest] = text.split('\n');
  const lastWordAt = firstLine.lastIndexOf(' ') + 1;
  return (
    <>
      {firstLine.slice(0, lastWordAt)}
      <span className="relative whitespace-nowrap">
        {firstLine.slice(lastWordAt)}
        <LandingNote className={cornerNote}>{note}</LandingNote>
      </span>
      {rest.length > 0 && (
        <>
          {' '}
          <br className="hidden lg:inline" />
          {rest.join(' ')}
        </>
      )}
    </>
  );
}
