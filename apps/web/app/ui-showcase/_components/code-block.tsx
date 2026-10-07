import { CopyButton } from './copy-button';

export type CodeBlockProps = {
  code: string;
  label: string;
};

export function CodeBlock({ code, label }: CodeBlockProps) {
  return (
    <div className="relative rounded-surface border border-border-default bg-surface-raised">
      <div className="absolute top-2 right-2">
        <CopyButton text={code} label={`Copy ${label}`} />
      </div>
      <pre className="overflow-x-auto p-4 pe-20 font-mono text-body-2">
        <code>{code}</code>
      </pre>
    </div>
  );
}
