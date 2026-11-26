import { LandingSection } from '@/app/_components/landing/landing-section';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { roles } = HR_LANDING_COPY;

/** Each act's own colour, as the app gives it: blue asks, plum gives, orange thanks. */
const VOICE = {
  ask: 'text-action-tertiary',
  give: 'text-fg-accent',
  thanks: 'text-action-secondary-hover',
  plain: '',
} as const;

/**
 * The split of the work: the few things HR does once, beside what the team then does on its own.
 * HR's side is numbered because it is done in that order; the team's is not.
 */
export function HrLandingRoles() {
  return (
    <LandingSection
      id={roles.id}
      title={roles.title}
      note={roles.note}
      lead={roles.lead}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-element border border-border-muted bg-surface-base p-inset-container">
          <HandwrittenNote tilt="left" size="md">
            {roles.yours.heading}
          </HandwrittenNote>
          <Text as="h3" variant="subtitle-2" className="sr-only">
            {roles.yours.heading}
          </Text>
          <ol className="flex flex-col gap-4">
            {roles.yours.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <Text
                  as="span"
                  variant="subtitle-display-2"
                  className="text-action-tertiary"
                  aria-hidden="true"
                >
                  {index + 1}
                </Text>
                <Text variant="body-1">
                  <strong className="font-semibold">{step.title}</strong>{' '}
                  {step.body}
                  {'goal' in step && (
                    <>
                      {' '}
                      <span className="rounded-chip bg-action-tertiary-surface-hover px-1.5 text-action-tertiary-fg">
                        {step.goal}
                      </span>
                    </>
                  )}
                </Text>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-5 rounded-element border border-border-muted bg-action-primary-surface p-inset-container">
          <HandwrittenNote tilt="right" size="md">
            {roles.theirs.heading}
          </HandwrittenNote>
          <Text as="h3" variant="subtitle-2" className="sr-only">
            {roles.theirs.heading}
          </Text>
          <ul className="flex flex-col gap-4">
            {roles.theirs.items.map((item) => (
              <li key={item.title}>
                <Text variant="body-1">
                  <strong className={cn('font-semibold', VOICE[item.voice])}>
                    {item.title}
                  </strong>{' '}
                  {item.body}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingSection>
  );
}
