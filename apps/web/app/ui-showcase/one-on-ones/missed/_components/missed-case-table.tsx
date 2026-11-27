import { MockView } from '@/app/ui-showcase/one-on-ones/missed/_components/missed-mocks';
import {
  CADENCE_WORDS,
  describe,
  simulate,
} from '@/app/ui-showcase/one-on-ones/missed/_lib/missed-meeting.model';
import { MISSED_CASES } from '@/app/ui-showcase/one-on-ones/missed/_lib/missed-meeting-cases.constant';
import { Text } from '@/components/atoms/text';

/**
 * Every case, by how often the 1:1 meets: each drawn from the same rules as the simulator, so the
 * two never disagree. A heading per cadence, a figure per case.
 */
export function MissedCaseTable() {
  return (
    <div className="flex flex-col gap-12">
      {MISSED_CASES.map(({ cadence, cases }) => (
        <section
          key={cadence}
          aria-labelledby={`missed-${cadence}`}
          className="flex flex-col gap-8"
        >
          <Text
            as="h3"
            id={`missed-${cadence}`}
            variant="subtitle-2"
            className="border-border-subtle border-b pb-2"
          >
            {CADENCE_WORDS[cadence]}
            <Text as="span" variant="body-2" tone="muted">
              {cadence === 'ONCE'
                ? ' · on Tue 1 Dec, or as each case says'
                : ' · Tuesdays, from Tue 1 Dec'}
            </Text>
          </Text>
          <ol className="flex flex-col gap-10">
            {cases.map((each, index) => (
              <li key={each.id}>
                <figure className="flex flex-col gap-3">
                  <figcaption className="flex flex-col gap-0.5">
                    <Text as="h4" variant="subtitle-3">
                      {index + 1}. {each.title}
                      <Text as="span" variant="body-3" tone="muted">
                        {` · today is ${describe(each.today)}`}
                      </Text>
                    </Text>
                    <Text as="p" variant="body-3" tone="muted">
                      {each.rule}
                    </Text>
                  </figcaption>
                  <MockView view={simulate(each.scenario, each.today)} />
                </figure>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
