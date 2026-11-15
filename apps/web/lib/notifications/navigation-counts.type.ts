import type { ReceivedShow } from '@/lib/routes.constant';

/** A kind of Received with a count of its own: every chip but All. */
export type ReceivedKind = Exclude<ReceivedShow, 'all'>;

/**
 * A list that counts what is new in it until the person opens it: each kind of Received, and
 * Shared with me on Home.
 */
export type SeenPlace = ReceivedKind | 'shared';

/** Where a count is drawn: beside Waiting for me, or on a list that counts what is new in it. */
export type CountedPlace = 'waiting' | SeenPlace;

/**
 * The counts read from the things themselves rather than from the bell: the Asks still waiting on
 * the person, and what is new in each list since they last opened it.
 */
export type PlaceCounts = Readonly<Record<CountedPlace, number>>;
