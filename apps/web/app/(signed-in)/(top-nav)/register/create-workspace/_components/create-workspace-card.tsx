import { Card } from '@/components/atoms/card';
import { CreateWorkspaceForm } from './create-workspace-form';

export function CreateWorkspaceCard() {
  return (
    <Card
      title="Create a Workspace"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <CreateWorkspaceForm />
    </Card>
  );
}
