import { pool } from "../db";

interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: Date;
}

interface SelectCommentsParams {
  issue_id: string;
}

interface InsertCommentParams {
  issue_id: string;
  author_id: string;
  body: string;
}

export async function selectComments(params: SelectCommentsParams): Promise<Comment[]> {
  const { issue_id } = params;

  const result = await pool.query('SELECT id, issue_id, author_id, body, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at', 
    [issue_id]
  );

  return result.rows;
}

export async function insertComment(params: InsertCommentParams): Promise<Comment> {
  const { issue_id, author_id, body } = params;

  const result = await pool.query('INSERT INTO comments (issue_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, issue_id, author_id, body, created_at', 
    [issue_id, author_id, body]
  );

  return result.rows[0];
}