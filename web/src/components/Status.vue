<script setup lang="ts">
import { IssueStatus } from '../types';

const STATUS = {
  [IssueStatus.Todo]: 'Новая',
  [IssueStatus.InProgress]: 'В работе',
  [IssueStatus.InReview]: 'На проверке',
  [IssueStatus.Done]: 'Выполнено',
};

defineProps<{
  status: IssueStatus;
}>();
</script>

<template>
  <p
    :class="{
      'text-secondary': status === IssueStatus.Todo,
      'text-primary': status === IssueStatus.InProgress,
      'text-info': status === IssueStatus.InReview,
      'text-success': status === IssueStatus.Done,
    }"
  >
    {{ STATUS[status] }}
  </p>
</template>
