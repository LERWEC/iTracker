import Fastify, { type FastifyError } from 'fastify';
import cookiePlugin from '@fastify/cookie';
import jwtPlugin from '@fastify/jwt';

import { pool } from './db';
import z from 'zod';

import { loginRoute, logoutRoute, meRoute, registerRoute } from './routes/auth'
import { createProjectRoute, getProjectRoute, listProjectsRoute } from './routes/projects';
import { changeIssueRoute, createIssueRoute, getIssueRoute, listIssuesRoute } from './routes/issues';
import { createCommentRoute, listCommentsRoute } from './routes/comments';
import { listIssueEventsRoute } from './routes/events';


declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
    };
  }
}

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

// auth
app.post('/auth/register', registerRoute);

app.post('/auth/login', loginRoute);

app.get('/auth/me', meRoute);

app.post('/auth/logout', logoutRoute);


// projects
app.get('/projects', listProjectsRoute);

app.get('/projects/:key', getProjectRoute);

app.post('/projects', createProjectRoute);


// issues
app.get('/issues/:id', getIssueRoute);

app.get('/projects/:key/issues', listIssuesRoute);

app.post('/projects/:key/issues', createIssueRoute);

app.patch('/issues/:id', changeIssueRoute);


//  comments
app.get('/issues/:id/comments', listCommentsRoute);

app.post('/issues/:id/comments', createCommentRoute);


//  events
app.get('/issues/:id/events', listIssueEventsRoute);
