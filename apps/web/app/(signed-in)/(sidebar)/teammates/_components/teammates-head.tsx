import { PageLead } from '@/app/(signed-in)/(sidebar)/_components/page-lead';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';

export type TeammatesHeadProps = {
  /** Whose Workspace is listed. */
  workspaceName: string;
};

/** The title with its note by hand, over who is listed. */
export function TeammatesHead({ workspaceName }: TeammatesHeadProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PageTitle>Teammates</PageTitle>
        <HandwrittenNote
          size="md"
          writes="on-open"
          className="hidden -translate-y-1.5 md:block"
        >
          who you work with
        </HandwrittenNote>
      </div>
      <PageLead>Everyone in {workspaceName}.</PageLead>
    </div>
  );
}
