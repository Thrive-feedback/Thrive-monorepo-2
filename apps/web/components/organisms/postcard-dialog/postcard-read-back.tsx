import { PostcardAddressReadOnly } from './postcard-address-read-only';
import { FULL_BACK, STAMP_CLEARANCE } from './postcard-back.constant';
import { PostcardMessageReadOnly } from './postcard-message-read-only';
import type {
  AnsweredPostcard,
  GivenPostcard,
  PostcardReadAnswer,
} from './postcard-read.type';
import {
  PostcardAnswerFrom,
  PostcardAskReadOnly,
  PostcardSplitBack,
} from './postcard-split-back';

export type PostcardGivenBackProps = {
  card: GivenPostcard;
};

/** The back of given Feedback as it was sent: laid out as it was written. */
export function PostcardGivenBack({ card }: PostcardGivenBackProps) {
  return (
    <div className={FULL_BACK}>
      <PostcardAddressReadOnly
        writer={card.giver}
        receivers={card.receivers}
        className={STAMP_CLEARANCE.give}
      />
      <PostcardMessageReadOnly
        message={card.message}
        tags={card.messageTags}
        textStyle={card.textStyle}
      />
    </div>
  );
}

export type PostcardAnsweredBackProps = {
  card: AnsweredPostcard;
  /** The answer showing on the right half. */
  answer: PostcardReadAnswer;
  /** Which answer that is, so the next one starts at its first line. */
  answerIndex: number;
};

/** The back of a request as it was answered: the Ask on the left, one answer on the right. */
export function PostcardAnsweredBack({
  card,
  answer,
  answerIndex,
}: PostcardAnsweredBackProps) {
  return (
    <PostcardSplitBack
      ask={
        <PostcardAskReadOnly ask={card.ask} messageTags={card.messageTags} />
      }
      answer={
        <>
          <PostcardAnswerFrom writer={answer.giver} />
          <PostcardMessageReadOnly
            key={answerIndex}
            message={answer.message}
            tags={answer.messageTags}
            textStyle={answer.textStyle}
          />
        </>
      }
    />
  );
}
