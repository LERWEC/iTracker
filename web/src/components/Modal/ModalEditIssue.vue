<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../../api';
import { IssuePriority, IssueStatus, type Issue, type User } from '../../types';

const PRIORITY_OPTIONS = [
  { value: IssuePriority.Low, label: 'Низкий' },
  { value: IssuePriority.Medium, label: 'Средний' },
  { value: IssuePriority.High, label: 'Высокий' },
  { value: IssuePriority.Critical, label: 'Критический' },
];

const STATUS_OPTIONS = [
  { value: IssueStatus.Todo, label: 'Новая' },
  { value: IssueStatus.InProgress, label: 'В работе' },
  { value: IssueStatus.InReview, label: 'На проверке' },
  { value: IssueStatus.Done, label: 'Выполнена' },
];

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { issue } = defineProps<{
  issue: Issue;
}>();

const showModal = defineModel<boolean>({ required: true });

const users = ref<User[]>([]);
const loading = ref(false);
const showErrorMessage = ref(false);

const form = ref<{
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignee_id: string;
}>({
  title: issue.title,
  description: issue.description,
  priority: issue.priority,
  status: issue.status,
  assignee_id: issue.assignee_id,
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
    console.log('form.value', form.value);
    await api.patch(`/issues/${issue.id}`, {
      ...form.value,
      description: form.value.description,
      assignee_id: form.value.assignee_id || null,
    });
    emit('success');
    showModal.value = false;
  } catch (error) {
    showErrorMessage.value = true;
    console.error(error);
  } finally {
    loading.value = false;
  }
};

watch(showModal, async (value: boolean) => {
  if (value) {
    console.log('showModal', value);
    form.value = {
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      assignee_id: issue.assignee_id,
    };
  }
});

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
  <UIModal v-model="showModal" title="Редактировать задачу">
    <div class="flex flex-col gap-4 py-4">
      <div v-if="showErrorMessage" class="text-error">
        <h3>Ошибка</h3>
        <p>Произошла ошибка при редактировании задачи</p>
      </div>
      <form v-if="!loading" @submit.prevent="submit" class="flex flex-col gap-4">
        <UIInput v-model="form.title" placeholder="Заголовок задачи" />
        <UIInput v-model="form.description" placeholder="Описание задачи" />
        <UISelect v-model="form.priority" :options="PRIORITY_OPTIONS" />
        <UISelect v-model="form.status" :options="STATUS_OPTIONS" />
        <UISelect v-model="form.assignee_id" :options="assignees" />
        <UIButton type="submit">Редактировать задачу</UIButton>
      </form>
      <UISpiner v-else />
    </div>
  </UIModal>
</template>
