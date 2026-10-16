/**
 * Where choosing something takes the person: an address, or something to do in place.
 *
 * A page that keeps its state in the URL hands out addresses, so a reload or a shared link comes
 * back to the same place. A page drawing the same components somewhere it has no URL of its own,
 * such as the landing page's preview of Home, hands out callbacks instead.
 */
export type NavTarget =
  | { readonly href: string }
  | { readonly onSelect: () => void };
