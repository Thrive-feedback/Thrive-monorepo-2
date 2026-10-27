import type { Teammate } from '@/lib/feedback/teammate.type';

/**
 * Made-up teammates for "Dear" and Selected people, until the new Home reads the Workspace's
 * own. More than four, so the stack of faces shows its "+N".
 */
export const MOCK_TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@thrive.example',
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@thrive.example',
    slug: 'krit',
    displayName: 'Krit',
  },
  {
    accountId: 'ann',
    name: 'Ann Lee',
    email: 'ann@thrive.example',
    slug: 'ann',
    displayName: 'Ann',
  },
  {
    accountId: 'ben',
    name: 'Ben Park',
    email: 'ben@thrive.example',
    slug: 'ben',
    displayName: 'Ben',
  },
  {
    accountId: 'dao',
    name: 'Dao Prasert',
    email: 'dao@thrive.example',
    slug: 'dao',
    displayName: 'Dao',
  },
  {
    accountId: 'nok',
    name: 'Nok Wattana',
    email: 'nok@thrive.example',
    slug: 'nok',
    displayName: 'Nok',
  },
  {
    accountId: 'chai',
    name: 'Chai Srisuk',
    email: 'chai@thrive.example',
    slug: null,
    displayName: null,
  },
];
