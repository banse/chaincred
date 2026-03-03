import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, 'db-schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

const sql = getDb();
await sql.unsafe(schema);
console.log('Migration complete');
await sql.end();
