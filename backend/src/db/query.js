import { pool } from './pool.js';

export function query(text, values) {
  return pool.query(text, values);
}
