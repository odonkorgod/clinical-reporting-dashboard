import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

// Load the env file `neon deploy` / `neon env pull` writes at the repo root
// (.env.local, or .env if it exists). Works from both src/ and dist/.
// Variables already set in the environment take precedence.
for (const file of ['.env.local', '.env']) {
  const path = resolve(import.meta.dirname, '../..', file);
  if (existsSync(path)) process.loadEnvFile(path);
}

const EnvSchema = z.object({
  /** Pooled Neon connection string, used for application traffic. */
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`Invalid environment (${missing}). Run \`neon env pull\` in the repo root to fetch DATABASE_URL.`);
  process.exit(1);
}

export const env = parsed.data;
