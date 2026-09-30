/**
 * DEMO FILE — this pull request is never merged.
 *
 * It exists to satisfy one acceptance criterion of #46: a pull request that crosses a
 * forbidden boundary on purpose shows the `Architecture` check red, with the rule and the
 * document named in the output.
 *
 * The violation is one import. `FE_01` R5 says imports run down the ladder only —
 * route-private, then `components/`, then the shared UI package — so a shared component may
 * never reach back into a route. The rule is `fe-components-never-import-app`.
 *
 * Nothing else objects: the file type-checks and it is correctly formatted, so `Types` and
 * `Code style` stay green. Each check reports its own concern.
 */
import Home from '../app/page';

export const demoBoundary = Home;
