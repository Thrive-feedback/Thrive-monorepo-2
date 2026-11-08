import { Text } from '@/components/atoms/text';

export type ShowcasePageProps = {
  /** The page's h1. A component's page leaves it out, since its entry draws its own. */
  title?: string;
  /** What the page is for, under the title. */
  description?: React.ReactNode;
  /** For something to send focus back to the title, which then takes `tabIndex` of -1. */
  titleId?: string;
  children: React.ReactNode;
};

/**
 * Every showcase page's frame: one width, one gap between sections, and one header, so moving
 * between Components, Tokens and the galleries reads as one place.
 */
export function ShowcasePage({
  title,
  description,
  titleId,
  children,
}: ShowcasePageProps) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      {title && (
        <header className="flex flex-col gap-2">
          <Text
            variant="h5"
            as="h1"
            id={titleId}
            tabIndex={titleId ? -1 : undefined}
          >
            {title}
          </Text>
          {description && (
            <Text
              as="div"
              tone="muted"
              className="flex max-w-2xl flex-col gap-2"
            >
              {description}
            </Text>
          )}
        </header>
      )}
      {children}
    </main>
  );
}
