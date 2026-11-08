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

/**
 * The summary before there is one.
 *
 * It says the same thing whether too little has been written yet or the first one is still being
 * written, because from here the two are the same thing to wait for — and neither is a failure
 * worth an error. A summary of one or two messages is those messages, reworded and less accurate,
 * so below the floor the Feedback itself is the better page to be sent to.
 */
export function FeedbackSummaryEmpty() {
  return (
    <Card>
      <CardHeader className="items-start text-start">
        <CardTitle>Your summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <Text as="p" variant="body-1">
          There is not enough written to you yet for a summary to be worth
          reading. Once a few more people have written, this is where what they
          said adds up.
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
