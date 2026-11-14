import { describe, expect, it } from 'bun:test';
import { UiShowcaseConfig } from '@app/config/configuration';
import { GetMyUiShowcaseAccessUseCase } from './get-my-ui-showcase-access.use-case';

function useCaseAllowing(...emails: string[]): GetMyUiShowcaseAccessUseCase {
  return new GetMyUiShowcaseAccessUseCase(
    new UiShowcaseConfig(new Set(emails)),
  );
}

describe('whether the caller may open the UI showcase', () => {
  it('lets in someone on the list', () => {
    expect(
      useCaseAllowing('ann@acme.test').execute({ email: 'ann@acme.test' }),
    ).toEqual({ isAllowed: true });
  });

  it('keeps out someone who is not on it', () => {
    expect(
      useCaseAllowing('ann@acme.test').execute({ email: 'ben@acme.test' }),
    ).toEqual({ isAllowed: false });
  });

  it('keeps out everybody when the list is empty', () => {
    expect(useCaseAllowing().execute({ email: 'ann@acme.test' })).toEqual({
      isAllowed: false,
    });
  });

  it('does not match a different address that only shares a domain', () => {
    expect(
      useCaseAllowing('ann@acme.test').execute({ email: 'acme.test' }),
    ).toEqual({ isAllowed: false });
  });
});
