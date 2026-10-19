import { PoolClient } from 'pg';
import { pool } from '../db';
import { IdParams } from '../types';

interface Project {
  id: string;
  key: string;
  name: string;
  created_at: Date;
}

interface SelectProjectParams {
  key: string;
}

interface InsertProjectParams {
  key: string;
  name: string;
}

export async function selectProject(params: SelectProjectParams): Promise<Project | null> {
  const { key } = params;

  const result = await pool.query('SELECT id, key, name, created_at FROM projects WHERE key = $1', 
    [key]
  );

  return result.rows[0] ?? null;
}

export async function selectProjects(): Promise<Project[]> {
  const result = await pool.query(
    'SELECT id, key, name, created_at FROM projects ORDER BY created_at',
  );

  return result.rows;
}

export async function selectProjectIdForUpdate(client: PoolClient, params: SelectProjectParams): Promise<string | null> {
  const { key } = params;

  const result = await client.query('SELECT id FROM projects WHERE key = $1 FOR UPDATE', 
    [key]
  );

  return result.rows[0]?.id ?? null;
}

export async function selectProjectKey(client: PoolClient, params: IdParams): Promise<string> {
  const { id } = params;

  const result = await client.query('SELECT key FROM projects WHERE id = $1', 
    [id]
  );

  return result.rows[0].key;
}

export async function insertProject(params: InsertProjectParams): Promise<Project> {
  const { key, name } = params;

  const result = await pool.query(
    'INSERT INTO projects (key, name) VALUES ($1, $2) RETURNING id, key, name, created_at',
    [key, name],
  );

  return result.rows[0];
}