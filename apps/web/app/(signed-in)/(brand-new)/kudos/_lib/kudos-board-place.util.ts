const MONTH_NAME = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `2026-10` as a person reads it: `October 2026`. */
export function kudosMonthName(month: string): string {
  return MONTH_NAME.format(new Date(`${month}-01T00:00:00.000Z`));
}

/** The first of somebody's names, which is all a caption has room for. */
function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Who a caption names: `Mali`, or `A teammate` for somebody with no name yet. */
export function kudosCaptionName(name: string | null, unnamed: string): string {
  return name === null ? unnamed : firstNameOf(name);
}
