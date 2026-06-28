import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hotech';

// Disable prefetch for compatibility with serverless/pooler databases like Neon/Supabase
const queryClient = postgres(connectionString, { prepare: false });
export const db = drizzle(queryClient, { schema });
