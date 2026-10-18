import { createWorkspace } from '@/app/(signed-in)/(top-nav)/register/create-workspace/_lib/workspace-actions.service';
import { Card } from '@/components/atoms/card';
import { CreateWorkspaceForm } from '@/components/organisms/create-workspace-form';

export function CreateWorkspaceCard() {
  return (
    <Card
      title="Create a Workspace"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <CreateWorkspaceForm action={createWorkspace} />
    </Card>
  );
}
