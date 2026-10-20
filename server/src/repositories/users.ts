import { pool } from '../db';
import { IdParams } from '../types';

interface InsertUserParams {
  email: string;
  passwordHash: string;
  name: string;
}

interface InsertUserResult {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

interface SelectUserLoginParams {
  email: string;
}

interface SelectUserLoginResult {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

interface SelectUserResult {
  id: string;
  email: string;
  name: string;
}

export async function insertUser(params: InsertUserParams): Promise<InsertUserResult> {
  const { email, passwordHash, name } = params;

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, passwordHash, name],
  );

  return result.rows[0];
}

export async function selectUserLogin(
  params: SelectUserLoginParams,
): Promise<SelectUserLoginResult | null> {
  const { email } = params;

  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email],
  );

  return result.rows[0] ?? null;
}

export async function selectUsers(): Promise<InsertUserResult[] | null> {
  const result = await pool.query('SELECT id, email, name, created_at FROM users');

  return result.rows;
}

export async function selectUser(params: IdParams): Promise<SelectUserResult | null> {
  const { id } = params;

  const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);

  return result.rows[0] ?? null;
}
