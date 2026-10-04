import type { Locale } from './locale.constant';
import type { Messages } from './messages.constant';

/** Types every `t('…')` against the English messages, so an unknown key fails the type check. */
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
