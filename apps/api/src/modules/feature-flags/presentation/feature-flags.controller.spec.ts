import { describe, expect, it } from 'bun:test';
import { FeatureFlagsConfig } from '@app/config/configuration';
import { GetFeatureFlagsUseCase } from '../application/use-cases/get-feature-flags.use-case';
import { getFeatureFlagsResponseSchema } from './dto/get-feature-flags.dto';
import { FeatureFlagsController } from './feature-flags.controller';

function controllerWith(showsDashboard: boolean): FeatureFlagsController {
  return new FeatureFlagsController(
    new GetFeatureFlagsUseCase(new FeatureFlagsConfig(showsDashboard)),
  );
}

describe('the feature flags route', () => {
  it.each([
    [true, 'true'],
    [false, 'false'],
  ] as const)('answers a dashboard set to %p as %p', (showsDashboard, wire) => {
    expect(controllerWith(showsDashboard).getFeatureFlags()).toEqual({
      USER_DASHBOARD_FLAG: wire,
    });
  });

  it('answers in the shape it publishes', () => {
    expect(
      getFeatureFlagsResponseSchema.safeParse(
        controllerWith(false).getFeatureFlags(),
      ).success,
    ).toBe(true);
  });
});
