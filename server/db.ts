import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Auto-detect database type
const databaseUrl = process.env.DATABASE_URL;
const isSQLite = databaseUrl.startsWith('file:') || databaseUrl.endsWith('.db');

let db: any;

if (isSQLite) {
  // SQLite setup
  const dbPath = databaseUrl.replace('file:', '');
  const sqlite = new Database(dbPath);
  db = drizzleSQLite(sqlite, { schema });
} else {
  // PostgreSQL/Neon setup
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema });
}

export { db };