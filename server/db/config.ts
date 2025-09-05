import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const uri = process.env.DATABASE_URL;
if (!uri) {
  throw new Error('DATABASE_URL no configurada');
}

export const connection = mysql.createPool({ uri, ssl: false });
export const db = drizzle(connection, { schema, mode: 'default' });

export { schema };
