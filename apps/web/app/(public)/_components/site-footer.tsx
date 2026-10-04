import { useFormatter, useTranslations } from 'next-intl';
import { Text } from '@/components/atoms/text';
import { LanguageSwitch } from '@/components/organisms/language-switch';

/**
 * The year is formatted for the language, so Thai shows the Buddhist-era year (พ.ศ. 2569)
 * where English shows 2026.
 */
export function SiteFooter() {
  const t = useTranslations('SiteFooter');
  const format = useFormatter();
  const year = format.dateTime(new Date(), { year: 'numeric' });

  return (
    <footer className="flex shrink-0 flex-col gap-2 px-4 py-6 text-caption sm:flex-row sm:items-center sm:justify-between md:px-10">
      {/* TODO(kritpavin): make these links once the terms and privacy pages exist. Until then
          they are text, because a link to nowhere is a control that does nothing. */}
      <ul className="flex gap-4 text-link">
        <li>{t('terms')}</li>
        <li>{t('privacy')}</li>
      </ul>
      <LanguageSwitch />
      <Text variant="caption" as="p" tone="brand">
        {t('copyright', { year })}
      </Text>
    </footer>
  );
}
