import { useTranslations } from 'next-intl';
import { signOut } from '@/app/(public)/_lib/mock-session.service';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { Text } from '@/components/atoms/text';
import { IntroduceYourselfForm } from './introduce-yourself-form';

export type IntroduceYourselfCardProps = {
  email: string;
};

export function IntroduceYourselfCard({ email }: IntroduceYourselfCardProps) {
  const t = useTranslations('IntroduceYourself');

  return (
    <Card
      title={t('title')}
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Text variant="body2" tone="muted">
          {t.rich('signedInAs', {
            email,
            account: (chunks) => (
              <Text as="span" variant="subtitle4" tone="brand">
                {chunks}
              </Text>
            ),
          })}
        </Text>
        <form action={signOut}>
          <Button type="submit" size="sm">
            {t('notYou')}
          </Button>
        </form>
      </div>
      <IntroduceYourselfForm />
    </Card>
  );
}
