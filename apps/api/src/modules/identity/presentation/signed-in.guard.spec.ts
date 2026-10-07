import { describe, expect, it } from 'bun:test';
import type { ActorRequest } from '@app/shared/presentation/actor';
import { Public } from '@app/shared/presentation/actor';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { NotSignedInError } from '../application/identity.errors';
import { SignedInGuard } from './signed-in.guard';

class ClosedController {
  route() {}
}

@Public()
class OpenController {
  route() {}
}

function contextFor(
  controller: { new (): { route(): void } },
  request: Partial<ActorRequest>,
): ExecutionContext {
  return {
    getHandler: () => controller.prototype.route,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('the signed-in guard', () => {
  it('lets a signed-in caller through and hands the route who they are', async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.session = {
      account: { id: 'account-ann', email: 'ann@acme.test', name: 'Ann Lee' },
      needsRefresh: false,
    };
    const request: Partial<ActorRequest> = { headers: { cookie: 'cookie-a' } };

    const allowed = await new SignedInGuard(
      new Reflector(),
      identityPort,
    ).canActivate(contextFor(ClosedController, request));

    expect(allowed).toBe(true);
    expect(request.actor).toEqual({
      accountId: 'account-ann',
      email: 'ann@acme.test',
    });
    expect(identityPort.calls).toEqual([
      { method: 'currentSession', credential: 'cookie-a' },
    ]);
  });

  it('refuses a caller with no session on a route nobody opened', async () => {
    const guard = new SignedInGuard(new Reflector(), new FakeIdentityPort());

    await expect(
      guard.canActivate(contextFor(ClosedController, { headers: {} })),
    ).rejects.toThrow(NotSignedInError);
  });

  it('lets anyone through a public route without asking who they are', async () => {
    const identityPort = new FakeIdentityPort();

    const allowed = await new SignedInGuard(
      new Reflector(),
      identityPort,
    ).canActivate(contextFor(OpenController, { headers: {} }));

    expect(allowed).toBe(true);
    expect(identityPort.calls).toEqual([]);
  });
});
