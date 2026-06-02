import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

export default db;
