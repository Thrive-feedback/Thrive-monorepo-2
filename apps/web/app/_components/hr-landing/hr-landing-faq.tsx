import { ChevronDownIcon } from 'lucide-react';
import { LandingSection } from '@/app/_components/landing/landing-section';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './hr-landing.module.css';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { faq } = HR_LANDING_COPY;

/**
 * The questions an HR buyer asks before booking a demo, each a native disclosure, so it opens from
 * the keyboard and is announced as expanded or collapsed with no script. The first stands open,
 * since it is the one every buyer asks.
 */
export function HrLandingFaq() {
  return (
    <LandingSection id={faq.id} title={faq.title}>
      <div className="flex flex-col border-border-muted border-t">
        {faq.items.map((item, index) => (
          <details
            key={item.question}
            open={index === 0}
            className="group border-border-muted border-b py-5"
          >
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center justify-between gap-4',
                styles.question,
              )}
            >
              <Text as="span" variant="subtitle-2">
                {item.question}
              </Text>
              <ChevronDownIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-fg-secondary transition-transform duration-quick group-open:rotate-180"
              />
            </summary>
            <Text variant="body-1" tone="muted" className="mt-3">
              {item.answer}
            </Text>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}
