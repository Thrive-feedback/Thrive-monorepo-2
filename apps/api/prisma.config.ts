import { defineConfig } from 'prisma/config';
import { getMigrationDatabaseUrl } from './src/config/configuration';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // A getter, so the connection string is demanded by the commands that connect and not
    // by `prisma generate` — which needs no database, and runs in CI, where this variable
    // is deliberately absent.
    get url() {
      return getMigrationDatabaseUrl();
    },
  },
});
