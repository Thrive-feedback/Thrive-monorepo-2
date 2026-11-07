import { Text } from '@/components/atoms/text';

export type PageTitleProps = {
  /** For something to send focus here, with `tabIndex` of -1. */
  id?: string;
  tabIndex?: number;
  children: React.ReactNode;
};

/** The title at the head of a page beside the sidebar, in the display face. */
export function PageTitle(props: PageTitleProps) {
  return <Text as="h1" variant="display-5" {...props} />;
}
