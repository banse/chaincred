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
