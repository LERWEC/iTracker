export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface IdParams {
  id: string;
}

export interface Issue {
  id: string;
  project_id: string;
  number: number;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  author_id: string;
  assignee_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IssuesQuery {
  status?: string;
  priority?: string;
  author_id?: string;
  assignee_id?: string;
  page: number;
  limit: number;
}

export interface Meta {
  total: number;
  page: number;
  next_page: number | null;
  prev_page: number | null;
  limit: number;
}