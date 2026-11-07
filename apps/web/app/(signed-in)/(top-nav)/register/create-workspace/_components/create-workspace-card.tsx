import { createWorkspace } from '@/app/(signed-in)/(top-nav)/register/create-workspace/_lib/workspace-actions.service';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/atoms/card';
import { CreateWorkspaceForm } from '@/components/organisms/create-workspace-form';

export function CreateWorkspaceCard() {
  return (
    <Card className="max-w-110 justify-self-center md:justify-self-end">
      <CardHeader>
        <CardTitle as="h2">Create a Workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <CreateWorkspaceForm action={createWorkspace} />
      </CardContent>
    </Card>
  );
}
