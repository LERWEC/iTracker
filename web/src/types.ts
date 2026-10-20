export type Color = 'primary' | 'secondary' | 'error' | 'success' | 'info';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
}

export interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: string;
  author_id: string;
}

export interface IssueEvent {
  id: string;
  issue_id: string;
  actor_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: Date;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: Date;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  next_page: number | null;
  prev_page: number | null;
}

export enum IssueStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  InReview = 'in_review',
  Done = 'done',
}

export enum IssuePriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}
