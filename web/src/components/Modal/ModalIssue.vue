<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../../api';
import type {
  Issue,
  IssueComment,
  IssueEvent,
  IssuePriority,
  IssueStatus,
  User,
} from '../../types';

interface Props {
  issueId: string;
  title: string;
}

const { issueId, title } = defineProps<Props>();

const showModal = defineModel<boolean>({ required: true });

const issue = ref<Issue | null>(null);
const users = ref<User[]>([]);
const loading = ref(false);
const showModalEditIssue = ref(false);
const events = ref<IssueEvent[]>([]);
const comments = ref<IssueComment[]>([]);
const newComment = ref('');

const titleIssue = computed(() => {
  return issue.value?.title || title;
});

const author = computed(() => {
  return users.value.find((user) => user.id === issue.value?.author_id);
});

const assignee = computed(() => {
  return users.value.find((user) => user.id === issue.value?.assignee_id);
});

const getUserName = (actorId: string) => {
  return users.value.find((user) => user.id === actorId)?.name || '-';
};

const getFieldLabel = (field: string) => {
  switch (field) {
    case 'title':
      return 'Заголовок';
    case 'description':
      return 'Описание';
    case 'status':
      return 'Статус';
    case 'priority':
      return 'Приоритет';
    case 'assignee_id':
      return 'Исполнитель';
    default:
      return field;
  }
};

const getFieldValue = (event: IssueEvent, value: string | null) => {
  if (event.field === 'assignee_id') {
    return users.value.find((user) => user.id === value)?.name || '-';
  }

  return value ? `"${value}"` : '-';
};

const loadIssue = async () => {
  const issueResponse = await api.get(`/issues/${issueId}`);
  issue.value = issueResponse;
  const eventsResponse = await api.get(`/issues/${issueId}/events`);
  events.value = eventsResponse;
  const commentsResponse = await api.get(`/issues/${issueId}/comments`);
  comments.value = commentsResponse;
};

const handleEditIssue = () => {
  showModalEditIssue.value = true;
};

const handleEditIssueSuccess = async () => {
  showModalEditIssue.value = false;
  try {
    loading.value = true;
    await loadIssue();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAddComment = async () => {
  try {
    loading.value = true;
    await api.post(`/issues/${issueId}/comments`, {
      body: newComment.value,
    });
    newComment.value = '';
    await loadIssue();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

watch(showModal, async (value: boolean) => {
  if (value) {
    loading.value = true;
    try {
      await loadIssue();
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  } else {
    issue.value = null;
  }
});

onMounted(async () => {
  try {
    loading.value = true;
    const usersResponse = await api.get('/users');
    users.value = [...usersResponse];
    await loadIssue();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UIModal v-model="showModal" :title="titleIssue">
    <div class="flex flex-col gap-4 py-4">
      <UIButton v-if="issue" class="w-fit" @click="handleEditIssue">Редактировать</UIButton>
      <div v-if="loading" class="flex justify-center items-center">
        <UISpiner />
      </div>
      <div v-else-if="!issue" class="text-error">
        <p>Произошла ошибка при загрузке задачи</p>
      </div>
      <div v-else class="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div class="flex gap-2">
          <div class="flex flex-col gap-2 w-2/3 border-r px-4 border-primary rounded-r-xl">
            <p>
              Ключ: <span class="text-secondary">{{ issue?.key }}</span>
            </p>
            <div class="flex flex-col">
              <p>Описание:</p>
              <p>{{ issue?.description || '-' }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 flex-1 border-l px-4 border-primary rounded-l-xl">
            <div class="flex gap-1">
              <p>Статус:</p>
              <Status :status="issue?.status" />
            </div>
            <div class="flex gap-1">
              <p>Приоритет:</p>
              <Priority :priority="issue?.priority" />
            </div>
            <p>Автор: {{ author?.name }}</p>
            <p>Исполнитель: {{ assignee?.name || '-' }}</p>
          </div>
        </div>
        <div
          class="flex flex-col gap-2 p-2"
          :class="{ 'border-b border-primary rounded-b-xl': events.length }"
        >
          <h3>Комментарии:</h3>
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="flex flex-col border-b border-secondary p-2 last:border-b-0"
          >
            <p class="text-primary">{{ getUserName(comment.author_id) }}</p>
            <p>{{ comment.body }}</p>
            <div class="flex justify-end">
              <p class="text-secondary text-sm">{{ formatDate(comment.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2 py-2">
            <UIInput v-model="newComment" placeholder="Комментарий" />
            <UIButton @click="handleAddComment">Добавить</UIButton>
          </div>
        </div>
        <div
          v-if="events.length"
          class="flex flex-col gap-2 p-2 border-t border-primary rounded-t-xl"
        >
          <h3>История изменений:</h3>
          <div
            v-for="event in events"
            :key="event.id"
            class="px-1 pb-2 border-b border-secondary last:border-b-0"
          >
            <div v-if="event.field === 'status'" class="flex flex-col">
              <p>Автор: {{ getUserName(event.actor_id) }}</p>
              <div class="flex gap-1">
                <p>Статус:</p>
                <Status :status="event.old_value as IssueStatus" />
                <p>на</p>
                <Status :status="event.new_value as IssueStatus" />
              </div>
            </div>
            <div v-else-if="event.field === 'priority'" class="flex flex-col">
              <p>{{ getUserName(event.actor_id) }}</p>
              <div class="flex gap-1">
                <p>Приоритет:</p>
                <Priority :priority="event.old_value as IssuePriority" />
                <p>на</p>
                <Priority :priority="event.new_value as IssuePriority" />
              </div>
            </div>
            <div v-else-if="event.field === 'description'" class="flex flex-col">
              <p>Автор: {{ getUserName(event.actor_id) }}</p>
              <p>Описание</p>
            </div>
            <div v-else class="flex flex-col">
              <p>Автор: {{ getUserName(event.actor_id) }}</p>
              <p>
                {{ getFieldLabel(event.field) }}:
                {{ getFieldValue(event, event.old_value) }}
                на
                {{ getFieldValue(event, event.new_value) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ModalEditIssue
      v-if="issue"
      v-model="showModalEditIssue"
      :issue="issue"
      @success="handleEditIssueSuccess"
    />
  </UIModal>
</template>
