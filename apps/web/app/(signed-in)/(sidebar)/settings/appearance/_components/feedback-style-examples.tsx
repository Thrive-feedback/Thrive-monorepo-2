'use client';

import { cva } from 'class-variance-authority';
import { FEEDBACK_STYLE_SAMPLE } from '@/app/(signed-in)/(sidebar)/settings/appearance/_lib/feedback-style-sample.constant';
import { useFeedbackStyle } from '@/components/organisms/feedback-style-provider';
import {
  PlainFeedbackMiniature,
  PostcardMiniature,
} from '@/components/organisms/postcard-miniature/postcard-miniature';
import {
  FEEDBACK_STYLE_LABELS,
  FEEDBACK_STYLES,
  type FeedbackStyle,
} from '@/lib/feedback-style/feedback-style.constant';

const EXAMPLES: Readonly<Record<FeedbackStyle, typeof PlainFeedbackMiniature>> =
  {
    postcard: PostcardMiniature,
    plain: PlainFeedbackMiniature,
  };

/** The frame round an example: in the primary colour round the style chosen. */
const exampleFrame = cva('rounded-container border-2 p-2', {
  variants: {
    isChosen: {
      true: 'border-action-primary-border',
      false: 'border-transparent',
    },
  },
});

/**
 * The same made-up Feedback drawn in each style, side by side, the one chosen framed in the primary
 * colour, so the choice can be seen before it is made.
 */
export function FeedbackStyleExamples() {
  const { style } = useFeedbackStyle();

  return (
    <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
      {FEEDBACK_STYLES.map((value) => {
        const Example = EXAMPLES[value];
        const isChosen = value === style;
        return (
          <figure key={value} className="flex flex-col gap-2">
            <div className={exampleFrame({ isChosen })}>
              <Example card={FEEDBACK_STYLE_SAMPLE} />
            </div>
            <figcaption className="text-center text-body-3 text-fg-secondary">
              {FEEDBACK_STYLE_LABELS[value]}
              {isChosen && <span className="sr-only"> (chosen)</span>}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
