import type { components } from '@repo/api';

/** One 1:1 the person is in, as the API answers it. */
export type OneOnOne = components['schemas']['OneOnOneResponseDto_Output'];

export type OneOnOneSchedule = OneOnOne['schedule'];

export type OneOnOneCadence = OneOnOneSchedule['cadence'];

/** One of Thrive's 1:1 templates, which a schedule's agenda starts from. */
export type OneOnOneTemplate =
  components['schemas']['ListOneOnOneTemplatesResponseDto_Output']['items'][number];

/** When a 1:1 meets, as either person chooses it. */
export type OneOnOneScheduleChoice = {
  readonly cadence: OneOnOneCadence;
  /** 1 is Monday and 7 is Sunday. */
  readonly weekday: number;
  /** Minutes after midnight, Bangkok time. */
  readonly startMinute: number;
  readonly lengthMinutes: number;
  readonly templateKey: string;
  /** The day of a meeting held just once, `YYYY-MM-DD`; the weekday follows from it. */
  readonly startsOn?: string;
};

/** What an action on a 1:1 came to: done, or why not, said for the person. */
export type OneOnOneActionResult =
  | { readonly ok: true; readonly id?: string }
  | {
      readonly ok: false;
      readonly message: string;
      /** The API's code for the refusal, when it was the API that refused. */
      readonly code?: string;
    };
