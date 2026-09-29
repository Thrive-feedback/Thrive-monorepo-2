/**
 * The year is read at render time, and this page is prerendered, so it shows the year of the
 * last build: a deploy in January is what moves it forward.
 */
export function SiteFooter() {
  return (
    <footer className="flex shrink-0 flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between md:px-10">
      {/* TODO(kritpavin): make these links once the terms and privacy pages exist. Until then
          they are text, because a link to nowhere is a control that does nothing. */}
      <ul className="flex gap-4 text-link">
        <li>Terms and Conditions</li>
        <li>Privacy Policy</li>
      </ul>
      <p className="text-brand">
        ©{new Date().getFullYear()} Thrive All rights reserved
      </p>
    </footer>
  );
}
