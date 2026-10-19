import { pool } from "../db";
import { insertIssuesEvents } from "../repositories/events";
import { countIssues, insertIssue, nextIssueNumber, selectIssue, selectIssueForUpdate, selectIssues, updateIssue } from "../repositories/issues";
import { selectProject, selectProjectIdForUpdate, selectProjectKey } from "../repositories/projects";
import { IdParams, Issue, IssuesQuery, Meta, Priority, Status } from "../types";

interface IssueWithKey extends Issue {
  key: string;
}

interface ListIssuesParams {
  key: string;
  query: IssuesQuery;
}

interface ListIssuesResult {
  issues: IssueWithKey[];
  meta: Meta
}

interface CreateIssueParams {
  key: string;
  title: string;
  description?: string;
  priority: Priority;
  author_id: string;
  assignee_id?: string;
}

interface ChangeIssueBody {
  title?: string;
  description?: string | null;
  status?: Status;
  priority?: Priority;
  assignee_id?: string | null;
}

interface ChangeIssueParams {
  id: string;
  actor_id: string;
  body: ChangeIssueBody;
}

export async function getIssue(params: IdParams): Promise<IssueWithKey | null> {
  const result = await selectIssue(params);

  if (!result) return null;

  const { project_key, ...issue } = result;

  return {
    key: `${project_key}-${issue.number}`,
    ...issue,
  };
}

export async function listIssues(params: ListIssuesParams): Promise<ListIssuesResult | null> {
  const key = params.key.toUpperCase();
  const query = params.query;

  const project = await selectProject({ key });

  if (!project) return null;

  const offset = (query.page - 1) * query.limit;

  const total = await countIssues({ project_id: project.id, query });

  if (!total) {
    return { 
      issues: [], 
      meta: {
        total: 0,
        page: query.page,
        next_page: null,
        prev_page: null,
        limit: query.limit,
      } 
    }
  }

  const issuesResult = await selectIssues({ project_id: project.id, query, offset });

  const hasNextPage = query.page * query.limit < total;
  const hasPrevPage = query.page > 1;

  const nextPage = hasNextPage ? query.page + 1 : null;
  const prevPage = hasPrevPage ? query.page - 1 : null;

  const issues = issuesResult.map((issue) => ({
    key: `${key}-${issue.number}`,
    ...issue,
  }));

  return { 
    issues, 
    meta: {
      total,
      page: query.page,
      next_page: nextPage,
      prev_page: prevPage,
      limit: query.limit,
    } 
  };
}

export async function createIssue(params: CreateIssueParams): Promise<IssueWithKey> {
  const { title, description, priority, author_id, assignee_id } = params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const key = params.key.toUpperCase();

    const project_id = await selectProjectIdForUpdate(client, { key });

    if (!project_id) {
      throw new Error('PROJECT_NOT_FOUND');
    };

    const next_number = await nextIssueNumber(client, { project_id });

    const issue = await insertIssue(client, { project_id, next_number, title, description, status: 'todo', priority, author_id, assignee_id });

    await client.query('COMMIT');

    return {
      key: `${key}-${next_number}`,
      ...issue,
    };
  } catch (error) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
}

export async function changeIssue(params: ChangeIssueParams): Promise<IssueWithKey> {
  const { id, actor_id, body } = params;

  if (!Object.keys(body).length) {
    throw new Error('INVALID_PARAMS');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const issue = await selectIssueForUpdate(client, { id });

    if (!issue) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    const project_key = await selectProjectKey(client, { id: issue.project_id });

    const issueKey = `${project_key}-${issue.number}`;

    const changesKeys = Object.keys(body).filter(
      (key) => String(issue[key as keyof Issue]) !== String(body[key as keyof typeof body]),
    );

    if (!changesKeys.length) {
      await client.query('COMMIT');

      return {
        key: issueKey,
        ...issue,
      };
    }

    const updateBody = {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assignee_id: issue.assignee_id,
      ...body,
    };

    const issueUpdated = await updateIssue(client, { id, ...updateBody });


    for (const key of changesKeys) {
      await insertIssuesEvents(client, { issue_id: id, actor_id, field: key, old_value: issue[key as keyof ChangeIssueBody], new_value: body[key as keyof ChangeIssueBody] ?? null });
    }

    await client.query('COMMIT');

    return {
      key: issueKey,
      ...issueUpdated,
    };
  } catch (error) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
}