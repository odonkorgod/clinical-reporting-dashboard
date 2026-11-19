import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// `neon deploy` / `neon env pull` write the branch's variables to the repo
// root. Variables already set in the environment take precedence.
for (const file of ['.env.local', '.env']) {
  const path = resolve(import.meta.dirname, '..', file);
  if (existsSync(path)) process.loadEnvFile(path);
}

// Migrations must use the direct (non-pooled) connection: PgBouncer's
// transaction mode breaks Prisma Migrate's session-level statements.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Omitted when unset so `prisma generate` (and therefore builds) work without credentials.
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
