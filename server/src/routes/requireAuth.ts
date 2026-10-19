import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
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