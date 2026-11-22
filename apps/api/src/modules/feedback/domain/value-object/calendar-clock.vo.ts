/**
 * The one clock a calendar is read on: a fixed offset for everyone, so a Kudos sits in the same
 * month and a piece of Feedback on the same day for every Member, wherever they are (ADR 0076,
 * ADR 0095). Thailand keeps no daylight saving, so it never changes. A Workspace time zone would
 * replace this constant; nothing stored has to change, because only the reads know the clock.
 */
export const CALENDAR_UTC_OFFSET_HOURS = 7;

/** The instants a stretch of that calendar runs between: `from` is in it and `until` is not. */
export interface InstantRange {
  readonly from: Date;
  readonly until: Date;
}
