'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { HandArrow } from '@/components/atoms/hand-arrow';
import { link } from '@/components/atoms/link';
import { Logo } from '@/components/atoms/logo';
import { Postmark } from '@/components/atoms/postmark';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import postcard from '@/components/organisms/postcard-dialog/postcard.module.css';
import { cn } from '@/lib/cn.util';
import styles from './not-found.module.css';

/** A real page the letter can be sent on to. */
export type NotFoundDestination = {
  readonly href: string;
  readonly label: string;
};

export type NotFoundEnvelopeProps = {
  /** Where it can go instead, the first the one most people want, drawn as the main action. */
  destinations: readonly [NotFoundDestination, ...NotFoundDestination[]];
};

/** Whether a press means "open it elsewhere", which the flight must leave to the browser. */
function opensElsewhere(event: React.MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/**
 * The letter Thrive could not deliver: the front of an envelope from Thrive, addressed to the path
 * the person asked for in their own hand on its rule, its stamp cancelled ADDRESS UNKNOWN and the
 * address crossed out. Under it they re-address it: picking a
 * page writes it on the envelope, which flies off, and the page follows. Each destination is a
 * real link, so a press that opens it elsewhere, or a page that asks for less motion, goes straight
 * there instead.
 */
export function NotFoundEnvelope({ destinations }: NotFoundEnvelopeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sending, setSending] = useState<NotFoundDestination>();
  const [isFlying, setIsFlying] = useState(false);
  const [primary, ...others] = destinations;

  function send(event: React.MouseEvent, destination: NotFoundDestination) {
    if (opensElsewhere(event)) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    event.preventDefault();
    if (!sending) {
      setSending(destination);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <figure
        aria-label={`A letter to ${pathname}, which could not be delivered`}
        className={cn(
          styles.envelope,
          postcard.paper,
          postcard.cream,
          'aspect-4/3 w-full max-w-136 overflow-hidden text-start sm:aspect-3/2',
          isFlying && styles.flying,
        )}
        onAnimationEnd={(event) => {
          if (sending && event.target === event.currentTarget) {
            router.push(sending.href);
          }
        }}
      >
        {/* The front of the envelope: who it is from, in the corner a sender writes it. */}
        <div className="absolute top-1/12 left-1/14 flex flex-col">
          <Text as="span" variant="overline" tone="muted">
            From
          </Text>
          <Text as="span" variant="body-3">
            Thrive
          </Text>
        </div>

        <div
          aria-hidden="true"
          className={cn(styles.stampEdge, 'absolute top-1/16 right-1/20 w-1/6')}
        >
          <div className={styles.stamp}>
            <div
              className={cn(
                styles.stampFace,
                'relative flex aspect-4/5 items-center justify-center',
              )}
            >
              <span className="absolute top-1 left-1.5 hidden font-display text-caption tabular-nums sm:block">
                404
              </span>
              <Logo className="aspect-10/3 h-auto w-4/5" />
            </div>
          </div>
        </div>

        {/* Struck beside the stamp with its waves run across it, cancelling it. */}
        <Postmark
          words={{ top: 'Address', bottom: 'Unknown' }}
          centre={['NO.', '404']}
          trail="right"
          className={cn(styles.postmark, 'absolute top-1/25 right-1/25 w-2/5')}
        />

        <div className="absolute right-1/12 bottom-1/8 left-1/5 flex flex-col gap-1 sm:left-1/3">
          <span className="flex items-center gap-1 text-action-secondary">
            <HandwrittenNote size="md" tilt="left" writes={null}>
              moved, or never lived here
            </HandwrittenNote>
            <HandArrow className="h-4 w-8 rotate-90" />
          </span>
          <Text as="span" variant="overline" tone="muted">
            To
          </Text>
          {/* The address, written on its rule and crossed out where it is written. */}
          <span className="w-full border-border-strong border-b pb-0.5">
            <span className="relative block w-fit max-w-full">
              <Text
                as="span"
                variant="subtitle-handwrite-1"
                className="line-clamp-2 break-all"
              >
                {pathname}
              </Text>
              <svg
                aria-hidden="true"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                className={cn(
                  styles.strike,
                  'absolute top-1/2 left-0 h-3 w-full -translate-y-1/2 text-action-secondary',
                )}
              >
                <path
                  d="M1 6 C 20 3, 40 8, 60 4 S 90 6, 99 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
          </span>
          <span className="flex min-h-10 items-center gap-2 text-action-secondary">
            {sending && (
              <span
                className={cn(styles.written, 'flex items-center gap-2')}
                onAnimationEnd={(event) => {
                  event.stopPropagation();
                  setIsFlying(true);
                }}
              >
                <HandArrow />
                <Text as="span" variant="subtitle-handwrite-1">
                  {sending.label}
                </Text>
              </span>
            )}
          </span>
        </div>
      </figure>

      <p className="sr-only" aria-live="polite">
        {sending ? `Sending you to ${sending.label}.` : ''}
      </p>

      <nav
        aria-label="Somewhere real instead"
        className="flex flex-col items-center gap-4"
      >
        <HandwrittenNote size="md" writes={null}>
          re-address it to…
        </HandwrittenNote>
        <Button asChild variant="primary" size="lg">
          <NextLink
            href={primary.href}
            onClick={(event) => send(event, primary)}
          >
            {primary.label}
          </NextLink>
        </Button>
        {/* The other places, quietly, as links in a line. */}
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-body-2">
          {others.map((destination) => (
            <li key={destination.href}>
              <NextLink
                href={destination.href}
                className={link()}
                onClick={(event) => send(event, destination)}
              >
                {destination.label}
              </NextLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={cn(link(), 'cursor-pointer')}
              onClick={() => router.back()}
            >
              Go back
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
