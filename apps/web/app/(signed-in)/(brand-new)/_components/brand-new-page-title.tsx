import { Text } from '@/components/atoms/text';

export type BrandNewPageTitleProps = {
  /** For something to send focus here, with `tabIndex` of -1. */
  id?: string;
  tabIndex?: number;
  children: React.ReactNode;
};

/** The title at the head of a page of the new Home, in the display face. */
export function BrandNewPageTitle(props: BrandNewPageTitleProps) {
  return <Text as="h1" variant="display-5" {...props} />;
}
