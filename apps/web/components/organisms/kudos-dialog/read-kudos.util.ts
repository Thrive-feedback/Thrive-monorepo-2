import type { components } from '@repo/api';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { KudosCardDrawing } from './kudos-card-read-only';
import {
  KUDOS_TEMPLATE_KEYS,
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
  THE_ONE_SIDE,
} from './kudos-template.constant';
import type { ReadKudos, ReadKudosPerson } from './read-kudos.type';

type KudosOnTheWire =
  components['schemas']['ListWorkspaceKudosResponseDto_Output']['items'][number];

/** The size a card with no size of its own starts from, as a new card does. */
const LARGEST_SIZE_STEP = 4;

/** Cards pinned by hand are never quite straight. In degrees. */
const TILTS = [-3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3];

/**
 * A number that stays the same for a Kudos and differs between Kudos (FNV-1a). Ids are made in time
 * order, so taking their characters as they stand would give neighbours the same answer.
 */
function hashOf(id: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * How far a card leans. It comes from the Kudos, so a card hangs the same way on every visit and
 * the server and the browser agree on it.
 */
export function kudosTiltOf(id: string): number {
  return TILTS[hashOf(id) % TILTS.length] ?? 0;
}

/** How many blank cards hang on each side of a Kudos on Home's small board. */
const NEIGHBOURS_A_SIDE = 2;

/**
 * The blank cards beside a Kudos on Home's small board, furthest left to furthest right, split in
 * half by the Kudos itself. Never its own template, so the card stands out from them, and always the
 * same ones, so nothing changes between reads.
 */
export function kudosNeighboursOf(id: string, own: KudosTemplateKey) {
  const others = KUDOS_TEMPLATE_KEYS.filter((key) => key !== own);
  const start = hashOf(id);
  const neighbours = Array.from(
    { length: NEIGHBOURS_A_SIDE * 2 },
    (_, place) => others[(start + place) % others.length] ?? own,
  );
  return {
    left: neighbours.slice(0, NEIGHBOURS_A_SIDE),
    right: neighbours.slice(NEIGHBOURS_A_SIDE),
  };
}

function templateOf(id: string): KudosTemplateKey {
  return (
    KUDOS_TEMPLATE_KEYS[hashOf(id) % KUDOS_TEMPLATE_KEYS.length] ??
    KUDOS_TEMPLATE_KEYS[0]
  );
}

function isTemplateKey(key: string): key is KudosTemplateKey {
  return KUDOS_TEMPLATE_KEYS.some((templateKey) => templateKey === key);
}

/**
 * The card a Kudos is drawn on. One not written on a card, as those from `/home` are not, gets a
 * template from its id, so it keeps it, with that template's own font and ink (ADR 0073). So does a
 * card whose template this app no longer has.
 */
export function kudosDrawingOf(
  id: string,
  card: KudosOnTheWire['card'],
): KudosCardDrawing {
  if (!card) {
    const templateKey = templateOf(id);
    const { font, ink } = KUDOS_TEMPLATES[templateKey];
    return {
      templateKey,
      textStyle: { font, ink, sizeStep: LARGEST_SIZE_STEP, align: 'center' },
      stickers: [],
    };
  }
  return {
    templateKey: isTemplateKey(card.templateKey)
      ? card.templateKey
      : templateOf(id),
    textStyle: card.textStyle,
    stickers: card.stickers.map((sticker) => ({
      ...sticker,
      side: THE_ONE_SIDE,
    })),
  };
}

function toPerson(person: KudosOnTheWire['giver']): ReadKudosPerson {
  return { accountId: person.accountId, ...toFeedbackPerson(person) };
}

/** A Kudos as the API sends it, as anything that shows one reads it. */
export function toReadKudos(kudos: KudosOnTheWire): ReadKudos {
  return {
    id: kudos.id,
    giver: toPerson(kudos.giver),
    recipients: kudos.recipients.map(toPerson),
    message: kudos.message,
    messageTags: kudos.tags,
    givenAt: kudos.createdAt,
    drawing: kudosDrawingOf(kudos.id, kudos.card),
  };
}
