import { Text } from '@/components/atoms/text';
import { LetterDemo } from './letter-demo';

/** The letter demo under the showcase's own page heading. */
export function LetterShowcase() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <Text variant="h5" as="h1">
          Letter
        </Text>
        <Text variant="body-2" tone="muted">
          Feedback written as a letter, and Kudos on a card. Choose Request
          feedback, Give feedback or Kudos under Write to start writing. Nothing
          here is saved or sent.
        </Text>
      </header>
      <LetterDemo />
    </main>
  );
}
