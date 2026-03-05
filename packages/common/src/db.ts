import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!sql) {
    sql = postgres(
      process.env.DATABASE_URL || 'postgresql://chaincred:chaincred@localhost:5432/chaincred',
    );
  }
  return sql;
}

/** Run lightweight migrations that add columns if missing. */
export async function runMigrations() {
  const db = getDb();
  await db`ALTER TABLE wallet_activity ADD COLUMN IF NOT EXISTS ens_name TEXT DEFAULT NULL`;
}
