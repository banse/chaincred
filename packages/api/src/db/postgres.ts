// PostgreSQL client — connects when DATABASE_URL is available
let db: any = null;

export async function getDb() {
  if (!db) {
    // Lazy import to avoid crash when postgres isn't available
    try {
      const postgres = await import('postgres');
      const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/chaincred';
      db = postgres.default(connectionString);
    } catch {
      console.warn('PostgreSQL not available — using mock data');
    }
  }
  return db;
}
