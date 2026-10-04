import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { LanguageSwitch } from '@/components/organisms/language-switch';

/**
 * The landing route, deliberately empty of product: the web app renders a page of its own,
 * and nothing is built ahead of the first real feature. The first real route replaces this.
 *
 * Every class resolves to a token: a role for colour, shape and type, a scale for spacing.
 * `bg-primary-500` is not a class that exists, because the theme exposes colour only as roles.
 */
export default function Home() {
  const t = useTranslations('Home');

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-24">
      <Text variant="display5" as="h1">
        {t('heading')}
      </Text>
      <Text tone="muted">{t('tagline')}</Text>
      <Button asChild variant="primary" size="sm" className="w-fit">
        <Link href="/ui-showcase">{t('seeComponents')}</Link>
      </Button>
      <LanguageSwitch />
    </main>
  );
}
