import styles from './landing.module.css';

export type NotedTextProps = {
  /** The display text; a `\n` ends its first line from `lg` up. */
  text: string;
  /** The handwritten aside at the corner of that first line. */
  note: string;
};

/**
 * Display text with a note at its top right corner: the end of its first line. A heading's box
 * runs the width of its column however short its lines wrap, so a note pinned to the box lands
 * far from the words; pinned to the first line's last word, it stays on them. A `\n` in the text
 * ends that first line from `lg` up, where the note shows; below that, the text wraps as it likes,
 * and a caller shows the note somewhere else or not at all.
 *
 * The note is handed to the stylesheet as `data-note` and drawn there, not written into the text,
 * so a heading reads as its own words alone: to a search engine it is "Feedback while it still
 * matters.", never with the note run into the middle of it.
 */
export function NotedText({ text, note }: NotedTextProps) {
  const [firstLine = '', ...rest] = text.split('\n');
  const lastWordAt = firstLine.lastIndexOf(' ') + 1;
  return (
    <>
      {firstLine.slice(0, lastWordAt)}
      <span
        data-note={note}
        className={`relative whitespace-nowrap ${styles.cornerNote}`}
      >
        {firstLine.slice(lastWordAt)}
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
