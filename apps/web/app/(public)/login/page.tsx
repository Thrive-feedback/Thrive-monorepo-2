import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignInPrompt } from './_components/sign-in-prompt';

/**
 * The title is absolute, skipping the layout's "· Thrive" template, so the tab says exactly
 * what the page's heading says.
 *
 * Indexable on purpose: someone searching for Thrive's login should land here. There is no
 * canonical URL, because it has to be absolute and the app has no production domain yet.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Login');
  const title = t('title');
  const description = t('description');
  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    openGraph: { title, description },
  };
}

export default function LoginPage() {
  return <SignInPrompt />;
}
