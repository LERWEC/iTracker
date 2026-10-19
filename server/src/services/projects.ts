import { insertProject, selectProject, selectProjects } from "../repositories/projects";

interface GetProjectParams {
  key: string;
}

interface CreateProjectParams {
  key: string;
  name: string;
}

export async function getProject(params: GetProjectParams) {
  const key = params.key.toUpperCase();

  return selectProject({ key });
}

export async function listProjects() {
  return selectProjects();
}

export async function createProject(params: CreateProjectParams) {
  const key = params.key.toUpperCase();
  const name = params.name;

  return insertProject({ key, name });
}