import type { components } from '@repo/api';

/** How a Kudos card looks, as the API stores it. */
export type KudosCardLook = NonNullable<
  components['schemas']['GiveKudosRequestDto']['card']
>;

/**
 * A Kudos as the server action takes it: plain data, since a call from the browser carries nothing
 * else. Who it is for is in the message. Lives apart from the action, because every export of a
 * `'use server'` file is callable from the browser.
 */
export type SentKudos = {
  readonly message: string;
  readonly card: KudosCardLook;
};
