/**
 * The browser's cookie header, forwarded by the web server. It carries the session, so
 * every route that needs to know the caller declares it. Absent when signed out.
 */
export const COOKIE_HEADER = {
  name: 'cookie',
  required: false,
  description: "The browser's cookie header, forwarded by the web server.",
};
