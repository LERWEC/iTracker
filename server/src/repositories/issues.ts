import { PoolClient } from 'pg';
import { pool } from '../db';
import { IdParams, Issue, IssuesQuery, Priority, Status } from '../types';

interface SelectIssueResult extends Issue {
  project_key: string;
}

interface SelectIssuesParams {
  project_id: string;
  query: IssuesQuery;
  offset: number;
}

interface InsertIssueParams {
  project_id: string;
  next_number: number;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  author_id: string;
  assignee_id?: string;
}

interface UpdateIssueParams {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  assignee_id: string | null;
}

interface CountIssuesParams {
  project_id: string;
  query: IssuesQuery;
}

interface NextIssueNumberParams {
  project_id: string;
}

export async function selectIssue(params: IdParams): Promise<SelectIssueResult | null> {
  const { id } = params;

  const result = await pool.query(
    'SELECT issues.id, issues.project_id, issues.number, issues.title, issues.description, issues.status, issues.priority, issues.author_id, issues.assignee_id, issues.created_at, issues.updated_at, projects.key AS project_key FROM issues JOIN projects ON projects.id = issues.project_id WHERE issues.id = $1',
    [id],
  );

  return result.rows[0] ?? null;
}

export async function selectIssueForUpdate(client: PoolClient, params: IdParams): Promise<Issue | null> {
  const { id } = params;

  const result = await client.query(
    'SELECT id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at FROM issues WHERE id = $1 FOR UPDATE',
    [id],
  );

  return result.rows[0] ?? null;
}

export async function selectIssues(params: SelectIssuesParams): Promise<Issue[]> {
  const { project_id, query, offset } = params;

  const result = await pool.query(
    'SELECT id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at FROM issues WHERE project_id = $1 AND ($2::text IS NULL OR status = $2) AND ($3::text IS NULL OR priority = $3) AND ($4::bigint IS NULL OR author_id = $4) AND ($5::bigint IS NULL OR assignee_id = $5) ORDER BY number LIMIT $6 OFFSET $7',
    [project_id,
      query.status,
      query.priority,
      query.author_id,
      query.assignee_id,
      query.limit,
      offset],
  );

  return result.rows;
}

export async function insertIssue(client: PoolClient, params: InsertIssueParams): Promise<Issue> {
  const { project_id, next_number, title, description, status, priority, author_id, assignee_id } = params;

  const issue = await client.query(
    'INSERT INTO issues (project_id, number, title, description, status, priority, author_id, assignee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at',
    [
      project_id,
      next_number,
      title,
      description,
      status,
      priority,
      author_id,
      assignee_id,
    ],
  );

  return issue.rows[0];
}

export async function updateIssue(client: PoolClient, params: UpdateIssueParams): Promise<Issue> {
  const { id, title, description, status, priority, assignee_id } = params;

  const issue = await client.query(
    'UPDATE issues SET title = $1, description = $2, status = $3, priority = $4, assignee_id = $5, updated_at = now() WHERE id = $6 RETURNING id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at',
    [
      title,
      description,
      status,
      priority,
      assignee_id,
      id,
    ],
  );

  return issue.rows[0];
}

export async function countIssues(params: CountIssuesParams): Promise<number> {
  const { project_id, query } = params;

  const result = await pool.query(
    'SELECT COUNT(*)::int AS total FROM issues WHERE project_id = $1 AND ($2::text IS NULL OR status = $2) AND ($3::text IS NULL OR priority = $3) AND ($4::bigint IS NULL OR author_id = $4) AND ($5::bigint IS NULL OR assignee_id = $5)',
    [project_id, query.status, query.priority, query.author_id, query.assignee_id],
  );

  return result.rows[0].total;
}

export async function nextIssueNumber(client: PoolClient, params: NextIssueNumberParams ): Promise<number> {
  const { project_id } = params;

  const result = await client.query(
    'SELECT COALESCE(MAX(number), 0) + 1 AS next_number FROM issues WHERE project_id = $1',
    [project_id],
  );

  return result.rows[0].next_number;
}