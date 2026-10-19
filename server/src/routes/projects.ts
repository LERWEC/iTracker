import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { listProjects, getProject, createProject } from '../services/projects';
import { requireAuth } from './requireAuth';

export const getProjectKeyParamsSchema = z.object({ key: z.string().min(1) });

const createProjectBodySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});

export async function listProjectsRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const projects = await listProjects();

  return reply.send(projects);
};

export async function getProjectRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const params = getProjectKeyParamsSchema.parse(req.params);

  const project = await getProject(params);

  if (!project) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Project not found',
    });
  }

  return reply.send(project);
};

export async function createProjectRoute(req: FastifyRequest, reply: FastifyReply) {
  const ok = await requireAuth(req, reply);
  if (!ok) return;

  const body = createProjectBodySchema.parse(req.body);

  const project = await createProject(body);

  return reply.code(201).send(project);
};