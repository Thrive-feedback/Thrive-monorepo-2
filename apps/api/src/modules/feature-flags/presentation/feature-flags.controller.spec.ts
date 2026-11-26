import { describe, expect, it } from 'bun:test';
import { FeatureFlagsConfig } from '@app/config/configuration';
import { GetFeatureFlagsUseCase } from '../application/use-cases/get-feature-flags.use-case';
import { getFeatureFlagsResponseSchema } from './dto/get-feature-flags.dto';
import { FeatureFlagsController } from './feature-flags.controller';

function controllerWith({
  showsDashboard = false,
  showsHrLanding = false,
}: {
  showsDashboard?: boolean;
  showsHrLanding?: boolean;
}): FeatureFlagsController {
  return new FeatureFlagsController(
    new GetFeatureFlagsUseCase(
      new FeatureFlagsConfig(showsDashboard, showsHrLanding),
    ),
  );
}

describe('the feature flags route', () => {
  it.each([
    [true, 'true'],
    [false, 'false'],
  ] as const)('answers a dashboard set to %p as %p', (showsDashboard, wire) => {
    expect(
      controllerWith({ showsDashboard }).getFeatureFlags().USER_DASHBOARD_FLAG,
    ).toBe(wire);
  });

  it.each([
    [true, 'true'],
    [false, 'false'],
  ] as const)(
    'answers an HR front page set to %p as %p',
    (showsHrLanding, wire) => {
      expect(
        controllerWith({ showsHrLanding }).getFeatureFlags().HR_LANDING_FLAG,
      ).toBe(wire);
    },
  );

  it('answers in the shape it publishes', () => {
    expect(
      getFeatureFlagsResponseSchema.safeParse(
        controllerWith({}).getFeatureFlags(),
      ).success,
    ).toBe(true);
  });
});
