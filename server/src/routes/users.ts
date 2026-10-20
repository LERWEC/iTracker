import { FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from './requireAuth';
import { listUsers } from '../services/users';

export async function listUsersRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const users = await listUsers();

  return reply.send(users);
}
