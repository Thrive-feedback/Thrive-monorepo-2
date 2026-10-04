'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/atoms/button';
import { setLocale } from '@/lib/i18n/locale.action';
import { LOCALES, type Locale } from '@/lib/i18n/locale.constant';

/**
 * A stand-in so the two languages can be checked side by side. Each language is named in itself,
 * so someone who cannot read the current one can still find their own.
 *
 * The refresh re-renders the server components in the new language without leaving the page,
 * so whatever the person typed into a form stays put.
 */
// TODO(kritpavin, #10): replace with the Member's language setting in Profile.
export function LanguageSwitch() {
  const t = useTranslations('LanguageSwitch');
  const current = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChoose(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <fieldset className="flex gap-1">
      <legend className="sr-only">{t('label')}</legend>
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant={locale === current ? 'soft' : 'ghost'}
          size="sm"
          lang={locale}
          aria-pressed={locale === current}
          disabled={isPending}
          onClick={() => handleChoose(locale)}
        >
          {t(locale)}
        </Button>
      ))}
    </fieldset>
  );
}
