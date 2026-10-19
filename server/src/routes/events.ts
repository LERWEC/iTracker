import { FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "./requireAuth";
import { getIssueIdParamsSchema } from "./issues";
import { listIssueEvents } from "../services/events";

export async function listIssueEventsRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const { id: issue_id } = getIssueIdParamsSchema.parse(req.params);

  const events = await listIssueEvents({ issue_id });

  if (!events) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Issue not found',
    });
  }

  return reply.send(events);
}