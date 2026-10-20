<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../../api';
import { IssuePriority, type User } from '../../types';

const PRIORITY_OPTIONS = [
  { value: IssuePriority.Low, label: 'Low' },
  { value: IssuePriority.Medium, label: 'Medium' },
  { value: IssuePriority.High, label: 'High' },
  { value: IssuePriority.Critical, label: 'Critical' },
];

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { projectKey } = defineProps<{
  projectKey: string;
}>();

const showModal = defineModel<boolean>({ required: true });

const users = ref<User[]>([]);
const loading = ref(false);
const showErrorMessage = ref(false);

const form = ref<{
  title: string;
  description: string;
  priority: IssuePriority;
  assignee_id: string;
}>({
  title: '',
  description: '',
  priority: IssuePriority.Medium,
  assignee_id: '',
});

const assignees = computed(() => {
  return [
    {
      value: '',
      label: 'Не назначен',
    },
    ...users.value.map((user) => ({
      value: user.id,
      label: user.name,
    })),
  ];
});

const submit = async () => {
  showErrorMessage.value = false;
  try {
    loading.value = true;

    await api.post(`/projects/${projectKey}/issues`, {
      ...form.value,
      description: form.value.description || undefined,
      assignee_id: form.value.assignee_id || undefined,
    });

    form.value = {
      title: '',
      description: '',
      priority: IssuePriority.Medium,
      assignee_id: '',
    };
    emit('success');
    showModal.value = false;
  } catch (error) {
    showErrorMessage.value = true;
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    loading.value = true;
    const usersResponse = await api.get(`/users`);
    users.value = [...usersResponse];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UIModal v-model="showModal" title="Создать задачу">
    <div class="flex flex-col gap-4 py-4">
      <div v-if="showErrorMessage" class="text-error">
        <h3>Ошибка</h3>
        <p>Произошла ошибка при создании задачи</p>
      </div>
      <form v-if="!loading" @submit.prevent="submit" class="flex flex-col gap-4">
        <UIInput v-model="form.title" placeholder="Заголовок задачи" />
        <UIInput v-model="form.description" placeholder="Описание задачи" />
        <UISelect v-model="form.priority" :options="PRIORITY_OPTIONS" />
        <UISelect v-model="form.assignee_id" :options="assignees" />
        <UIButton type="submit">Создать задачу</UIButton>
      </form>
      <UISpiner v-else />
    </div>
  </UIModal>
</template>
