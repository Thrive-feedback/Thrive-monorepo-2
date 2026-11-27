'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useId, useState } from 'react';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

export type TemplateLayerProps = {
  /** Takes focus when the template removed from it was the one focus came from. */
  headingId: string;
  heading: string;
  /** Who sees and changes its templates, said quietly beside the heading. */
  about?: string;
  children: React.ReactNode;
};

/** One layer of templates — the person's own, the Workspace's or Thrive's — under its name. */
export function TemplateLayer({
  headingId,
  heading,
  about,
  children,
}: TemplateLayerProps) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex flex-wrap items-baseline gap-x-2 border-border-subtle border-b pb-2">
        <Text
          as="h3"
          id={headingId}
          tabIndex={-1}
          variant="subtitle-4"
          className="rounded-element focus-visible:outline-2 focus-visible:outline-action-primary"
        >
          {heading}
        </Text>
        {about && (
          <Text as="span" variant="body-3" tone="muted">
            {about}
          </Text>
        )}
      </div>
      {children}
    </section>
  );
}

export type TemplateCardProps = {
  template: OneOnOneTemplate;
  /** What the person may do with it, at the end of its row: a menu, or Use. */
  actions: React.ReactNode;
};

/** "Every two weeks · 3 questions", or the count alone when it says nothing about when. */
function metaOf(template: OneOnOneTemplate): string {
  const count = template.questions.length;
  const questions = `${count} ${count === 1 ? 'question' : 'questions'}`;
  return template.suggestedWhen
    ? `${template.suggestedWhen} · ${questions}`
    : questions;
}

/**
 * One template as a row in a list: its name, and when to use it with how much it asks, on one line
 * under it. Its questions stay folded away until the person opens the row, so a long list reads at
 * a glance.
 */
export function TemplateCard({ template, actions }: TemplateCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const agendaId = useId();
  return (
    <li className="flex flex-col py-1">
      {/* Its action sits in the middle of the row, beside both the name and the line under it. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={agendaId}
          onClick={() => setIsOpen(!isOpen)}
          className="group -ms-2 flex min-w-0 flex-1 items-center gap-2 rounded-control px-2 py-2 text-start transition-colors duration-quick hover:bg-action-neutral-surface-hover focus-visible:outline-2 focus-visible:outline-action-primary motion-reduce:transition-none"
        >
          <ChevronRightIcon
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0 text-fg-muted transition-transform duration-quick ease-smooth-out group-hover:text-fg-primary motion-reduce:transition-none',
              isOpen && 'rotate-90',
            )}
          />
          <span className="flex min-w-0 flex-col">
            <Text as="span" variant="subtitle-3" className="truncate">
              {template.name}
            </Text>
            <Text as="span" variant="body-3" tone="muted" className="truncate">
              {metaOf(template)}
            </Text>
          </span>
        </button>
        <div className="flex shrink-0 items-center">{actions}</div>
      </div>
      <div id={agendaId} hidden={!isOpen} className="ps-6 pe-2 pb-3">
        <ul className="flex list-disc flex-col gap-1.5 ps-4 marker:text-fg-muted">
          {/* A template never asks one question twice (the API refuses it), so each is its own key. */}
          {template.questions.map((question) => (
            <li key={question} className="ps-1">
              <Text as="span" variant="body-2">
                {question}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
