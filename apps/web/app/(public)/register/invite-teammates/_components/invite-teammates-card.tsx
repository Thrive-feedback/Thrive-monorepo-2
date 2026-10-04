import { useTranslations } from 'next-intl';
import { Card } from '@/components/atoms/card';
import { InviteTeammatesForm } from './invite-teammates-form';

export function InviteTeammatesCard() {
  const t = useTranslations('InviteTeammates');

  return (
    <Card
      title={t('title')}
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <InviteTeammatesForm />
    </Card>
  );
}
