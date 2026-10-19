import { PoolClient } from 'pg';
import { pool } from '../db';

interface IssueEvent {
  id: string;
  issue_id: string;
  actor_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: Date;
}

interface SelectIssuesEventsParams {
  issue_id: string;
}

interface InsertIssuesEventsParams {
  issue_id: string;
  actor_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export async function selectIssueEvents(params: SelectIssuesEventsParams): Promise<IssueEvent[]> {
  const { issue_id } = params;

  const result = await pool.query(
    'SELECT id, issue_id, actor_id, field, old_value, new_value, created_at FROM issue_events WHERE issue_id = $1 ORDER BY created_at',
    [issue_id],
  );

  return result.rows;
}

export async function insertIssuesEvents(client: PoolClient, params: InsertIssuesEventsParams): Promise<void> {
  const { issue_id, actor_id, field, old_value, new_value } = params;

  await client.query(
    'INSERT INTO issue_events (issue_id, actor_id, field, old_value, new_value) VALUES ($1, $2, $3, $4, $5)',
    [issue_id, actor_id, field, old_value, new_value],
  );
}