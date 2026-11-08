/**
 * `2026-Q4` as the quarter a person would say: `Q4 2026`.
 *
 * The period is how the API keys a summary, so it reaches the page in that shape; nobody reads a
 * quarter backwards.
 */
export function quarterRead(period: string): string {
  const [year, quarter] = period.split('-');
  return `${quarter} ${year}`;
}
