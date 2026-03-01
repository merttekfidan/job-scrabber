import { Pool, QueryResult } from 'pg';
import logger from './logger';

let pool: Pool | undefined;

if (!process.env.DATABASE_URL) {
  logger.warn('DATABASE_URL is not defined');
}

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err: Error) => {
    logger.error('Unexpected error on idle client', { error: err.message });
  });
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await pool!.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
