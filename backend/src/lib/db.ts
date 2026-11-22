import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Embedded PGlite for local/dev, Neon (pg) when DATABASE_URL is set.
type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>; exec?: (sql: string) => Promise<unknown> };

let client: Queryable | null = null;
let migrated = false;

async function getClient(): Promise<Queryable> {
  if (client) return client;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    client = pool;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
    mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    client = {
      query: async (text, params) => db.query(text, params as any[]) as any,
      exec: (sql) => db.exec(sql),
    };
  }
  await migrate(client);
  return client;
}

async function migrate(db: Queryable) {
  if (migrated) return;
  await db.query(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const dir = path.join(process.cwd(), "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const seen = await db.query("SELECT 1 FROM _migrations WHERE name = $1", [file]);
    if (seen.rows.length) continue;
    const sql = readFileSync(path.join(dir, file), "utf8");
    if (db.exec) await db.exec(sql);
    else await db.query(sql);
    await db.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
  }
  migrated = true;
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const db = await getClient();
  const res = await db.query(text, params);
  return res.rows as T[];
}
export async function queryOne<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
