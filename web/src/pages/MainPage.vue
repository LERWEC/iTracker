<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import { IssuePriority, IssueStatus, type Issue, type Meta, type Project } from '../types';

const projects = ref<Project[]>([]);
const projectActive = ref<Project | null>(null);
const issues = ref<Issue[]>([]);
const page = ref(1);
const meta = ref<Meta | null>(null);
const loading = ref(true);

const total = computed(() => {
  return meta.value?.total || 0;
});

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

onMounted(async () => {
  try {
    loading.value = true;
    const responseProjects = await api.get('/projects');
    projects.value = [...responseProjects];

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
  <div v-if="!loading" class="flex flex-col gap-4">
    <div class="flex flex-col px-2 pb-2 border-b border-secondary">
      <h3>Проекты:</h3>
      <div class="flex gap-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="cursor-pointer hover:text-primary p-2"
          :class="{
            'text-primary border-b border-primary rounded-md': projectActive?.id === project.id,
          }"
          @click="selectActiveProject(project)">
          {{ project.key }}
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <h3 class="text-xl">{{ projectActive?.name }}: {{ total }} задач</h3>
      <div class="flex flex-col gap-2 justify-between">
        <div
          v-for="issue in issues"
          :key="issue.id"
          class="flex flex-col border border-secondary rounded-xl p-2 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all duration-300">
          <h4 class="text-secondary">{{ issue.key }}</h4>
          <div class="flex items-center justify-between">
            <p class="text-lg">{{ issue.title }}</p>
            <div class="flex gap-2">
              <p
                class="text-sm"
                :class="{
                  'text-secondary': issue.status === IssueStatus.Todo,
                  'text-primary': issue.status === IssueStatus.InProgress,
                  'text-info': issue.status === IssueStatus.InReview,
                  'text-success': issue.status === IssueStatus.Done,
                }">
                {{ issue.status }}
              </p>
              <p
                class="text-sm"
                :class="{
                  'text-info': issue.priority === IssuePriority.Low,
                  'text-success': issue.priority === IssuePriority.Medium,
                  'text-primary': issue.priority === IssuePriority.High,
                  'text-error': issue.priority === IssuePriority.Critical,
                }">
                {{ issue.priority }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
</template>
