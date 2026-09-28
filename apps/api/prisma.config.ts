import { defineConfig } from 'prisma/config';
import { getMigrationDatabaseUrl } from './src/config/configuration';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
