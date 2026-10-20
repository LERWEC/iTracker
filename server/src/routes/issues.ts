import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { changeIssue, createIssue, getIssue, listIssues } from '../services/issues';
import { requireAuth } from './requireAuth';
import { getProjectKeyParamsSchema } from './projects';

export const getIssueIdParamsSchema = z.object({ id: z.string().regex(/^\d+$/) });

const getIssuesQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.string().regex(/^\d+$/).optional(),
  author_id: z.string().regex(/^\d+$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
});

const createIssueBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee_id: z.string().regex(/^\d+$/).optional(),
});

const changeIssueBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.string().regex(/^\d+$/).nullable().optional(),
});

export async function getIssueRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);

  const issue = await getIssue(params);

  if (!issue) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  return reply.send(issue);
}

export async function listIssuesRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const { key } = getProjectKeyParamsSchema.parse(req.params);
  const query = getIssuesQuerySchema.parse(req.query);

  const issues = await listIssues({ key, query });

  if (!issues) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Project not found',
    });
  }

  return reply.send(issues);
}

export async function createIssueRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const { key } = getProjectKeyParamsSchema.parse(req.params);
  const body = createIssueBodySchema.parse(req.body);

  try {
    const issue = await createIssue({ key, ...body, author_id: req.user.sub });
    return reply.code(201).send(issue);
  } catch (err) {
    if (err instanceof Error && err.message === 'PROJECT_NOT_FOUND') {
      return reply.code(404).send({
        error: 'not_found',
        message: 'Project not found',
      });
    }

    throw err;
  }
}

export async function changeIssueRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getIssueIdParamsSchema.parse(req.params);
  const body = changeIssueBodySchema.parse(req.body);

  try {
    const issue = await changeIssue({ id: params.id, actor_id: req.user.sub, body });
    return reply.send(issue);
  } catch (err) {
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
  }
}
