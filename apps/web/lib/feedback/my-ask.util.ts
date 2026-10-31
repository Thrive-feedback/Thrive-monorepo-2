import type { components } from '@repo/api';
import type { MyAsk } from './my-ask.type';

type AskOnTheWire =
  components['schemas']['ListMyFeedbackAsksResponseDto_Output']['items'][number];

/** One Ask from the API as Waiting for me lists it. */
export function toMyAsk(ask: AskOnTheWire): MyAsk {
  return {
    askId: ask.askId,
    message: ask.message,
    messageTags: ask.tags,
    requesterName: ask.requester.name,
    requesterPhotoUrl: ask.requester.photoUrl,
    requesterInactive: ask.requester.status === 'DEACTIVATED',
    askedAt: ask.createdAt,
    status: ask.status,
  };
}
