import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { login, me, register } from '../services/auth';
import { requireAuth } from './requireAuth';

const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function registerRoute(req: FastifyRequest, reply: FastifyReply) {
  const body = registerBodySchema.parse(req.body);

  const user = await register(body);

  const token = await reply.jwtSign({ sub: user.id });

  reply.setCookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });

  return reply.code(201).send(user);
}

export async function loginRoute(req: FastifyRequest, reply: FastifyReply) {
  const body = loginBodySchema.parse(req.body);

  const user = await login(body);

  if (!user) {
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

  return reply.send(user);
}

export async function meRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const user = await me({ id: req.user.sub });

  if (!user) {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Invalid token',
    });
  }

  return reply.send(user);
}

export async function logoutRoute(_req: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie('token', { path: '/' });

  return { ok: true };
}