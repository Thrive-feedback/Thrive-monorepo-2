import { Global, Module } from '@nestjs/common';

import {
  AuthConfig,
  CONFIGURATION,
  type Configuration,
  DatabaseConfig,
  HttpConfig,
  loadConfiguration,
} from './configuration';

/**
 * Configuration is parsed once at boot and handed out as typed values. Global so a module
 * declares a dependency on a namespace, not on this module.
 */
@Global()
@Module({
  providers: [
    { provide: CONFIGURATION, useFactory: () => loadConfiguration() },
    // Each namespace is a projection of the one value parsed above, never a second parse.
    {
      provide: HttpConfig,
      useFactory: (config: Configuration) => config.http,
      inject: [CONFIGURATION],
    },
    {
      provide: DatabaseConfig,
      useFactory: (config: Configuration) => config.database,
      inject: [CONFIGURATION],
    },
    {
      provide: AuthConfig,
      useFactory: (config: Configuration) => config.auth,
      inject: [CONFIGURATION],
    },
  ],
  exports: [HttpConfig, DatabaseConfig, AuthConfig],
})
export class ConfigModule {}
