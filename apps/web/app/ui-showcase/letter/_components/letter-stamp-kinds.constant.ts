import {
  CoffeeIcon,
  HeartIcon,
  LightbulbIcon,
  type LucideIcon,
  MessageCircleQuestionMarkIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
  ThumbsUpIcon,
  TrophyIcon,
} from 'lucide-react';

/** Every stamp a letter can carry, by the name it is announced with and the mark printed on it. */
export const STAMP_KINDS = {
  heart: { label: 'Heart', Icon: HeartIcon },
  star: { label: 'Star', Icon: StarIcon },
  'thumbs-up': { label: 'Thumbs up', Icon: ThumbsUpIcon },
  sparkles: { label: 'Sparkles', Icon: SparklesIcon },
  rocket: { label: 'Rocket', Icon: RocketIcon },
  coffee: { label: 'Coffee', Icon: CoffeeIcon },
  trophy: { label: 'Trophy', Icon: TrophyIcon },
  lightbulb: { label: 'Light bulb', Icon: LightbulbIcon },
  question: { label: 'Question', Icon: MessageCircleQuestionMarkIcon },
} as const satisfies Record<string, { label: string; Icon: LucideIcon }>;

export type StampKind = keyof typeof STAMP_KINDS;

/** The stamps the Stamps panel offers, in its order. The question stamp only comes on a Request message. */
export const PICKABLE_STAMPS: readonly StampKind[] = [
  'heart',
  'star',
  'thumbs-up',
  'sparkles',
  'rocket',
  'coffee',
  'trophy',
  'lightbulb',
];
