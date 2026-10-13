import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

const CATEGORIES: readonly {
  readonly href: string;
  readonly name: string;
  readonly description: string;
}[] = [
  {
    href: ROUTES.settings.members,
    name: 'Members',
    description: 'Who is in your Workspace, and the invitations still open.',
  },
];

/** Each settings category, named and described, linking to its page. */
export function SettingsCategoryList() {
  return (
    <ul className="flex flex-col gap-4">
      {CATEGORIES.map((category) => (
        <li
          key={category.href}
          className="flex flex-col gap-1 rounded-page bg-surface-overlay p-4"
        >
          <Link href={category.href} className="self-start text-subtitle-4">
            {category.name}
          </Link>
          <Text as="p" variant="body-3" tone="muted">
            {category.description}
          </Text>
        </li>
      ))}
    </ul>
  );
}
