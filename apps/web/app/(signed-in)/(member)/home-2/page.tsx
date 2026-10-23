import type { Metadata } from 'next';
import { requireMember } from '@/lib/session/session.service';
import { LetterDesk } from './_components/letter-desk';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

/**
 * The new Home, built beside the one Members land on until it is ready to replace it: Feedback
 * written as a letter. Nothing links here yet, and nothing on it reaches the API.
 */
export default async function Home2() {
  await requireMember();

  return (
    <>
      <h1 className="sr-only">Home</h1>
      <LetterDesk />
    </>
  );
}
