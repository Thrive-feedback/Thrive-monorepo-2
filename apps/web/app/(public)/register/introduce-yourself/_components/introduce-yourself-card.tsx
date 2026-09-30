import { signOut } from '@/app/(public)/_lib/mock-session.service';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { IntroduceYourselfForm } from './introduce-yourself-form';

export type IntroduceYourselfCardProps = {
  email: string;
};

export function IntroduceYourselfCard({ email }: IntroduceYourselfCardProps) {
  return (
    <Card title="Introduce yourself" titleAs="h2" className="max-w-110">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground-muted text-sm">
          Signed in as <span className="font-medium text-brand">{email}</span>
        </p>
        <form action={signOut}>
          <Button type="submit" size="sm">
            Not you?
          </Button>
        </form>
      </div>
      <IntroduceYourselfForm />
    </Card>
  );
}
