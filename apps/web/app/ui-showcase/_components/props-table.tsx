export type PropRow = {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
};

export type PropsTableProps = {
  caption: string;
  rows: readonly PropRow[];
};

/** A dash means no default: the prop is either required or simply absent until passed. */
export function PropsTable({ caption, rows }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-surface border border-border-default">
      <table className="w-full text-left text-body-2">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-raised text-fg-secondary">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Prop
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Default
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.name}
              className="border-border-default border-t align-top"
            >
              <th scope="row" className="px-3 py-2 font-medium font-mono">
                {row.name}
              </th>
              <td className="px-3 py-2 font-mono text-fg-accent">{row.type}</td>
              <td className="px-3 py-2 font-mono">{row.defaultValue ?? '—'}</td>
              <td className="px-3 py-2 text-fg-secondary">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
