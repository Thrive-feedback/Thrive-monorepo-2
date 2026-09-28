import { libraryConfig } from "@repo/eslint-config/library";

/** @type {import("eslint").Linter.Config} */
export default [
  // Generated files are build output. Linting them reports on the generator's style,
  // and the only available fix is hand-editing generated code, which is never allowed.
  { ignores: ["src/generated/**"] },
  ...libraryConfig,
];
