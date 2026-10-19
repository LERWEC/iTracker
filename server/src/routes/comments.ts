import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { createComment, listComments } from "../services/comments";
import { requireAuth } from './requireAuth';
import { getIssueIdParamsSchema } from "./issues";

const createCommentBodySchema = z.object({
  body: z.string().min(1),
});

export async function listCommentsRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const { id: issue_id } = getIssueIdParamsSchema.parse(req.params);

  const comments = await listComments({ issue_id });

  if (!comments) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  return reply.send(comments);
}

export async function createCommentRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const { id: issue_id } = getIssueIdParamsSchema.parse(req.params);
  const { body } = createCommentBodySchema.parse(req.body);

  const comment = await createComment({ issue_id, author_id: req.user.sub, body });

  if (!comment) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  return reply.code(201).send(comment);
}