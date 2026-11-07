import { StateCell } from '@/app/ui-showcase/_components/showcase-entry';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import {
  type FeedCardCase,
  SAMPLE_READER,
  SAMPLE_TARGET,
} from './feed-card-samples.constant';

export type FeedCardCasesProps = {
  cases: readonly FeedCardCase[];
};

/** One labelled cell for each case a card can be in, as Ann reads it. */
export function FeedCardCases({ cases }: FeedCardCasesProps) {
  return cases.map(({ label, hint, item }) => (
    <StateCell key={label} label={label} hint={hint} wide>
      <div className="w-full max-w-180">
        <FeedCard
          item={item}
          readerAccountId={SAMPLE_READER}
          target={SAMPLE_TARGET}
        />
      </div>
    </StateCell>
  ));
}
