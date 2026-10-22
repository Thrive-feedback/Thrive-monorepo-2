import type { Metadata } from 'next';
import { LetterShowcase } from './_components/letter-showcase';

export const metadata: Metadata = {
  title: 'Letter',
  description: 'Feedback written as a letter, as a first look.',
  robots: { index: false, follow: false },
};

/** A first look at Feedback as a letter. Nothing on it reaches the API. */
export default function LetterPage() {
  return <LetterShowcase />;
}
