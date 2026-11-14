import NextLink from 'next/link';
import { Button } from '@/components/atoms/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/atoms/card';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

export type FeedbackSummaryEmptyProps = {
  /** `false` where this deployment cannot write summaries at all. */
  isAvailable: boolean;
};

/**
 * The summary before there is one.
 *
 * Two reasons there is none, and they are **not** told alike. Too little written yet is about the
 * person's own Feedback and is worth saying; a deployment with no model provider is about Thrive,
 * and saying "not enough has been written to you" there would be a falsehood about their own
 * feedback dressed as a fact. Neither is a failure worth an error, and both send the person to
 * what people actually wrote.
 */
export function FeedbackSummaryEmpty({
  isAvailable,
}: FeedbackSummaryEmptyProps) {
  return (
    <Card>
      <CardHeader className="items-start text-start">
        <CardTitle>Your summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <Text as="p" variant="body-1">
          {isAvailable
            ? 'There is not enough written to you yet for a summary to be worth reading. Once a few more people have written, this is where what they said adds up.'
            : 'Summaries are not switched on here yet. When they are, this is where what people wrote to you adds up.'}
        </Text>
        <Text as="p" variant="body-2" tone="muted">
          Until then, everything written to you is in{' '}
          <Link href={ROUTES.received}>Received</Link>, in full and in their own
          words.
        </Text>
        <Button asChild variant="secondary">
          <NextLink href={ROUTES.received}>
            Read what you have received
          </NextLink>
        </Button>
      </CardContent>
    </Card>
  );
}
