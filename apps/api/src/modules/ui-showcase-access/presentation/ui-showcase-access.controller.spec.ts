import { describe, expect, it } from 'bun:test';
import { UiShowcaseConfig } from '@app/config/configuration';
import type { Actor } from '@app/shared/presentation/actor';
import { GetMyUiShowcaseAccessUseCase } from '../application/use-cases/get-my-ui-showcase-access.use-case';
import { getMyUiShowcaseAccessResponseSchema } from './dto/get-my-ui-showcase-access.dto';
import { UiShowcaseAccessController } from './ui-showcase-access.controller';

const controller = new UiShowcaseAccessController(
  new GetMyUiShowcaseAccessUseCase(
    new UiShowcaseConfig(new Set(['ann@acme.test'])),
  ),
);

function actor(email: string): Actor {
  return { accountId: 'account-1', email };
}

describe('the UI showcase access route', () => {
  it('answers the caller on the list that they may open it', () => {
    expect(controller.getMine(actor('ann@acme.test'))).toEqual({
      isAllowed: true,
    });
  });

  it('answers anybody else that they may not', () => {
    expect(controller.getMine(actor('ben@acme.test'))).toEqual({
      isAllowed: false,
    });
  });

  it('answers in the shape it publishes, and with nothing else', () => {
    const answer = controller.getMine(actor('ben@acme.test'));

    expect(
      getMyUiShowcaseAccessResponseSchema.strict().safeParse(answer).success,
    ).toBe(true);
  });
});
