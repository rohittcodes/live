import { config } from 'dotenv';
config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run Drizzle Kit commands.');
}

// Neon requires sslmode=require for direct pg connections used by drizzle-kit.
// If the URL already has it we leave it alone; otherwise we append it.
const url = new URL(databaseUrl);
if (!url.searchParams.has('sslmode')) {
  url.searchParams.set('sslmode', 'require');
}

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: url.toString(),
  },
});
