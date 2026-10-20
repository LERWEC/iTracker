<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import { type Issue, type Meta, type Project } from '../types';

const projects = ref<Project[]>([]);
const projectActive = ref<Project | null>(null);
const issues = ref<Issue[]>([]);
const issueActive = ref<Issue | null>(null);
const page = ref(1);
const meta = ref<Meta | null>(null);
const loading = ref(true);
const showModalIssue = ref(false);
const showModalCreateIssue = ref(false);
const showModalCreateProject = ref(false);

const total = computed(() => {
  return meta.value?.total || 0;
});

const loadProjects = async () => {
  const responseProjects = await api.get('/projects');
  projects.value = [...responseProjects];
};

const loadIssues = async () => {
  if (!projectActive.value) {
    return;
  }

  const { issues: responseIssues, meta: responseMeta } = await api.get(
    `/projects/${projectActive.value.key}/issues?page=${page.value}`,
  );

  issues.value = [...responseIssues];
  meta.value = responseMeta;
};

const selectActiveProject = async (project: Project) => {
  projectActive.value = project;

  try {
    loading.value = true;
    await loadIssues();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const selectActiveIssue = (issue: Issue) => {
  issueActive.value = issue;
  showModalIssue.value = true;
};

const handleOpenCreateProject = () => {
  showModalCreateProject.value = true;
};

const handleOpenCreateIssue = () => {
  showModalCreateIssue.value = true;
};

const handleCreateIssue = async () => {
  showModalCreateIssue.value = false;
  try {
    await loadIssues();
  } catch (error) {
    console.error(error);
  }
};

const handleCreateProject = async () => {
  showModalCreateProject.value = false;
  try {
    await loadProjects();
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  try {
    loading.value = true;

    await loadProjects();

    if (!projects.value.length) {
      return;
    }

    projectActive.value = projects.value[0];

    await loadIssues();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="!loading" class="flex flex-col gap-4 h-full">
    <div class="flex items-center justify-between px-2 pb-2 border-b border-secondary">
      <div>
        <h3>Проекты:</h3>
        <div class="flex gap-4">
          <div
            v-for="project in projects"
            :key="project.id"
            class="cursor-pointer hover:text-primary p-2"
            :class="{
              'text-primary border-b border-primary rounded-md': projectActive?.id === project.id,
            }"
            @click="selectActiveProject(project)"
          >
            {{ project.key }}
          </div>
        </div>
      </div>
      <UIButton @click="handleOpenCreateProject">Создать проект</UIButton>
    </div>
    <div v-if="!projects.length">
      <p>Проекты не найдены</p>
    </div>
    <div v-else-if="!issues.length">
      <p>Задачи не найдены</p>
    </div>
    <div v-else class="flex flex-col justify-between h-full">
      <div class="flex flex-col gap-4">
        <h3 class="text-xl">{{ projectActive?.name }}: {{ total }} задач</h3>
        <div class="flex flex-col gap-2 justify-between">
          <div
            v-for="issue in issues"
            :key="issue.id"
            class="flex flex-col border border-secondary rounded-xl p-2 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all duration-300"
            @click="selectActiveIssue(issue)"
          >
            <h4 class="text-secondary">{{ issue.key }}</h4>
            <div class="flex items-center justify-between">
              <p class="text-lg">{{ issue.title }}</p>
              <div class="flex gap-2">
                <Status :status="issue.status" class="text-sm" />
                <Priority :priority="issue.priority" class="text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end">
        <UIButton @click="handleOpenCreateIssue">Создать задачу</UIButton>
      </div>
    </div>
    <ModalCreateProject v-model="showModalCreateProject" @success="handleCreateProject" />
    <ModalCreateIssue
      v-if="projectActive"
      v-model="showModalCreateIssue"
      :project-key="projectActive.key"
      @success="handleCreateIssue"
    />
    <ModalIssue
      v-if="issueActive && projectActive"
      v-model="showModalIssue"
      :issue-id="issueActive.id"
      :project-key="projectActive.key"
      :title="issueActive.title"
    />
  </div>
  <UISpiner v-else />
</template>
