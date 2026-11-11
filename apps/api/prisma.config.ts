import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

// The connection URL is needed only by commands that reach the database (migrate, db);
// `prisma generate` runs without it, for example while building container images.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
