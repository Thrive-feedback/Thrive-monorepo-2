/** Past this a count stops being read and starts being a shape, and it breaks the badge. */
const MOST_SHOWN = 99;

/** A count as a badge draws it: the number, or `99+` past ninety-nine. Words say the real one. */
export function countLabel(count: number): string {
  return count > MOST_SHOWN ? `${MOST_SHOWN}+` : String(count);
}
