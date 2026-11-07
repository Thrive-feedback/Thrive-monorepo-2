import { Text } from '@/components/atoms/text';

/** Waiting for me with nothing left in it. */
export function WaitingEmpty() {
  return (
    <Text as="p" variant="subtitle-3" className="py-5">
      Nothing is waiting for you.
    </Text>
  );
}
