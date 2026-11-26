import { Text } from '@/components/atoms/text';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { promise } = HR_LANDING_COPY;

/**
 * What HR cannot read, said as a promise HR can repeat to the team, on the product's own colour
 * edge to edge: the one band on the page that is not a light tint, because it is the reason the
 * rest works. Each point is what the product already does (brain `ADR-0033`, `ADR-0056`); none
 * says more than that, such as that nobody else ever reads a message.
 */
export function HrLandingPromise() {
  const headingId = `${promise.id}-title`;
  return (
    <section
      id={promise.id}
      aria-labelledby={headingId}
      className="bg-action-primary-active px-6 py-20 text-fg-on-action sm:px-10 md:py-32"
    >
      <div className="mx-auto grid w-full max-w-5xl gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Text variant="overline">{promise.eyebrow}</Text>
          <Text
            as="h2"
            id={headingId}
            variant="display-2"
            className="text-balance"
          >
            {promise.title}
          </Text>
          <Text variant="subtitle-1" className="text-pretty">
            {promise.lead}
          </Text>
        </div>
        <ul className="flex flex-col border-fg-on-action/25 border-t">
          {promise.points.map((point) => (
            <li
              key={point.title}
              className="border-fg-on-action/25 border-b py-4"
            >
              <Text variant="body-1">
                <strong className="font-semibold">{point.title}</strong>{' '}
                {point.body}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
