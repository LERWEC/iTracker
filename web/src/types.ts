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
  status: string;
  priority: string;
  type: string;
  assignee: string;
  reporter: string;
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
