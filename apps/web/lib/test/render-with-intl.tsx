import {
  type RenderOptions,
  type RenderResult,
  render,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { type Locale, TIME_ZONE } from '@/lib/i18n/locale.constant';
import { MESSAGES } from '@/lib/i18n/messages.constant';

/**
 * Renders inside the provider the root layout mounts, so a component reads its words the way it
 * does in the app. English unless a test is about another language.
 */
export function renderWithIntl(
  ui: React.ReactElement,
  { locale = 'en', ...options }: RenderOptions & { locale?: Locale } = {},
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone={TIME_ZONE}
      >
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
