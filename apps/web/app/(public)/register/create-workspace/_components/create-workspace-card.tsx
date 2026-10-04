import { useTranslations } from 'next-intl';
import { Card } from '@/components/atoms/card';
import { CreateWorkspaceForm } from './create-workspace-form';

export function CreateWorkspaceCard() {
  const t = useTranslations('CreateWorkspace');

  return (
    <Card
      title={t('title')}
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <CreateWorkspaceForm />
    </Card>
  );
}
