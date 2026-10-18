import Fastify, { FastifyReply, FastifyRequest, type FastifyError } from 'fastify';
import cookiePlugin from '@fastify/cookie';
import jwtPlugin from '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
    };
  }
}
import { pool } from './db';
import z from 'zod';
import { hash, verify } from 'argon2';

const app = Fastify();

const port = +(process.env.PORT ?? 3000);

const start = async () => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set');
    }

    await app.register(cookiePlugin);
    await app.register(jwtPlugin, {
      secret: jwtSecret,
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    });

    await app.listen({ port, host: '127.0.0.1' });
    console.log(`listening on ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

app.setErrorHandler((error: FastifyError | z.ZodError, _req, reply) => {
  console.error(error);

  if (error instanceof z.ZodError) {
    return reply.code(400).send({
      error: 'validation',
      message: 'Invalid body',
    });
  }

  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return reply.code(409).send({
      error: 'conflict',
      message: 'Conflict',
    });
  }

  const statusCode = error.statusCode ?? 500;

  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'internal' : 'validation',
    message: statusCode >= 500 ? 'Internal server error' : 'Invalid body',
  });
});

app.get('/health', async (_req, reply) => {
  try {
    await pool.query('SELECT 1');
    return { status: 'ok' };
  } catch (err) {
    console.error(err);
    reply.code(503);
    return { status: 'error' };
  }
});

async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    return true;
  } catch {
    reply.code(401).send({
      error: 'unauthorized',
      message: 'Unauthorized',
    });
    return false;
  }
}

// auth

app.get('/auth/me', async (req, reply) => {
  try {
    const ok = await requireAuth(req, reply);
    if (!ok) return;

    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [
      req.user.sub,
    ]);

    if (!result.rows.length) {
      return reply.code(401).send({
        error: 'unauthorized',
        message: 'Unauthorized',
      });
    }

    const user = result.rows[0];
    return reply.send(user);
  } catch {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Unauthorized',
    });
  }
});

const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

app.post('/auth/register', async (req, reply) => {
  const body = registerBodySchema.parse(req.body);
  const email = body.email.toLowerCase();
  const passwordHash = await hash(body.password);

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, passwordHash, body.name],
  );

  const user = result.rows[0];

  const token = await reply.jwtSign({ sub: user.id });

  reply.setCookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });

  return reply.code(201).send(user);
});

const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

app.post('/auth/login', async (req, reply) => {
  const body = loginBodySchema.parse(req.body);
  const email = body.email.toLowerCase();

  const result = await pool.query('SELECT id, name, password_hash FROM users WHERE email = $1', [
    email,
  ]);

  if (!result.rows.length) {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Invalid email or password',
    });
  }

  const user = result.rows[0];

  const ok = await verify(user.password_hash, body.password);

  if (!ok) {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Invalid email or password',
    });
  }

  const token = await reply.jwtSign({ sub: user.id });

  reply.setCookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });

  return reply.send({
    id: user.id,
    name: user.name,
    email: body.email,
  });
});

app.post('/auth/logout', async (_req, reply) => {
  reply.clearCookie('token', { path: '/' });

  return { ok: true };
});

// projects

app.get('/projects', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const result = await pool.query(
    'SELECT id, key, name, created_at FROM projects ORDER BY created_at',
  );

  const projects = result.rows;
  return reply.send(projects);
});

const getProjectsKeyParamsSchema = z.object({ key: z.string().min(1) });

app.get('/projects/:key', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getProjectsKeyParamsSchema.parse(req.params);

  const key = params.key.toUpperCase();

  const result = await pool.query('SELECT id, key, name, created_at FROM projects WHERE key = $1', [
    key,
  ]);

  if (!result.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Project not found',
    });
  }

  const project = result.rows[0];
  return reply.send(project);
});

const createProjectBodySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});

app.post('/projects', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const body = createProjectBodySchema.parse(req.body);

  const key = body.key.toUpperCase();

  const result = await pool.query(
    'INSERT INTO projects (key, name) VALUES ($1, $2) RETURNING id, key, name, created_at',
    [key, body.name],
  );

  const project = result.rows[0];

  return reply.code(201).send(project);
});

// project - issues

const getIssuesQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.coerce.number().int().optional(),
  author_id: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
});

app.get('/projects/:key/issues', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getProjectsKeyParamsSchema.parse(req.params);
  const query = getIssuesQuerySchema.parse(req.query);

  const key = params.key.toUpperCase();

  const offset = (query.page - 1) * query.limit;

  const projectResult = await pool.query('SELECT id FROM projects WHERE key = $1', [key]);

  if (!projectResult.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Project not found',
    });
  }

  const projectId = projectResult.rows[0].id;

  const issuesTotalResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM issues WHERE project_id = $1 AND ($2::text IS NULL OR status = $2) AND ($3::text IS NULL OR priority = $3) AND ($4::bigint IS NULL OR author_id = $4) AND ($5::bigint IS NULL OR assignee_id = $5)',
    [projectId, query.status, query.priority, query.author_id, query.assignee_id],
  );

  const issuesTotal = issuesTotalResult.rows[0].total;

  if (!issuesTotal) {
    return reply.send({
      issues: [],
      meta: {
        total: 0,
        page: query.page,
        next_page: null,
        prev_page: null,
        limit: query.limit,
      },
    });
  }

  const issuesResult = await pool.query(
    'SELECT id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at FROM issues WHERE project_id = $1 AND ($2::text IS NULL OR status = $2) AND ($3::text IS NULL OR priority = $3) AND ($4::bigint IS NULL OR author_id = $4) AND ($5::bigint IS NULL OR assignee_id = $5) ORDER BY number LIMIT $6 OFFSET $7',
    [
      projectId,
      query.status,
      query.priority,
      query.author_id,
      query.assignee_id,
      query.limit,
      offset,
    ],
  );

  const issues = issuesResult.rows.map((i) => ({ key: `${key}-${i.number}`, ...i }));

  const hasNextPage = query.page * query.limit < issuesTotal;
  const hasPrevPage = query.page > 1;

  const nextPage = hasNextPage ? query.page + 1 : null;
  const prevPage = hasPrevPage ? query.page - 1 : null;

  return reply.send({
    issues,
    meta: {
      total: issuesTotal,
      page: query.page,
      next_page: nextPage,
      prev_page: prevPage,
      limit: query.limit,
    },
  });
});

const createIssueBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee_id: z.number().int().optional(),
});

app.post('/projects/:key/issues', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const params = getProjectsKeyParamsSchema.parse(req.params);
    const body = createIssueBodySchema.parse(req.body);

    const key = params.key.toUpperCase();

    const projectResult = await client.query('SELECT id FROM projects WHERE key = $1 FOR UPDATE', [
      key,
    ]);

    if (!projectResult.rows.length) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const projectId = projectResult.rows[0].id;

    const issuesNumberResult = await client.query(
      'SELECT COALESCE(MAX(number), 0) + 1 AS next_number FROM issues WHERE project_id = $1',
      [projectId],
    );

    const issuesNumber = issuesNumberResult.rows[0].next_number;

    const issuesResult = await client.query(
      'INSERT INTO issues (project_id, number, title, description, status, priority, author_id, assignee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at',
      [
        projectId,
        issuesNumber,
        body.title,
        body.description,
        'todo',
        body.priority,
        req.user.sub,
        body.assignee_id,
      ],
    );

    const issue = issuesResult.rows[0];

    await client.query('COMMIT');

    return reply.code(201).send({ key: `${key}-${issue.number}`, ...issue });
  } catch (err) {
    await client.query('ROLLBACK');

    if (err instanceof Error && err.message === 'PROJECT_NOT_FOUND') {
      return reply.code(404).send({
        error: 'not_found',
        message: 'Project not found',
      });
    }

    throw err;
  } finally {
    client.release();
  }
});

// issues

const getIssueIdParamsSchema = z.object({ id: z.coerce.number().int().min(1) });

app.get('/issues/:id', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);

  const issueId = params.id;

  const issueResult = await pool.query(
    'SELECT issues.id, issues.project_id, issues.number, issues.title, issues.description, issues.status, issues.priority, issues.author_id, issues.assignee_id, issues.created_at, issues.updated_at, projects.key AS project_key FROM issues JOIN projects ON projects.id = issues.project_id WHERE issues.id = $1',
    [issueId],
  );

  if (!issueResult.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  const { project_key, ...issue } = issueResult.rows[0];

  return reply.send({
    key: `${project_key}-${issue.number}`,
    ...issue,
  });
});

const updateIssueBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.number().int().nullable().optional(),
});

app.patch('/issues/:id', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const body = updateIssueBodySchema.parse(req.body);

    if (!Object.keys(body).length) {
      throw new Error('INVALID_PARAMS');
    }

    const params = getIssueIdParamsSchema.parse(req.params);

    const issueId = params.id;

    const issueResult = await client.query(
      'SELECT id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at FROM issues WHERE id = $1 FOR UPDATE',
      [issueId],
    );

    if (!issueResult.rows.length) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    const issue = issueResult.rows[0];

    const projectResult = await client.query('SELECT key FROM projects WHERE id = $1', [
      issue.project_id,
    ]);

    const projectKey = projectResult.rows[0].key;

    const issueKey = `${projectKey}-${issue.number}`;

    const changesKeys = Object.keys(body).filter(
      (key) => String(issue[key]) !== String(body[key as keyof typeof body]),
    );

    if (!changesKeys.length) {
      await client.query('COMMIT');

      return reply.send({
        key: issueKey,
        ...issue,
      });
    }

    const updateBody = {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assignee_id: issue.assignee_id,
      ...body,
    };

    const issueUpdateResult = await client.query(
      'UPDATE issues SET title = $1, description = $2, status = $3, priority = $4, assignee_id = $5, updated_at = now() WHERE id = $6 RETURNING id, project_id, number, title, description, status, priority, author_id, assignee_id, created_at, updated_at',
      [
        updateBody.title,
        updateBody.description,
        updateBody.status,
        updateBody.priority,
        updateBody.assignee_id,
        issueId,
      ],
    );

    const issueUpdated = issueUpdateResult.rows[0];

    for (const key of changesKeys) {
      await client.query(
        'INSERT INTO issue_events (issue_id, actor_id, field, old_value, new_value) VALUES ($1, $2, $3, $4, $5)',
        [issueId, req.user.sub, key, issue[key], body[key as keyof typeof body]],
      );
    }

    await client.query('COMMIT');

    return reply.send({
      key: issueKey,
      ...issueUpdated,
    });
  } catch (err) {
    await client.query('ROLLBACK');

    if (err instanceof Error) {
      if (err.message === 'INVALID_PARAMS') {
        return reply.code(400).send({
          error: 'validation',
          message: 'Invalid params',
        });
      }

      if (err.message === 'ISSUE_NOT_FOUND') {
        return reply.code(404).send({
          error: 'not_found',
          message: 'Issue not found',
        });
      }
    }

    throw err;
  } finally {
    client.release();
  }
});

const createCommentBodySchema = z.object({
  body: z.string().min(1),
});

//  issue - comments

app.get('/issues/:id/comments', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);
  const issueId = params.id;

  const issueResult = await pool.query('SELECT id FROM issues WHERE id = $1', [issueId]);

  if (!issueResult.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  const issueCommentsResult = await pool.query(
    'SELECT id, issue_id, author_id, body, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at',
    [issueId],
  );

  const comments = issueCommentsResult.rows;

  return reply.send(comments);
});

app.post('/issues/:id/comments', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);
  const body = createCommentBodySchema.parse(req.body);

  const issueId = params.id;

  const issueResult = await pool.query('SELECT id FROM issues WHERE id = $1', [issueId]);

  if (!issueResult.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  const issueCommentResult = await pool.query(
    'INSERT INTO comments (issue_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, issue_id, author_id, body, created_at',
    [issueId, req.user.sub, body.body],
  );

  const comment = issueCommentResult.rows[0];

  return reply.code(201).send(comment);
});

//  issue - events

app.get('/issues/:id/events', async (req, reply) => {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);
  const issueId = params.id;

  const issueResult = await pool.query('SELECT id FROM issues WHERE id = $1', [issueId]);

  if (!issueResult.rows.length) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  const issueEventsResult = await pool.query(
    'SELECT id, issue_id, actor_id, field, old_value, new_value, created_at FROM issue_events WHERE issue_id = $1 ORDER BY created_at',
    [issueId],
  );

  const events = issueEventsResult.rows;

  return reply.send(events);
});
