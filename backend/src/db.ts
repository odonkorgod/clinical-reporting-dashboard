import { PrismaPg } from '@prisma/adapter-pg';
import { withVerifiedSsl } from './connection.js';
import { env } from './env.js';
import { PrismaClient } from './generated/prisma/client.js';

// This is a long-running Node server, so per Neon's guidance it uses
// node-postgres (via Prisma's pg adapter) with one pool reused across requests,
// connected through the pooled (-pooler) DATABASE_URL.
const adapter = new PrismaPg({ connectionString: withVerifiedSsl(env.DATABASE_URL) });

export const prisma = new PrismaClient({ adapter });
