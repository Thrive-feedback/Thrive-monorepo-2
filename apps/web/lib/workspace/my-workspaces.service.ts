import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { MyWorkspace, MyWorkspaces } from './my-workspace.type';

/** Far more Workspaces than anyone belongs to, so one page covers them. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * Every Workspace the signed-in person is in, and every one they were Deactivated in, for the
 * switcher. Both are read together. Not cached across requests: switching, joining or being
 * Deactivated changes them at once.
 */
export async function readMyWorkspaces(): Promise<MyWorkspaces> {
  const [active, inactive] = await Promise.all([
    readMine('ACTIVE'),
    readMine('DEACTIVATED'),
  ]);
  return { active, inactive };
}

async function readMine(
  status: 'ACTIVE' | 'DEACTIVATED',
): Promise<MyWorkspace[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const memberships = await apiClient().GET('/v1/members/mine', {
    params: { header: { cookie }, query: { ...ONE_PAGE, status } },
    cache: 'no-store',
  });
  return unwrap(memberships).items.map(({ workspace }) => ({
    id: workspace.id,
    name: workspace.name,
  }));
}
