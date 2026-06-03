import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function updateDb() {
  try {
    console.log('Adding likes, views, and tipo_texto to narrativas_crudas...');
    await pool.query("ALTER TABLE narrativas_crudas ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE narrativas_crudas ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE narrativas_crudas ADD COLUMN IF NOT EXISTS tipo_texto VARCHAR(50) DEFAULT 'publicacion';");
    console.log('Database updated successfully.');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    pool.end();
  }
}

updateDb();
